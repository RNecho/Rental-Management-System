import { db } from "./db";
import {
  clients, projects, equipments, movements, movementItems, maintenance,
  type Client, type InsertClient,
  type Project, type InsertProject,
  type Equipment, type InsertEquipment,
  type Movement, type InsertMovement, type MovementItem, type InsertMovementItem,
  type Maintenance, type InsertMaintenance,
  type EquipmentInventoryStatus,
  type CreateMovementRequest
} from "@shared/schema";
import { eq, desc, sql, and } from "drizzle-orm";

export interface IStorage {
  // Clients
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;

  // Projects
  getProjects(clientId?: number): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  getProjectInventory(projectId: number): Promise<Array<{ equipmentId: number; quantity: number }>>;

  // Equipments
  getEquipments(): Promise<EquipmentInventoryStatus[]>;
  getEquipment(id: number): Promise<Equipment | undefined>;
  createEquipment(equipment: InsertEquipment): Promise<Equipment>;

  // Movements
  getMovements(projectId?: number): Promise<(Movement & { project: Project & { client: Client }, itemsCount: number })[]>;
  getMovement(id: number): Promise<(Movement & { items: (MovementItem & { equipment: Equipment })[] }) | undefined>;
  createMovement(data: CreateMovementRequest): Promise<Movement>;

  // Maintenance
  getMaintenanceRecords(): Promise<(Maintenance & { equipment: Equipment })[]>;
  createMaintenance(data: InsertMaintenance): Promise<Maintenance>;
  completeMaintenance(id: number): Promise<Maintenance>;
}

