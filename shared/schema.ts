import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cnpj: text("cnpj").notNull().unique(), // Brazilian tax ID
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  name: text("name").notNull(), // Project name / Site name
  address: text("address").notNull(),
  manager: text("manager"), // Contact person at site
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const equipments = pgTable("equipments", {
  id: serial("id").primaryKey(),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  totalStock: integer("total_stock").notNull().default(0), // Total assets owned
  createdAt: timestamp("created_at").defaultNow(),
});

// Movements: Shipping to site (OUT) or Returning from site (IN)
export const movements = pgTable("movements", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  type: text("type", { enum: ["OUT", "IN"] }).notNull(), // OUT = Remessa (To Site), IN = Devolução (From Site)
  date: timestamp("date").notNull().defaultNow(),
  invoiceNumber: text("invoice_number"), // Nota Fiscal
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const movementItems = pgTable("movement_items", {
  id: serial("id").primaryKey(),
  movementId: integer("movement_id").notNull().references(() => movements.id),
  equipmentId: integer("equipment_id").notNull().references(() => equipments.id),
  quantity: integer("quantity").notNull(), // Positive integer
});

export const maintenance = pgTable("maintenance", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id").notNull().references(() => equipments.id),
  quantity: integer("quantity").notNull(),
  reason: text("reason"),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"), // When fixed/returned to stock
  status: text("status", { enum: ["OPEN", "COMPLETED"] }).default("OPEN").notNull(),
});

// === RELATIONS ===

export const clientsRelations = relations(clients, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
  movements: many(movements),
}));

export const movementsRelations = relations(movements, ({ one, many }) => ({
  project: one(projects, {
    fields: [movements.projectId],
    references: [projects.id],
  }),
  items: many(movementItems),
}));

export const movementItemsRelations = relations(movementItems, ({ one }) => ({
  movement: one(movements, {
    fields: [movementItems.movementId],
    references: [movements.id],
  }),
  equipment: one(equipments, {
    fields: [movementItems.equipmentId],
    references: [equipments.id],
  }),
}));

export const maintenanceRelations = relations(maintenance, ({ one }) => ({
  equipment: one(equipments, {
    fields: [maintenance.equipmentId],
    references: [equipments.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true });
export const insertEquipmentSchema = createInsertSchema(equipments).omit({ id: true, createdAt: true });
export const insertMovementSchema = createInsertSchema(movements).omit({ id: true, createdAt: true });
export const insertMovementItemSchema = createInsertSchema(movementItems).omit({ id: true });
export const insertMaintenanceSchema = createInsertSchema(maintenance).omit({ id: true, status: true, endDate: true });

// === EXPLICIT API CONTRACT TYPES ===

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Equipment = typeof equipments.$inferSelect;
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;

export type Movement = typeof movements.$inferSelect;
export type InsertMovement = z.infer<typeof insertMovementSchema>;

export type MovementItem = typeof movementItems.$inferSelect;
export type InsertMovementItem = z.infer<typeof insertMovementItemSchema>;

export type Maintenance = typeof maintenance.$inferSelect;
export type InsertMaintenance = z.infer<typeof insertMaintenanceSchema>;

// Compound types for API
export type CreateMovementRequest = InsertMovement & {
  items: InsertMovementItem[];
};

export type MovementWithDetails = Movement & {
  project: Project & { client: Client };
  items: (MovementItem & { equipment: Equipment })[];
};

export type ProjectDashboardStats = {
  projectId: number;
  totalItemsOnSite: number;
  lastMovementDate: string | null;
};

export type EquipmentInventoryStatus = Equipment & {
  available: number;
  onSite: number;
  inMaintenance: number;
};
