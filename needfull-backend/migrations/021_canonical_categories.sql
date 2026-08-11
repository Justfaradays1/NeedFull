-- WHAT: Align categories table with the canonical category config
-- WHY:  The DB still contains legacy seed categories (Water Fetching, Errands,
--       Load Carrying, Typing) that map to the "Other / Custom" fallback, so the
--       task-create page renders "Other / Custom" five times. Replace the four
--       legacy rows with the missing canonical categories (delivery, shopping,
--       tech, photography, repairs, moving) and standardize names/icons/order.
-- SAFE: All four deleted rows have zero task/offer references (verified). Ids of
--       kept rows are preserved, so existing tasks keep their category linkage.

-- 1) Standardize the kept categories to canonical names + icons + slugs
UPDATE categories SET name = 'Laundry & Washing',    icon = '🧺', slug = 'laundry'    WHERE name = 'Laundry';
UPDATE categories SET name = 'Home Cleaning',        icon = '🧹', slug = 'cleaning'   WHERE name = 'Cleaning';
UPDATE categories SET name = 'Printing & Documents', icon = '🖨', slug = 'printing'   WHERE name = 'Printing';
UPDATE categories SET name = 'Food & Grocery',       icon = '🍔', slug = 'food'       WHERE name = 'Food';
UPDATE categories SET name = 'Tutoring & Academic',  icon = '📚', slug = 'academic'   WHERE name = 'Tutoring';
UPDATE categories SET name = 'Design & Creative',    icon = '🎨', slug = 'design'     WHERE name = 'Design';
UPDATE categories SET name = 'Other / Custom',       icon = '✨', slug = 'other'      WHERE name = 'Other';

-- 2) Remove legacy categories that collapsed into the "other" fallback
DELETE FROM categories WHERE name IN ('Water Fetching', 'Errands', 'Load Carrying', 'Typing');

-- 3) Insert the missing canonical categories (guarded for re-runs)
INSERT INTO categories (id, name, slug, icon, description, sort_order, is_active, created_at)
SELECT gen_random_uuid(), 'Delivery & Pickup', 'delivery', '🛵', 'Deliver packages, documents and items.', 20, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Delivery & Pickup');

INSERT INTO categories (id, name, slug, icon, description, sort_order, is_active, created_at)
SELECT gen_random_uuid(), 'Shopping & Errands', 'shopping', '🛒', 'Get someone to shop or run errands.', 30, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Shopping & Errands');

INSERT INTO categories (id, name, slug, icon, description, sort_order, is_active, created_at)
SELECT gen_random_uuid(), 'Tech Support', 'techsupport', '💻', 'Get help with devices, software and technology.', 40, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Tech Support');

INSERT INTO categories (id, name, slug, icon, description, sort_order, is_active, created_at)
SELECT gen_random_uuid(), 'Photography', 'photography', '📷', 'Event photography, portraits, product photos.', 50, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Photography');

INSERT INTO categories (id, name, slug, icon, description, sort_order, is_active, created_at)
SELECT gen_random_uuid(), 'Repairs & Maintenance', 'repairs', '🛠', 'Fix appliances, furniture, plumbing, electrical.', 60, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Repairs & Maintenance');

INSERT INTO categories (id, name, slug, icon, description, sort_order, is_active, created_at)
SELECT gen_random_uuid(), 'Furniture & Item Moving', 'moving', '📦', 'Move belongings, furniture and other items.', 70, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Furniture & Item Moving');

-- 4) Canonical display order 1..13
UPDATE categories SET sort_order = 1  WHERE name = 'Laundry & Washing';
UPDATE categories SET sort_order = 2  WHERE name = 'Delivery & Pickup';
UPDATE categories SET sort_order = 3  WHERE name = 'Home Cleaning';
UPDATE categories SET sort_order = 4  WHERE name = 'Printing & Documents';
UPDATE categories SET sort_order = 5  WHERE name = 'Food & Grocery';
UPDATE categories SET sort_order = 6  WHERE name = 'Shopping & Errands';
UPDATE categories SET sort_order = 7  WHERE name = 'Tech Support';
UPDATE categories SET sort_order = 8  WHERE name = 'Design & Creative';
UPDATE categories SET sort_order = 9  WHERE name = 'Photography';
UPDATE categories SET sort_order = 10 WHERE name = 'Repairs & Maintenance';
UPDATE categories SET sort_order = 11 WHERE name = 'Furniture & Item Moving';
UPDATE categories SET sort_order = 12 WHERE name = 'Tutoring & Academic';
UPDATE categories SET sort_order = 13 WHERE name = 'Other / Custom';