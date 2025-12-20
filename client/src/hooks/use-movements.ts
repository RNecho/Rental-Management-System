import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

type CreateMovementRequest = z.infer<typeof api.movements.create.input>;

export function useMovements(projectId?: string) {
  return useQuery({
    queryKey: [api.movements.list.path, projectId],
    queryFn: async () => {
      const url = projectId 
        ? `${api.movements.list.path}?projectId=${projectId}` 
        : api.movements.list.path;
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch movements");
      return api.movements.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateMovementRequest) => {
      const res = await fetch(api.movements.create.path, {
        method: api.movements.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create movement");
      }
      return api.movements.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.movements.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.equipments.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.projects.getInventory.path] });
    },
  });
}
