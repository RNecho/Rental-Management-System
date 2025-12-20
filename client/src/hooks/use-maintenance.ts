import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

type InsertMaintenance = z.infer<typeof api.maintenance.create.input>;

export function useMaintenance() {
  return useQuery({
    queryKey: [api.maintenance.list.path],
    queryFn: async () => {
      const res = await fetch(api.maintenance.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch maintenance records");
      return api.maintenance.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertMaintenance) => {
      const res = await fetch(api.maintenance.create.path, {
        method: api.maintenance.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create maintenance record");
      return api.maintenance.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.maintenance.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.equipments.list.path] });
    },
  });
}

export function useCompleteMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.maintenance.complete.path, { id });
      const res = await fetch(url, {
        method: api.maintenance.complete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to complete maintenance");
      return api.maintenance.complete.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.maintenance.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.equipments.list.path] });
    },
  });
}
