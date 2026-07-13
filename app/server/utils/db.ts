import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from '../database/schema';

/**
 * Singleton database connection.
 * Auto-imported in Nitro server routes via server/utils/ convention.
 * Drizzle creates a mysql2 pool from the connection string automatically.
 */
export const db = drizzle(process.env.DATABASE_URL!, { schema, mode: 'default' });
