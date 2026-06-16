// WHAT: Categories controller â€” list, create, update, deactivate
// WHY: Category management for task discovery
// RULES: create/update/deactivate are admin-only

import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import db, { queryOne } from "../config/db";
import { v4 as uuidv4 } from "uuid";

// WHAT: List all active categories for task creation/filtering
// WHY: Display on frontend task forms and category pills
// CACHE: 1 hour â€” categories rarely change
export async function list(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await db.query<any>(
      `SELECT id, name, icon, description, sort_order 
       FROM categories 
       WHERE is_active = true 
       ORDER BY sort_order ASC, name ASC`,
    );

    // WHAT: Set cache header â€” categories are static enough to cache client-side
    // WHY: Reduce load and network round-trips; invalidate on admin category update
    res.set("Cache-Control", "public, max-age=3600");

    res.json(
      result.rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        icon: r.icon,
        description: r.description,
        sortOrder: r.sort_order,
      })),
    );
  } catch (error) {
    next(error);
  }
}

// WHAT: Create new task category [admin only]
// WHY: Allow platform admins to add category types (laundry, printing, errands, etc.)
// SECURITY: Requires admin role + valid inputs
export async function create(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return void res.status(400).json({ errors: errors.array() });
    }

    // WHAT: Check admin role
    // WHY: Only admins can create categories
    if (req.user?.role !== "admin") {
      return void res.status(403).json({ error: "Admin access required" });
    }

    const { name, icon, description, sortOrder } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();

    const created = await queryOne<any>(
      `INSERT INTO categories (id, name, icon, description, sort_order, is_active, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, true, $6, $7) 
       RETURNING id, name, icon, description, sort_order, is_active, created_at`,
      [id, name, icon, description || null, sortOrder ?? 0, now, now],
    );

    res.status(201).json({
      id: created.id,
      name: created.name,
      icon: created.icon,
      description: created.description,
      sortOrder: created.sort_order,
      isActive: created.is_active,
    });
  } catch (error) {
    next(error);
  }
}

// WHAT: Update category fields [admin only]
// WHY: Allow admins to rename, re-order, or update category details
// ALLOWED_FIELDS: name, icon, description, sort_order, is_active
export async function update(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return void res.status(400).json({ errors: errors.array() });
    }

    // WHAT: Check admin role
    if (req.user?.role !== "admin") {
      return void res.status(403).json({ error: "Admin access required" });
    }

    const { name, icon, description, sortOrder, isActive } = req.body;
    const setClauses: string[] = [];
    const params: any[] = [];
    let idx = 1;

    // WHAT: Build dynamic UPDATE only for provided fields
    // WHY: Partial updates without affecting unmodified fields
    if (name !== undefined) {
      setClauses.push(`name = $${idx++}`);
      params.push(name);
    }
    if (icon !== undefined) {
      setClauses.push(`icon = $${idx++}`);
      params.push(icon);
    }
    if (description !== undefined) {
      setClauses.push(`description = $${idx++}`);
      params.push(description);
    }
    if (sortOrder !== undefined) {
      setClauses.push(`sort_order = $${idx++}`);
      params.push(sortOrder);
    }
    if (isActive !== undefined) {
      setClauses.push(`is_active = $${idx++}`);
      params.push(isActive);
    }

    if (setClauses.length === 0) {
      return void res.status(400).json({ error: "No fields to update" });
    }

    // WHAT: Always update updated_at timestamp
    setClauses.push(`updated_at = $${idx++}`);
    params.push(new Date().toISOString());

    // WHAT: Add category ID to params
    params.push(req.params.id);

    const updated = await queryOne<any>(
      `UPDATE categories 
       SET ${setClauses.join(", ")} 
       WHERE id = $${idx} 
       RETURNING id, name, icon, description, sort_order, is_active, updated_at`,
      params,
    );

    if (!updated) {
      return void res.status(404).json({ error: "Category not found" });
    }

    res.json({
      id: updated.id,
      name: updated.name,
      icon: updated.icon,
      description: updated.description,
      sortOrder: updated.sort_order,
      isActive: updated.is_active,
      updatedAt: updated.updated_at,
    });
  } catch (error) {
    next(error);
  }
}

// WHAT: Soft-delete category (set is_active = false) [admin only]
// WHY: Allow admins to retire category without deleting historical data
// FUTURE: Check if any open tasks use this category before deactivating
export async function deactivate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return void res.status(400).json({ errors: errors.array() });
    }

    // WHAT: Check admin role
    if (req.user?.role !== "admin") {
      return void res.status(403).json({ error: "Admin access required" });
    }

    const categoryId = req.params.id;
    const now = new Date().toISOString();

    // FUTURE: Validate that no open tasks use this category
    // const openTasksCount = await queryOne(
    //   'SELECT COUNT(*) as count FROM tasks WHERE category_id = $1 AND status = \'open\'',
    //   [categoryId]
    // )
    // if (parseInt(openTasksCount.count) > 0) {
    //   return void res.status(400).json({ error: 'Cannot deactivate category with open tasks' })
    // }

    const deactivated = await queryOne<any>(
      `UPDATE categories 
       SET is_active = false, updated_at = $1 
       WHERE id = $2 
       RETURNING id, name, is_active, updated_at`,
      [now, categoryId],
    );

    if (!deactivated) {
      return void res.status(404).json({ error: "Category not found" });
    }

    res.json({
      id: deactivated.id,
      name: deactivated.name,
      isActive: deactivated.is_active,
      updatedAt: deactivated.updated_at,
    });
  } catch (error) {
    next(error);
  }
}
