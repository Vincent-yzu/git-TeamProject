import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, date, jsonb } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import type { ItineraryBackend } from "../validation";
import type { ItineraryFrontend } from "../validation";


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


export const itineraries = pgTable("itineraries", {
  id: text("itinerary_id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  allowedEditors: jsonb("allowed_editors").$type<string[]>().notNull(),
  isPublic: boolean("is_public").notNull().default(false),
  isAuthorized: boolean("is_authorized").notNull().default(false),

  location: text("location").notNull(),
  description: text("description").notNull(),
  startDate: date("start_date", { mode: "date" }).notNull(),
  endDate: date("end_date", { mode: "date" }).notNull(),
  travelCategories: jsonb("travel_categories")
    .$type<ItineraryFrontend["travelCategories"]>()
    .notNull(),
  language: text("language").$type<ItineraryFrontend["language"]>().notNull(),

  days: jsonb("days").$type<ItineraryBackend>().notNull(),
})

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

export type Session = InferSelectModel<typeof sessions>
export type InsertSession = InferInsertModel<typeof sessions>
export type Verification = InferSelectModel<typeof verifications>
export type InsertVerification = InferInsertModel<typeof verifications>

export type Itinerary = InferSelectModel<typeof itineraries>;