export class DatabaseStorage implements IStorage {
  // === CLIENTS ===
  async getClients(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(desc(clients.createdAt));
  }

  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  // === PROJECTS ===
  async getProjects(clientId?: number): Promise<Project[]> {
    if (clientId) {
      return await db.select().from(projects).where(eq(projects.clientId, clientId)).orderBy(desc(projects.createdAt));
    }
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async getProjectInventory(projectId: number): Promise<Array<{ equipmentId: number; quantity: number }>> {
    // Calculate inventory at a site: Sum(OUT) - Sum(IN)
    // We fetch all movement items for this project
    
    // This is a bit complex in pure Drizzle without writing raw SQL for aggregation.
    // Let's do it in JS for MVP simplicity or use a raw query if needed.
    // Given the scale, JS processing is fine for MVP.
    
    const projectMovements = await db.select({
      type: movements.type,
      equipmentId: movementItems.equipmentId,
      quantity: movementItems.quantity
    })
    .from(movements)
    .innerJoin(movementItems, eq(movements.id, movementItems.movementId))
    .where(eq(movements.projectId, projectId));

    const inventory = new Map<number, number>();

    for (const m of projectMovements) {
      const current = inventory.get(m.equipmentId) || 0;
      if (m.type === 'OUT') {
        inventory.set(m.equipmentId, current + m.quantity);
      } else {
        inventory.set(m.equipmentId, current - m.quantity);
      }
    }

    // Filter out zero quantities
    const result: Array<{ equipmentId: number; quantity: number }> = [];
    for (const [equipmentId, quantity] of inventory.entries()) {
      if (quantity > 0) {
        result.push({ equipmentId, quantity });
      }
    }
    return result;
  }

  // === EQUIPMENTS ===
  async getEquipments(): Promise<EquipmentInventoryStatus[]> {
    const allEquipments = await db.select().from(equipments).orderBy(equipments.name);
    
    // Get aggregated stats
    // 1. In Maintenance
    const maintenanceItems = await db.select({
      equipmentId: maintenance.equipmentId,
      quantity: maintenance.quantity
    }).from(maintenance).where(eq(maintenance.status, 'OPEN'));

    // 2. On Site (All OUT - All IN)
    const allMovements = await db.select({
      type: movements.type,
      equipmentId: movementItems.equipmentId,
      quantity: movementItems.quantity
    })
    .from(movements)
    .innerJoin(movementItems, eq(movements.id, movementItems.movementId));

    // Calculate map
    const onSiteMap = new Map<number, number>();
    for (const m of allMovements) {
      const current = onSiteMap.get(m.equipmentId) || 0;
      if (m.type === 'OUT') {
        onSiteMap.set(m.equipmentId, current + m.quantity);
      } else {
        onSiteMap.set(m.equipmentId, current - m.quantity);
      }
    }

    const maintenanceMap = new Map<number, number>();
    for (const m of maintenanceItems) {
      const current = maintenanceMap.get(m.equipmentId) || 0;
      maintenanceMap.set(m.equipmentId, current + m.quantity);
    }

    return allEquipments.map(eq => {
      const onSite = onSiteMap.get(eq.id) || 0;
      const inMaintenance = maintenanceMap.get(eq.id) || 0;
      const available = eq.totalStock - onSite - inMaintenance;
      return {
        ...eq,
        onSite,
        inMaintenance,
        available
      };
    });
  }

  async getEquipment(id: number): Promise<Equipment | undefined> {
    const [equipment] = await db.select().from(equipments).where(eq(equipments.id, id));
    return equipment;
  }

  async createEquipment(equipment: InsertEquipment): Promise<Equipment> {
    const [newEquipment] = await db.insert(equipments).values(equipment).returning();
    return newEquipment;
  }

  // === MOVEMENTS ===
  async getMovements(projectId?: number): Promise<(Movement & { project: Project & { client: Client }, itemsCount: number })[]> {
    const baseQuery = db.select({
        movement: movements,
        project: projects,
        client: clients,
        itemsCount: sql<number>`count(${movementItems.id})`
      })
      .from(movements)
      .innerJoin(projects, eq(movements.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .leftJoin(movementItems, eq(movements.id, movementItems.movementId))
      .groupBy(movements.id, projects.id, clients.id)
      .orderBy(desc(movements.date));

    if (projectId) {
      baseQuery.where(eq(movements.projectId, projectId));
    }

    const rows = await baseQuery;
    return rows.map(r => ({
      ...r.movement,
      project: { ...r.project, client: r.client },
      itemsCount: r.itemsCount
    }));
  }

  async getMovement(id: number): Promise<(Movement & { items: (MovementItem & { equipment: Equipment })[] }) | undefined> {
    const [movement] = await db.select().from(movements).where(eq(movements.id, id));
    if (!movement) return undefined;

    const items = await db.select({
      item: movementItems,
      equipment: equipments
    })
    .from(movementItems)
    .innerJoin(equipments, eq(movementItems.equipmentId, equipments.id))
    .where(eq(movementItems.movementId, id));

    return {
      ...movement,
      items: items.map(i => ({ ...i.item, equipment: i.equipment }))
    };
  }

  async createMovement(data: CreateMovementRequest): Promise<Movement> {
    // TODO: Add validation here for stock availability if needed, 
    // but routes/business logic layer is also a good place.
    // For now, we trust the caller (route handler) to have validated.
    
    return await db.transaction(async (tx) => {
      const [movement] = await tx.insert(movements).values({
        projectId: data.projectId,
        type: data.type,
        invoiceNumber: data.invoiceNumber,
        notes: data.notes,
        date: data.date
      }).returning();

      for (const item of data.items) {
        await tx.insert(movementItems).values({
          movementId: movement.id,
          equipmentId: item.equipmentId,
          quantity: item.quantity
        });
      }

      return movement;
    });
  }

  // === MAINTENANCE ===
  async getMaintenanceRecords(): Promise<(Maintenance & { equipment: Equipment })[]> {
    const rows = await db.select({
      maintenance: maintenance,
      equipment: equipments
    })
    .from(maintenance)
    .innerJoin(equipments, eq(maintenance.equipmentId, equipments.id))
    .orderBy(desc(maintenance.startDate));

    return rows.map(r => ({ ...r.maintenance, equipment: r.equipment }));
  }

  async createMaintenance(data: InsertMaintenance): Promise<Maintenance> {
    const [record] = await db.insert(maintenance).values(data).returning();
    return record;
  }

  async completeMaintenance(id: number): Promise<Maintenance> {
    const [updated] = await db.update(maintenance)
      .set({ status: 'COMPLETED', endDate: new Date().toISOString() })
      .where(eq(maintenance.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
