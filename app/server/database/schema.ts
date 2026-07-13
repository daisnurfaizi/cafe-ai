import {
  mysqlTable,
  varchar,
  int,
  boolean,
  datetime,
  text,
} from 'drizzle-orm/mysql-core';
import { relations, sql } from 'drizzle-orm';

// ─── Users Table ────────────────────────────────────────────
export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('user'),
  createdAt: datetime('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: datetime('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// ─── API Keys Table ─────────────────────────────────────────
export const apiKeys = mysqlTable('api_keys', {
  id: varchar('id', { length: 36 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: varchar('user_id', { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  litellmKeyId: varchar('litellm_key_id', { length: 255 }),
  apiKey: varchar('api_key', { length: 255 }).notNull(),
  maxTokens: int('max_tokens').notNull().default(1_000_000),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: datetime('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// ─── Relations ──────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  apiKeys: many(apiKeys),
  chats: many(chats),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));

// ─── Chats Table ────────────────────────────────────────────
export const chats = mysqlTable('chats', {
  id: varchar('id', { length: 36 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: varchar('user_id', { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull().default('New Chat'),
  createdAt: datetime('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: datetime('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// ─── Messages Table ─────────────────────────────────────────
export const messages = mysqlTable('messages', {
  id: varchar('id', { length: 36 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  chatId: varchar('chat_id', { length: 36 })
    .notNull()
    .references(() => chats.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).notNull(), // 'user' or 'assistant'
  content: text('content').notNull(), // text content
  createdAt: datetime('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// ─── Chat Relations ─────────────────────────────────────────
export const chatsRelations = relations(chats, ({ one, many }) => ({
  user: one(users, {
    fields: [chats.userId],
    references: [users.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
}));

// ─── Type Inference ─────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
