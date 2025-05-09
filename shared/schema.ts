import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, real, decimal } from "drizzle-orm/pg-core";
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

// Service Order schema - actualizado con campos adicionales
export const serviceOrders = pgTable("service_orders", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  details: text("details").notNull(),
  assignedStaff: jsonb("assigned_staff"),
  assignedSubcontractors: jsonb("assigned_subcontractors"), // Lista de subcontratistas asignados
  assignedSubcontractorId: integer("assigned_subcontractor_id"), // ID del subcontratista principal
  supervisorId: integer("supervisor_id"), // ID del miembro del personal que supervisa
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  dueDate: timestamp("due_date"), // Fecha límite
  status: text("status").notNull().default("pending"), // pending, in_progress, completed
  beforeImages: jsonb("before_images"),
  afterImages: jsonb("after_images"),
  clientSignature: text("client_signature"),
  signedDate: timestamp("signed_date"), // Cambio de nombre para ser más claro
  materialsRequired: text("materials_required"), // Lista de materiales requeridos
  specialInstructions: text("special_instructions"), // Instrucciones especiales
  safetyRequirements: text("safety_requirements"), // Requisitos de seguridad
  assignedTo: integer("assigned_to"), // ID del staff o subcontratista asignado como principal
  assignedType: text("assigned_type"), // Tipo de asignación: 'staff' o 'subcontractor'
  language: text("language").default("english").notNull(), // english, spanish
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Esquema base para órdenes de servicio
const baseServiceOrderSchema = createInsertSchema(serviceOrders).pick({
  projectId: true,
  details: true,
  assignedStaff: true,
  assignedSubcontractors: true, // Lista de subcontratistas asignados
  assignedSubcontractorId: true,
  supervisorId: true,
  status: true,
  beforeImages: true,
  afterImages: true,
  clientSignature: true,
  language: true,
  // Nuevos campos
  materialsRequired: true,
  specialInstructions: true,
  safetyRequirements: true,
  assignedTo: true,
  assignedType: true,
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
  dueDate: z.union([
    z.date(),
    z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "La fecha límite debe ser válida"
    }).transform(val => new Date(val)),
    z.null(),
    z.undefined()
  ]).optional(),
  signedDate: z.union([
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

// Invoice schema
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  clientId: integer("client_id").notNull(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("draft"), // draft, sent, paid, overdue, cancelled
  items: jsonb("items").notNull(), // Array of items with descriptions and amounts
  issueDate: timestamp("issue_date"),
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  paymentMethod: text("payment_method"), // cash, check, credit_card, bank_transfer, stripe
  transactionId: text("transaction_id"), // For electronic payments
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  stripePaymentIntentId: text("stripe_payment_intent_id"), // For Stripe integration
  stripeInvoiceId: text("stripe_invoice_id"), // For Stripe integration
});

// Esquema base para facturas
const baseInvoiceSchema = createInsertSchema(invoices).pick({
  projectId: true,
  clientId: true,
  invoiceNumber: true,
  amount: true,
  tax: true,
  totalAmount: true,
  status: true,
  items: true,
  paymentMethod: true,
  transactionId: true,
  notes: true,
  stripePaymentIntentId: true,
  stripeInvoiceId: true,
});

// Añadir validación personalizada para fechas
export const insertInvoiceSchema = baseInvoiceSchema.extend({
  issueDate: z.union([
    z.date(),
    z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Issue date must be valid"
    }).transform(val => new Date(val)),
    z.null(),
    z.undefined()
  ]).optional(),
  dueDate: z.union([
    z.date(),
    z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Due date must be valid"
    }).transform(val => new Date(val)),
    z.null(),
    z.undefined()
  ]).optional(),
  paidDate: z.union([
    z.date(),
    z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Paid date must be valid"
    }).transform(val => new Date(val)),
    z.null(),
    z.undefined()
  ]).optional(),
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
  invoices: many(invoices),
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

export const invoicesRelations = relations(invoices, ({ one }) => ({
  project: one(projects, {
    fields: [invoices.projectId],
    references: [projects.id],
  }),
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
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

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

// Suppliers schema
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  company: text("company").notNull(),
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone").notNull(),
  address: text("address"),
  taxId: text("tax_id"),
  category: text("category").notNull(), // paint, tools, materials, hardware, etc.
  paymentTerms: text("payment_terms"), // net30, net60, cod, etc.
  website: text("website"),
  notes: text("notes"),
  status: text("status").default("active").notNull(), // active, inactive
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSupplierSchema = createInsertSchema(suppliers).pick({
  name: true,
  company: true,
  contactPerson: true,
  email: true,
  phone: true,
  address: true,
  taxId: true,
  category: true,
  paymentTerms: true,
  website: true,
  notes: true,
  status: true,
});

// Payment schema
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").notNull().defaultNow(),
  description: text("description").notNull(),
  paymentType: text("payment_type").notNull(), // invoice, subcontractor, staff, supplier
  status: text("status").notNull().default("pending"), // pending, completed, cancelled
  recipientType: text("recipient_type").notNull(), // subcontractor, staff, supplier
  recipientId: integer("recipient_id").notNull(),
  projectId: integer("project_id").references(() => projects.id),
  serviceOrderId: integer("service_order_id").references(() => serviceOrders.id),
  invoiceId: integer("invoice_id").references(() => invoices.id),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  amount: true,
  date: true,
  description: true,
  paymentType: true,
  status: true,
  recipientType: true,
  recipientId: true,
  projectId: true,
  serviceOrderId: true,
  invoiceId: true,
  createdBy: true,
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  project: one(projects, {
    fields: [payments.projectId],
    references: [projects.id],
  }),
  serviceOrder: one(serviceOrders, {
    fields: [payments.serviceOrderId],
    references: [serviceOrders.id],
  }),
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  createdByUser: one(users, {
    fields: [payments.createdBy],
    references: [users.id],
  }),
}));

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

