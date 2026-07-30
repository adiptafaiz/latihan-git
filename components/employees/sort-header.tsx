import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SortField, SortOrder } from "@/lib/actions/employee";

type SearchParams = Record<string, string | undefined>;

/** Bangun href dengan sort/order baru, pertahankan param lain. */
function buildHref(
  field: SortField,
  current: { field: SortField; order: SortOrder },
  searchParams: SearchParams,
): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (v) sp.set(k, v);
  }

  // Toggle: klik field sama → balik order; klik field beda → mulai asc.
  const nextOrder: SortOrder =
    current.field === field
      ? current.order === "asc"
        ? "desc"
        : "asc"
      : "asc";

  sp.set("sort", field);
  sp.set("order", nextOrder);
  sp.set("page", "1");
  return `/employees?${sp.toString()}`;
}

export function SortHeader({
  field,
  label,
  current,
  searchParams,
  className,
}: {
  field: SortField;
  label: string;
  current: { field: SortField; order: SortOrder };
  searchParams: SearchParams;
  className?: string;
}) {
  const active = current.field === field;
  return (
    <Link
      href={buildHref(field, current, searchParams)}
      className={cn(
        "inline-flex items-center gap-1 hover:text-foreground",
        active ? "text-foreground" : "text-muted-foreground",
        className,
      )}
    >
      {label}
      {active ? (
        current.order === "asc" ? (
          <ArrowUp className="h-3.5 w-3.5" />
        ) : (
          <ArrowDown className="h-3.5 w-3.5" />
        )
      ) : (
        <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
      )}
    </Link>
  );
}
