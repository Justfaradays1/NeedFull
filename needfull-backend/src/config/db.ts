// WHAT: PostgreSQL connection pool and query helpers with transaction support
// WHY: Centralises database access, provides typed query helpers, enforces transaction safety with automatic rollback on error
// FUTURE: Add connection retry logic, add slow query logging, add query performance monitoring, add connection health checks

import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";
import env from "./env.js";

// WHAT: Create pg Pool with environment configuration
// WHY: Connection pooling prevents exhausting database connections, reuses connections for efficiency
const db = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.DATABASE_POOL_MAX,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// WHAT: Log pool errors (connection failures, timeout, unexpected errors)
// WHY: Early warning of database issues, helps debug production problems
db.on("error", (error) => {
  console.error("Unexpected pool error:", error);
});

db.on("connect", () => {
  console.log("✓ Database pool connection created");
});

// WHAT: Generic typed query helper
// WHY: Provides autocomplete and type safety for query results
// USAGE: const users = await query<User>('SELECT * FROM users WHERE id = $1', [userId])
export async function query<T extends QueryResultRow>(
  sql: string,
  values?: (string | number | boolean | null)[],
): Promise<QueryResult<T>> {
  try {
    return await db.query<T>(sql, values);
  } catch (error) {
    console.error("Database query error:", { sql, error });
    throw error;
  }
}

// WHAT: Query helper that returns single row or throws 404
// WHY: Prevents null-check boilerplate, enforces that caller expects exactly one result
// USAGE: const user = await queryOne<User>('SELECT * FROM users WHERE id = $1', [userId])
export async function queryOne<T extends QueryResultRow>(
  sql: string,
  values?: (string | number | boolean | null)[],
): Promise<T> {
  try {
    const result = await db.query<T>(sql, values);
    if (result.rows.length === 0) {
      const error = new Error("Not found");
      (error as any).statusCode = 404;
      throw error;
    }
    return result.rows[0];
  } catch (error) {
    if ((error as any).statusCode === 404) {
      throw error;
    }
    console.error("Database queryOne error:", { sql, error });
    throw error;
  }
}

// WHAT: Execute callback within a database transaction (BEGIN/COMMIT/ROLLBACK)
// WHY: Ensures atomicity of multi-step operations (e.g., task completion: mark done, move escrow, award loyalty credits)
// USAGE: await withTransaction(async (client) => {
//   await client.query('UPDATE tasks SET status = $1 WHERE id = $2', ['completed', taskId]);
//   await client.query('INSERT INTO wallet_transactions ...');
// })
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Transaction error:", error);
    throw error;
  } finally {
    client.release();
  }
}

export default db;
