import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  cnpj: text("cnpj").notNull().unique(), // Brazilian tax ID
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id").notNull().references(() => clients.id),
  name: text("name").notNull(),
  address: text("address").notNull(),
  manager: text("manager"),
  active: integer("active", { mode: 'boolean' }).default(true),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const equipments = sqliteTable("equipments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  totalStock: integer("total_stock").notNull().default(0),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const movements = sqliteTable("movements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id),
  type: text("type").notNull(),
  date: text("date").notNull().default(sql`CURRENT_TIMESTAMP`),
  invoiceNumber: text("invoice_number"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const movementItems = sqliteTable("movement_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  movementId: integer("movement_id").notNull().references(() => movements.id),
  equipmentId: integer("equipment_id").notNull().references(() => equipments.id),
  quantity: integer("quantity").notNull(),
});

export const maintenance = sqliteTable("maintenance", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  equipmentId: integer("equipment_id").notNull().references(() => equipments.id),
  quantity: integer("quantity").notNull(),
  reason: text("reason"),
  startDate: text("start_date").default(sql`CURRENT_TIMESTAMP`),
  endDate: text("end_date"),
  status: text("status").default("OPEN").notNull(),
});

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

export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true });
export const insertEquipmentSchema = createInsertSchema(equipments).omit({ id: true, createdAt: true });
export const insertMovementSchema = createInsertSchema(movements).omit({ id: true, createdAt: true });
export const insertMovementItemSchema = createInsertSchema(movementItems).omit({ id: true });
export const insertMaintenanceSchema = createInsertSchema(maintenance).omit({ id: true, status: true, endDate: true });

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

export type CreateMovementRequest = InsertMovement & { items: InsertMovementItem[]; };
export type MovementWithDetails = Movement & { project: Project & { client: Client }; items: (MovementItem & { equipment: Equipment })[]; };
export type ProjectDashboardStats = { projectId: number; totalItemsOnSite: number; lastMovementDate: string | null; };
export type EquipmentInventoryStatus = Equipment & { available: number; onSite: number; inMaintenance: number; };
