import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";

type InsertEquipment = z.infer<typeof api.equipments.create.input>;

export function useEquipments() {
  return useQuery({
    queryKey: [api.equipments.list.path],
    queryFn: async () => {
      const res = await fetch(api.equipments.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch equipments");
      return api.equipments.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertEquipment) => {
      const res = await fetch(api.equipments.create.path, {
        method: api.equipments.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create equipment");
      return api.equipments.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.equipments.list.path] });
    },
  });
}
