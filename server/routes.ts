import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // === CLIENTS ===
  app.get(api.clients.list.path, async (req, res) => {
    const clients = await storage.getClients();
    res.json(clients);
  });

  app.post(api.clients.create.path, async (req, res) => {
    try {
      const input = api.clients.create.input.parse(req.body);
      const client = await storage.createClient(input);
      res.status(201).json(client);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.clients.get.path, async (req, res) => {
    const client = await storage.getClient(Number(req.params.id));
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  });


  // === PROJECTS ===
  app.get(api.projects.list.path, async (req, res) => {
    const clientId = req.query.clientId ? Number(req.query.clientId) : undefined;
    const projects = await storage.getProjects(clientId);
    res.json(projects);
  });

  app.post(api.projects.create.path, async (req, res) => {
    try {
      const input = api.projects.create.input.parse(req.body);
      const project = await storage.createProject(input);
      res.status(201).json(project);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.projects.get.path, async (req, res) => {
    const project = await storage.getProject(Number(req.params.id));
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  });

  app.get(api.projects.getInventory.path, async (req, res) => {
    const inventory = await storage.getProjectInventory(Number(req.params.id));
    // We need to fetch details for these items (name, sku)
    const detailedInventory = await Promise.all(inventory.map(async (item) => {
      const eq = await storage.getEquipment(item.equipmentId);
      return {
        equipmentId: item.equipmentId,
        quantity: item.quantity,
        name: eq?.name || 'Unknown',
        sku: eq?.sku || 'UNKNOWN'
      };
    }));
    res.json(detailedInventory);
  });


  // === EQUIPMENTS ===
  app.get(api.equipments.list.path, async (req, res) => {
    const equipments = await storage.getEquipments();
    res.json(equipments);
  });

  app.post(api.equipments.create.path, async (req, res) => {
    try {
      const input = api.equipments.create.input.parse(req.body);
      const equipment = await storage.createEquipment(input);
      res.status(201).json(equipment);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });


  // === MOVEMENTS ===
  app.get(api.movements.list.path, async (req, res) => {
    const projectId = req.query.projectId ? Number(req.query.projectId) : undefined;
    const movements = await storage.getMovements(projectId);
    res.json(movements);
  });

  app.post(api.movements.create.path, async (req, res) => {
    try {
      const input = api.movements.create.input.parse(req.body);
      
      // Validation Logic
      if (input.type === 'OUT') {
        // Check availability
        const stocks = await storage.getEquipments(); // This includes calculated available stock
        for (const item of input.items) {
          const eqStats = stocks.find(s => s.id === item.equipmentId);
          if (!eqStats) throw new Error(`Equipment ${item.equipmentId} not found`);
          if (eqStats.available < item.quantity) {
             return res.status(400).json({ 
               message: `Insufficient stock for ${eqStats.name} (SKU: ${eqStats.sku}). Available: ${eqStats.available}, Requested: ${item.quantity}` 
             });
          }
        }
      } else if (input.type === 'IN') {
        // Check if items are actually on site
        const siteInventory = await storage.getProjectInventory(input.projectId);
        for (const item of input.items) {
          const siteItem = siteInventory.find(i => i.equipmentId === item.equipmentId);
          const currentOnSite = siteItem?.quantity || 0;
          if (currentOnSite < item.quantity) {
            return res.status(400).json({ 
               message: `Cannot return ${item.quantity} of Equipment ${item.equipmentId}. Only ${currentOnSite} are currently on site.` 
             });
          }
        }
      }

      const movement = await storage.createMovement(input);
      res.status(201).json(movement);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      // @ts-ignore
      return res.status(400).json({ message: err.message || 'Internal Server Error' });
    }
  });

  app.get(api.movements.get.path, async (req, res) => {
    const movement = await storage.getMovement(Number(req.params.id));
    if (!movement) return res.status(404).json({ message: 'Movement not found' });
    res.json(movement);
  });


  // === MAINTENANCE ===
  app.get(api.maintenance.list.path, async (req, res) => {
    const records = await storage.getMaintenanceRecords();
    res.json(records);
  });

  app.post(api.maintenance.create.path, async (req, res) => {
    try {
      const input = api.maintenance.create.input.parse(req.body);
      
      // Validate availability before sending to maintenance
      const stocks = await storage.getEquipments();
      const eqStats = stocks.find(s => s.id === input.equipmentId);
      if (!eqStats) return res.status(404).json({ message: 'Equipment not found' });
      
      if (eqStats.available < input.quantity) {
        return res.status(400).json({ 
           message: `Insufficient available stock to send to maintenance. Available: ${eqStats.available}, Requested: ${input.quantity}` 
        });
      }

      const record = await storage.createMaintenance(input);
      res.status(201).json(record);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.maintenance.complete.path, async (req, res) => {
    const updated = await storage.completeMaintenance(Number(req.params.id));
    if (!updated) return res.status(404).json({ message: 'Maintenance record not found' });
    res.json(updated);
  });

  // SEED DATA
  // Check if we have equipment, if not seed some
  const existingEquipments = await storage.getEquipments();
  if (existingEquipments.length === 0) {
    console.log("Seeding Database...");
    
    // Equipments
    const eq1 = await storage.createEquipment({ sku: 'AND-001', name: 'Andaime Tubular 1.0m', description: 'Painel metálico de 1.0x1.0m', totalStock: 100 });
    const eq2 = await storage.createEquipment({ sku: 'AND-002', name: 'Andaime Tubular 1.5m', description: 'Painel metálico de 1.5x1.0m', totalStock: 50 });
    const eq3 = await storage.createEquipment({ sku: 'ESC-001', name: 'Escora Metálica 3.2m', description: 'Escora ajustável 2.0 a 3.2m', totalStock: 200 });
    const eq4 = await storage.createEquipment({ sku: 'BET-001', name: 'Betoneira 400L', description: 'Betoneira elétrica monofásica', totalStock: 5 });

    // Clients
    const client1 = await storage.createClient({ name: 'Construções Silva', cnpj: '12.345.678/0001-90', email: 'contato@silva.com', phone: '(11) 9999-9999' });
    const client2 = await storage.createClient({ name: 'Engenharia Rápida', cnpj: '98.765.432/0001-10', email: 'obras@rapida.com' });

    // Projects
    const proj1 = await storage.createProject({ clientId: client1.id, name: 'Residencial Flores', address: 'Rua das Flores, 123', manager: 'Carlos' });
    const proj2 = await storage.createProject({ clientId: client2.id, name: 'Shopping Centro', address: 'Av. Principal, 500', manager: 'Ana' });

    // Initial Movements (Some items on site)
    // Send 20 And-001 to Proj1
    await storage.createMovement({
      projectId: proj1.id,
      type: 'OUT',
      date: new Date('2024-01-10'),
      invoiceNumber: 'NF-1001',
      items: [{ equipmentId: eq1.id, quantity: 20 }]
    });

    // Send 10 Escoras to Proj2
    await storage.createMovement({
      projectId: proj2.id,
      type: 'OUT',
      date: new Date('2024-01-15'),
      invoiceNumber: 'NF-1002',
      items: [{ equipmentId: eq3.id, quantity: 10 }]
    });

     console.log("Database seeded!");
  }

  return httpServer;
}
