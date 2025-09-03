import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, jsonb, boolean, uniqueIndex } from "drizzle-orm/pg-core";
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
  clientType: text("client_type").default("particulier"), // particulier, professionnel
  // Informations société (pour clients professionnels)
  companyName: text("company_name"),
  companyAddress: text("company_address"),
  companySiret: text("company_siret"),
  companyVat: text("company_vat"),
  companyApe: text("company_ape"),
  companyContact: text("company_contact"), // Nom du contact dans l'entreprise
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
  // Nouvelles colonnes pour plages horaires libres (optionnelles pour migration progressive)
  startDateTime: timestamp("start_date_time"),
  endDateTime: timestamp("end_date_time"),
  // Anciennes colonnes maintenues pour compatibilité (seront supprimées plus tard)
  date: text("date"),
  timeSlot: text("time_slot"),
  vehicleBrand: text("vehicle_brand").notNull(),
  vehiclePlate: text("vehicle_plate").notNull(),
  // Nouvelles colonnes pour jantes
  wheelQuantity: integer("wheel_quantity"), // Nombre de jantes (2 ou 4)
  wheelDiameter: text("wheel_diameter"), // Diamètre en pouces
  notes: text("notes"),
  status: text("status").default("pending"),
  assignedEmployee: varchar("assigned_employee").references(() => users.id),
  estimatedDuration: integer("estimated_duration"), // en minutes
  lastModifiedBy: varchar("last_modified_by").references(() => users.id),
  googleCalendarEventId: text("google_calendar_event_id"), // ID de l'événement Google Calendar
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const quotes = pgTable("quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  serviceId: varchar("service_id").references(() => services.id),
  vehicleBrand: text("vehicle_brand").notNull(),
  vehicleModel: text("vehicle_model").notNull(),
  vehicleYear: text("vehicle_year").notNull(),
  vehicleEngine: text("vehicle_engine"),
  // Nouvelles colonnes pour jantes
  wheelQuantity: integer("wheel_quantity"), // Nombre de jantes (2 ou 4)
  wheelDiameter: text("wheel_diameter"), // Diamètre en pouces
  description: text("description").notNull(),
  photos: jsonb("photos").default([]),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  status: text("status").default("pending"),
  lastModifiedBy: varchar("last_modified_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  quoteId: varchar("quote_id").references(() => quotes.id),
  invoiceNumber: text("invoice_number"), // Numéro de facture auto-généré
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).default("20.00"),
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  // Détails des articles/services
  items: jsonb("items").default([]), // Array of {description, quantity, unitPrice, total}
  // Informations véhicule
  vehicleBrand: text("vehicle_brand"),
  vehicleModel: text("vehicle_model"),
  vehiclePlate: text("vehicle_plate"),
  vehicleYear: text("vehicle_year"),
  // Photos et détails du travail
  photosBefore: jsonb("photos_before").default([]),
  photosAfter: jsonb("photos_after").default([]),
  workDetails: text("work_details"),
  // Conditions de paiement
  paymentTerms: text("payment_terms").default("Paiement à réception"),
  dueDate: timestamp("due_date"),
  // Statut et suivi
  status: text("status").default("unpaid"),
  emailSent: boolean("email_sent").default(false),
  lastModifiedBy: varchar("last_modified_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  googleCalendarTokens: text("google_calendar_tokens"), // Tokens OAuth Google Calendar
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Table d'audit pour tracer toutes les actions
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  action: text("action").notNull(), // create, update, delete, status_change, email_sent, etc.
  entityType: text("entity_type").notNull(), // booking, quote, invoice, user, etc.
  entityId: varchar("entity_id").notNull(),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Ajouter un système d'assignation d'employés aux réservations
export const bookingAssignments = pgTable("booking_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => bookings.id).notNull(),
  employeeId: varchar("employee_id").references(() => users.id).notNull(),
  assignedBy: varchar("assigned_by").references(() => users.id).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
  notes: text("notes"),
});

export const timeSlotConfigs = pgTable("time_slot_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: varchar("date").notNull(), // Format: YYYY-MM-DD
  timeSlot: varchar("time_slot").notNull(), // Format: HH:MM
  maxCapacity: integer("max_capacity").notNull().default(2), // Nombre max de réservations
  isActive: boolean("is_active").notNull().default(true),
  reason: text("reason"), // Raison si désactivé (congé, etc.)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  dateTimeIndex: uniqueIndex("date_time_idx").on(table.date, table.timeSlot),
}));

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
  updatedAt: true,
  lastModifiedBy: true,
  googleCalendarEventId: true,
  // Omettre les anciennes colonnes de compatibilité
  date: true,
  timeSlot: true,
}).extend({
  // Validation personnalisée pour les nouvelles colonnes
  startDateTime: z.string().min(1, "Heure de début requise"),
  endDateTime: z.string().min(1, "Heure de fin requise"),
}).refine((data) => {
  const start = new Date(data.startDateTime);
  const end = new Date(data.endDateTime);
  return start < end;
}, {
  message: "L'heure de fin doit être après l'heure de début",
  path: ["endDateTime"],
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

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertBookingAssignmentSchema = createInsertSchema(bookingAssignments).omit({
  id: true,
  assignedAt: true,
});

export const insertTimeSlotConfigSchema = createInsertSchema(timeSlotConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit faire au moins 6 caractères"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis"),
  newPassword: z.string().min(6, "Le nouveau mot de passe doit faire au moins 6 caractères"),
  confirmPassword: z.string().min(6, "Confirmation requise"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export const updateClientProfileSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  phone: z.string().optional(),
  address: z.string().optional(),
  clientType: z.enum(["particulier", "professionnel"]),
  // Champs société (optionnels, requis seulement si professionnel)
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  companySiret: z.string().optional(),
  companyVat: z.string().optional(),
  companyApe: z.string().optional(),
  companyContact: z.string().optional(),
}).refine((data) => {
  if (data.clientType === "professionnel") {
    return data.companyName && data.companyName.length > 0;
  }
  return true;
}, {
  message: "Nom de l'entreprise requis pour les clients professionnels",
  path: ["companyName"],
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
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type BookingAssignment = typeof bookingAssignments.$inferSelect;
export type InsertBookingAssignment = z.infer<typeof insertBookingAssignmentSchema>;
export type TimeSlotConfig = typeof timeSlotConfigs.$inferSelect;
export type InsertTimeSlotConfig = z.infer<typeof insertTimeSlotConfigSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;
export type UpdateClientProfileData = z.infer<typeof updateClientProfileSchema>;
