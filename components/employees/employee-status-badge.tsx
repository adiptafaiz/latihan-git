import { Badge } from "@/components/ui/badge";
import type { EmployeeStatus } from "@/lib/actions/employee";

export function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  if (status === "ACTIVE") {
    return <Badge variant="success">Aktif</Badge>;
  }
  return <Badge variant="muted">Tidak Aktif</Badge>;
}
