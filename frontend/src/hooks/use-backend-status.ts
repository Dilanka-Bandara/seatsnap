"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
export function useBackendStatus() {
  return useQuery({ queryKey: ["backend-status"], queryFn: () => api<{ name: string; stage: string; message: string }>("/api/status") });
}
