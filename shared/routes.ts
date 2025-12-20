import { z } from 'zod';
import { 
  insertClientSchema, 
  insertProjectSchema, 
  insertEquipmentSchema, 
  insertMaintenanceSchema,
  insertMovementSchema,
  insertMovementItemSchema,
  clients,
  projects,
  equipments,
  movements,
  maintenance
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// Custom schema for creating a movement with items
const createMovementWithItemsSchema = insertMovementSchema.extend({
  items: z.array(z.object({
    equipmentId: z.number(),
    quantity: z.number().positive(),
  })).min(1, "Movement must have at least one item"),
});

export const api = {
  clients: {
    list: {
      method: 'GET' as const,
      path: '/api/clients',
      responses: {
        200: z.array(z.custom<typeof clients.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/clients',
      input: insertClientSchema,
      responses: {
        201: z.custom<typeof clients.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/clients/:id',
      responses: {
        200: z.custom<typeof clients.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  projects: {
    list: {
      method: 'GET' as const,
      path: '/api/projects',
      input: z.object({ clientId: z.string().optional() }).optional(),
      responses: {
        200: z.array(z.custom<typeof projects.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/projects',
      input: insertProjectSchema,
      responses: {
        201: z.custom<typeof projects.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/projects/:id',
      responses: {
        200: z.custom<typeof projects.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    getInventory: { // Current balance of items at a specific project site
      method: 'GET' as const,
      path: '/api/projects/:id/inventory',
      responses: {
        200: z.array(z.object({
          equipmentId: z.number(),
          name: z.string(),
          sku: z.string(),
          quantity: z.number(), // Balance at site
        })),
      },
    }
  },
  equipments: {
    list: {
      method: 'GET' as const,
      path: '/api/equipments',
      responses: {
        200: z.array(z.custom<typeof equipments.$inferSelect & { available: number, onSite: number, inMaintenance: number }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/equipments',
      input: insertEquipmentSchema,
      responses: {
        201: z.custom<typeof equipments.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  movements: {
    list: {
      method: 'GET' as const,
      path: '/api/movements',
      input: z.object({ projectId: z.string().optional() }).optional(),
      responses: {
        200: z.array(z.custom<typeof movements.$inferSelect & { 
          project: typeof projects.$inferSelect & { client: typeof clients.$inferSelect },
          itemsCount: number 
        }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/movements',
      input: createMovementWithItemsSchema,
      responses: {
        201: z.custom<typeof movements.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/movements/:id',
      responses: {
        200: z.custom<typeof movements.$inferSelect & { 
          items: Array<typeof import('./schema').movementItems.$inferSelect & { equipment: typeof equipments.$inferSelect }> 
        }>(),
        404: errorSchemas.notFound,
      },
    },
  },
  maintenance: {
    list: {
      method: 'GET' as const,
      path: '/api/maintenance',
      responses: {
        200: z.array(z.custom<typeof maintenance.$inferSelect & { equipment: typeof equipments.$inferSelect }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/maintenance',
      input: insertMaintenanceSchema,
      responses: {
        201: z.custom<typeof maintenance.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    complete: { // Mark maintenance as completed (return to available stock)
      method: 'PATCH' as const,
      path: '/api/maintenance/:id/complete',
      responses: {
        200: z.custom<typeof maintenance.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
