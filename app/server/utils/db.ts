import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../database/schema';

/**
 * Singleton database connection.
 * Auto-imported in Nitro server routes via server/utils/ convention.
 */
const connection = postgres(process.env.DATABASE_URL!, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(connection, { schema });