// Purchase Order schema
export const purchaseOrders = pgTable('purchase_orders', {
  id: serial('id').primaryKey(),
  supplierId: integer('supplier_id').notNull().references(() => suppliers.id),
  orderNumber: text('order_number').notNull(),
  issueDate: timestamp('issue_date').notNull().defaultNow(),
  projectId: integer('project_id').references(() => projects.id),
  quoteId: integer('quote_id').references(() => quotes.id),
  deliveryConditions: text('delivery_conditions'),
  paymentTerms: text('payment_terms'),
  approvalSignature: text('approval_signature'),
  deliveryAddress: text('delivery_address').notNull(),
  status: text('status').notNull().default('draft'),
  notes: text('notes'),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at'),
});

// Purchase Order Items schema
export const purchaseOrderItems = pgTable('purchase_order_items', {
  id: serial('id').primaryKey(),
  purchaseOrderId: integer('purchase_order_id').notNull().references(() => purchaseOrders.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
  unit: text('unit'),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  materialId: integer('material_id'), // Optional reference to a material in quote materials
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at'),
});

// Esquema base para órdenes de compra
const basePurchaseOrderSchema = createInsertSchema(purchaseOrders).pick({
  supplierId: true,
  orderNumber: true,
  projectId: true,
  quoteId: true,
  deliveryConditions: true,
  paymentTerms: true,
  approvalSignature: true,
  deliveryAddress: true,
  status: true,
  notes: true,
  totalAmount: true,
});

// Añadir validación personalizada para fechas y items
export const insertPurchaseOrderSchema = basePurchaseOrderSchema.extend({
  issueDate: z.union([
    z.date(),
    z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Issue date must be valid"
    }).transform(val => new Date(val)),
    z.null(),
    z.undefined()
  ]).optional(),
  expectedDeliveryDate: z.union([
    z.date(),
    z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Expected delivery date must be valid"
    }).transform(val => new Date(val)),
    z.null(),
    z.undefined()
  ]).optional(),
  approvalDate: z.union([
    z.date(),
    z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Approval date must be valid"
    }).transform(val => new Date(val)),
    z.null(),
    z.undefined()
  ]).optional(),
  // Definir schema para items del frontend
  items: z.array(
    z.object({
      description: z.string(),
      quantity: z.string(),
      unit: z.string().default("unit"),
      price: z.string()
    })
  ).optional(),
});

// Esquema para items de órdenes de compra
export const insertPurchaseOrderItemSchema = createInsertSchema(purchaseOrderItems).pick({
  purchaseOrderId: true,
  description: true,
  quantity: true,
  unit: true,
  unitPrice: true,
  totalPrice: true,
  materialId: true,
});

// Extender el esquema para permitir transformación de tipos
export const extendedInsertPurchaseOrderItemSchema = insertPurchaseOrderItemSchema.extend({
  // Permitir string o number para valores numéricos
  quantity: z.union([
    z.number(),
    z.string().transform(val => Number(val) || 0)
  ]),
  unitPrice: z.union([
    z.number(),
    z.string().transform(val => Number(val) || 0)
  ]),
  totalPrice: z.union([
    z.number(),
    z.string().transform(val => Number(val) || 0)
  ]).transform(val => val.toString()), // Asegurar que siempre sea string
});

// Define relationships
export const purchaseOrderToSupplier = relations(purchaseOrders, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [purchaseOrders.supplierId],
    references: [suppliers.id]
  })
}));

export const purchaseOrderToProject = relations(purchaseOrders, ({ one }) => ({
  project: one(projects, {
    fields: [purchaseOrders.projectId],
    references: [projects.id]
  })
}));

export const purchaseOrderToQuote = relations(purchaseOrders, ({ one }) => ({
  quote: one(quotes, {
    fields: [purchaseOrders.quoteId],
    references: [quotes.id]
  })
}));

export const purchaseOrderToItems = relations(purchaseOrders, ({ many }) => ({
  items: many(purchaseOrderItems)
}));

export const purchaseOrderItemToPurchaseOrder = relations(purchaseOrderItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseOrderItems.purchaseOrderId],
    references: [purchaseOrders.id]
  })
}));

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;

export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type InsertPurchaseOrderItem = z.infer<typeof insertPurchaseOrderItemSchema>;

// Session schema (para manejar las sesiones de connect-pg-simple)
export const session = pgTable("session", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});
