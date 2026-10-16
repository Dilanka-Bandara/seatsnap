"use client";
import { useBackendStatus } from "@/hooks/use-backend-status";
export function BackendStatus() {
  const { data, isPending, isError, refetch } = useBackendStatus();
  return <div className="status" aria-live="polite">
    {isPending ? "Connecting to the backend…" : isError ? <><span>Backend isn’t connected.</span><button onClick={() => refetch()}>Retry</button><br /><small>You can still explore this preview.</small></> : data ? <><span>● {data.name} API connected</span><br /><small>Current stage: {data.stage}</small></> : "No backend status available."}
  </div>;
}
