import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
});

// Client schema
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  classification: text("classification").notNull().default("residential"), // residential, commercial, industrial
  createdAt: timestamp("created_at").notNull().defaultNow(),
  notes: text("notes"),
});

export const insertClientSchema = createInsertSchema(clients).pick({
  name: true,
  email: true,
  phone: true,
  address: true,
  classification: true,
  notes: true,
});

// Project schema
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  address: text("address").notNull(),
  serviceType: text("service_type").notNull(),
  status: text("status").notNull().default("pending"), // pending, quoted, approved, preparing, in_progress, reviewing, completed, archived
  priority: text("priority").notNull().default("medium"), // low, medium, high
  progress: integer("progress").default(0),
  startDate: timestamp("start_date"),
  dueDate: timestamp("due_date"),
  completedDate: timestamp("completed_date"),
  totalCost: integer("total_cost"),
  assignedStaff: jsonb("assigned_staff"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  images: jsonb("images"),
});

// Esquema base para proyectos
const baseProjectSchema = createInsertSchema(projects).pick({
  clientId: true,
  title: true,
  description: true,
  address: true,
  serviceType: true,
  status: true,
  priority: true,
  progress: true,
  totalCost: true,
  assignedStaff: true,
  images: true,
});

// Añadir validación personalizada para fechas
export const insertProjectSchema = baseProjectSchema.extend({
  startDate: z.union([
    z.date(),
    z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "La fecha de inicio debe ser válida"
    }).transform(val => new Date(val)),
    z.null(),
    z.undefined()
  ]).optional(),
  dueDate: z.union([
    z.date(),
    z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "La fecha de entrega debe ser válida"
    }).transform(val => new Date(val)),
    z.null(),
    z.undefined()
  ]).optional(),
});

// Quote schema
export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  materialsEstimate: jsonb("materials_estimate"),
  laborEstimate: jsonb("labor_estimate"),
  totalEstimate: integer("total_estimate").notNull(),
  status: text("status").notNull().default("draft"), // draft, sent, approved, rejected
  sentDate: timestamp("sent_date"),
  validUntil: timestamp("valid_until"),
  approvedDate: timestamp("approved_date"),
  rejectedDate: timestamp("rejected_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Esquema base para cotizaciones
const baseQuoteSchema = createInsertSchema(quotes).pick({
  projectId: true,
  materialsEstimate: true,
  laborEstimate: true,
  totalEstimate: true,
  status: true,
  notes: true,
});

// Añadir validación personalizada para fechas
export const insertQuoteSchema = baseQuoteSchema.extend({
  sentDate: z.union([
    z.date(),
    z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "La fecha de envío debe ser válida"
    }).transform(val => new Date(val)),
    z.null(),
    z.undefined()
  ]).optional(),
  validUntil: z.union([
    z.date(),
    z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "La fecha de validez debe ser válida"
    }).transform(val => new Date(val)),
    z.null(),
    z.undefined()
  ]).optional(),
});

// Subcontractor schema
export const subcontractors = pgTable("subcontractors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  company: text("company"),
  specialty: text("specialty").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  address: text("address"),
  taxId: text("tax_id"),
  insuranceInfo: text("insurance_info"),
  rate: real("rate"),
  rateType: text("rate_type").default("hourly"), // hourly, daily, fixed
  notes: text("notes"),
  status: text("status").default("active").notNull(), // active, inactive, blacklisted
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSubcontractorSchema = createInsertSchema(subcontractors).pick({
  name: true,
  company: true,
  specialty: true,
  email: true,
  phone: true,
  address: true,
  taxId: true,
  insuranceInfo: true,
  rate: true,
  rateType: true,
  notes: true,
  status: true,
});

// Service Order schema - actualizado con idioma, subcontratistas y supervisor
export const serviceOrders = pgTable("service_orders", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  details: text("details").notNull(),
  assignedStaff: jsonb("assigned_staff"),
  assignedSubcontractorId: integer("assigned_subcontractor_id"), // ID del subcontratista principal
  supervisorId: integer("supervisor_id"), // ID del miembro del personal que supervisa
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed
  beforeImages: jsonb("before_images"),
  afterImages: jsonb("after_images"),
  clientSignature: text("client_signature"),
  signatureDate: timestamp("signature_date"),
  language: text("language").default("english").notNull(), // Nuevo campo para idioma: english, spanish
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Esquema base para órdenes de servicio
const baseServiceOrderSchema = createInsertSchema(serviceOrders).pick({
  projectId: true,
  details: true,
  assignedStaff: true,
  assignedSubcontractorId: true,
  supervisorId: true,
  status: true,
  beforeImages: true,
  afterImages: true,
  clientSignature: true,
  language: true,
});

// Añadir validación personalizada para fechas
export const insertServiceOrderSchema = baseServiceOrderSchema.extend({
  startDate: z.union([
    z.date(),
    z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "La fecha de inicio debe ser válida"
    }).transform(val => new Date(val)),
    z.null(),
    z.undefined()
  ]).optional(),
  endDate: z.union([
    z.date(),
    z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "La fecha de finalización debe ser válida"
    }).transform(val => new Date(val)),
    z.null(),
    z.undefined()
  ]).optional(),
  signatureDate: z.union([
    z.date(),
    z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "La fecha de firma debe ser válida"
    }).transform(val => new Date(val)),
    z.null(),
    z.undefined()
  ]).optional(),
});

// Staff schema
export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  availability: text("availability").notNull().default("available"), // available, assigned, on_leave
  skills: jsonb("skills"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertStaffSchema = createInsertSchema(staff).pick({
  name: true,
  role: true,
  email: true,
  phone: true,
  availability: true,
  skills: true,
  avatar: true,
});

// Activity schema
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // project_update, client_added, quote_sent, etc.
  description: text("description").notNull(),
  userId: integer("user_id"),
  projectId: integer("project_id"),
  clientId: integer("client_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  type: true,
  description: true,
  userId: true,
  projectId: true,
  clientId: true,
});

// Definir relaciones entre tablas
export const clientsRelations = relations(clients, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
  serviceOrders: many(serviceOrders),
  quotes: many(quotes),
}));

export const serviceOrdersRelations = relations(serviceOrders, ({ one }) => ({
  project: one(projects, {
    fields: [serviceOrders.projectId],
    references: [projects.id],
  }),
  subcontractor: one(subcontractors, {
    fields: [serviceOrders.assignedSubcontractorId],
    references: [subcontractors.id],
  }),
  supervisor: one(staff, {
    fields: [serviceOrders.supervisorId],
    references: [staff.id],
  }),
}));

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;

export type Subcontractor = typeof subcontractors.$inferSelect;
export type InsertSubcontractor = z.infer<typeof insertSubcontractorSchema>;

export type ServiceOrder = typeof serviceOrders.$inferSelect;
export type InsertServiceOrder = z.infer<typeof insertServiceOrderSchema>;

export type Staff = typeof staff.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

// Session schema (para manejar las sesiones de connect-pg-simple)
export const session = pgTable("session", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});
