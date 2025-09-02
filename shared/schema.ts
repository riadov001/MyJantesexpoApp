import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  address: text("address"),
  role: text("role").default("client"), // client, admin, employee
  createdAt: timestamp("created_at").defaultNow(),
});

export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  image: text("image"),
  active: boolean("active").default(true),
});

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  serviceId: varchar("service_id").references(() => services.id).notNull(),
  date: text("date").notNull(),
  timeSlot: text("time_slot").notNull(),
  vehicleBrand: text("vehicle_brand").notNull(),
  vehiclePlate: text("vehicle_plate").notNull(),
  notes: text("notes"),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quotes = pgTable("quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  serviceId: varchar("service_id").references(() => services.id),
  vehicleBrand: text("vehicle_brand").notNull(),
  vehicleModel: text("vehicle_model").notNull(),
  vehicleYear: text("vehicle_year").notNull(),
  vehicleEngine: text("vehicle_engine"),
  description: text("description").notNull(),
  photos: jsonb("photos").default([]),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  quoteId: varchar("quote_id").references(() => quotes.id),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).default("20.00"),
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  photosBefore: jsonb("photos_before").default([]),
  photosAfter: jsonb("photos_after").default([]),
  workDetails: text("work_details"),
  status: text("status").default("unpaid"),
  emailSent: boolean("email_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // booking, quote, invoice, work_progress
  relatedId: varchar("related_id"), // ID of related booking/quote/invoice
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workProgress = pgTable("work_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => bookings.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  status: text("status").notNull(), // received, in_progress, quality_check, completed, ready_for_pickup
  description: text("description").notNull(),
  photos: jsonb("photos").default([]),
  estimatedCompletion: timestamp("estimated_completion"),
  updatedBy: varchar("updated_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const adminSettings = pgTable("admin_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertWorkProgressSchema = createInsertSchema(workProgress).omit({
  id: true,
  createdAt: true,
});

export const insertAdminSettingsSchema = createInsertSchema(adminSettings).omit({
  id: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit faire au moins 6 caractères"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type WorkProgress = typeof workProgress.$inferSelect;
export type InsertWorkProgress = z.infer<typeof insertWorkProgressSchema>;
export type AdminSettings = typeof adminSettings.$inferSelect;
export type InsertAdminSettings = z.infer<typeof insertAdminSettingsSchema>;
export type LoginData = z.infer<typeof loginSchema>;
