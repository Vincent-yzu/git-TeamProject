import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, serial, integer, real } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";


// 用戶表
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  hashedPassword: text("hashed_password"),
  image: text("image"),
  name: text("name"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "date",
  })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "date",
  })
    .notNull()
    .$onUpdate(() => new Date()),
})

// 行程表
export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  editableList: text("editable_list"), // 可編輯用戶ID列表，可能是JSON格式
  viewableList: text("viewable_list"), // 可查看用戶ID列表，可能是JSON格式
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => new Date()),
});

// 子行程表
export const subTrips = pgTable("sub_trips", {
  id: serial("id").primaryKey(),
  date: timestamp("date", { withTimezone: true }).notNull(),
  tripId: integer("trip_id").notNull().references(() => trips.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => new Date()),
});

// 活動表
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  startTime: timestamp("start_time", { withTimezone: true }),
  estimatedDuration: integer("estimated_duration"), // 預估時間 (分鐘)
  attractionId: integer("attraction_id").references(() => attractions.id), // 參考景點表
  subTripId: integer("sub_trip_id").notNull().references(() => subTrips.id),
  note: text("note"), // 備註
  order: integer("order"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => new Date()),
});

// 景點表
export const attractions = pgTable("attractions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location"), // PostgreSQL 的點類型可能需要專用庫支援
  image: text("image"),
  rating: real("rating"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => new Date()),
});

// 花費表
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category"),
  amount: real("amount").notNull(),
  currency: text("currency"),
  activityId: integer("activity_id").notNull().references(() => activities.id),
  primaryUserId: text("primary_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => new Date()),
});

// 分攤花費表
export const expenseUsers = pgTable("expense_users", {
  id: serial("id").primaryKey(),
  expenseId: integer("expense_id").notNull().references(() => expenses.id),
  userId: text("user_id").notNull().references(() => users.id),
  amount: real("amount").notNull(),
});

// 留言表
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => trips.id),
  userId: text("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => new Date()),
});

export const sessions = pgTable("sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
})

export const verifications = pgTable("verifications", {
  token: text("token")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
})

export type User = InferSelectModel<typeof users>;
export type Trip = InferSelectModel<typeof trips>;
export type SubTrip = InferSelectModel<typeof subTrips>;
export type Activity = InferSelectModel<typeof activities>;
export type Attraction = InferSelectModel<typeof attractions>;
export type Expense = InferSelectModel<typeof expenses>;
export type ExpenseUser = InferSelectModel<typeof expenseUsers>;
export type Comment = InferSelectModel<typeof comments>;

export type Session = InferSelectModel<typeof sessions>
export type InsertSession = InferInsertModel<typeof sessions>
export type Verification = InferSelectModel<typeof verifications>
export type InsertVerification = InferInsertModel<typeof verifications>

export type InsertActivity = InferInsertModel<typeof activities>;