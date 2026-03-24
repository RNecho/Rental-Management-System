import { db } from "./db";
import { clients, projects, equipments, movements, movementItems, maintenance } from "@shared/schema";
import { sql } from "drizzle-orm";

async function runSeed() {
  console.log("Seeding dummy data...");

  const [client1] = await db.insert(clients).values({
    name: "Construtora Alfa",
    cnpj: "12345678000199",
    email: "contato@alfa.com.br",
    phone: "11999999999",
    address: "Rua das Flores, 123",
  }).returning();

  const [client2] = await db.insert(clients).values({
    name: "Engenharia Beta",
    cnpj: "98765432000111",
    email: "contato@beta.com.br",
    phone: "11888888888",
    address: "Av Paulista, 1000",
  }).returning();

  const [project1] = await db.insert(projects).values({
    clientId: client1.id,
    name: "Residencial Bosque",
    address: "Rua do Bosque, 500",
    manager: "Carlos",
    active: true,
  }).returning();

  const [project2] = await db.insert(projects).values({
    clientId: client2.id,
    name: "Prédio Comercial Centro",
    address: "Rua do Centro, 100",
    manager: "Roberto",
    active: true,
  }).returning();

  const [equip1] = await db.insert(equipments).values({
    sku: "BTR-001",
    name: "Betoneira 400L",
    description: "Betoneira com motor elétrico 2CV",
    totalStock: 5,
  }).returning();

  const [equip2] = await db.insert(equipments).values({
    sku: "FRD-001",
    name: "Furadeira de Impacto",
    description: "Furadeira industrial 1000W",
    totalStock: 10,
  }).returning();

  const [equip3] = await db.insert(equipments).values({
    sku: "AND-001",
    name: "Andaime Tubular 1x1m",
    description: "Painel de andaime em aço",
    totalStock: 50,
  }).returning();

  const [mov1] = await db.insert(movements).values({
    projectId: project1.id,
    type: "OUT",
    invoiceNumber: "1001",
    notes: "Envio inicial",
    date: new Date().toISOString()
  }).returning();

  await db.insert(movementItems).values([
    { movementId: mov1.id, equipmentId: equip1.id, quantity: 2 },
    { movementId: mov1.id, equipmentId: equip3.id, quantity: 10 },
  ]);

  const [mov2] = await db.insert(movements).values({
    projectId: project2.id,
    type: "OUT",
    invoiceNumber: "1002",
    notes: "Urgente",
    date: new Date().toISOString()
  }).returning();

  await db.insert(movementItems).values([
    { movementId: mov2.id, equipmentId: equip2.id, quantity: 3 },
  ]);

  console.log("Database seeded successfully!");
}

runSeed().catch((e) => {
  console.error("Seed error:", e);
  process.exit(1);
});
