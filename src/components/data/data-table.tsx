"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface Column<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

export interface TableFilter<T> {
  label: string;
  options: { value: string; label: string }[];
  getValue: (row: T) => string;
}

interface DataTableProps<T> {
  data: T[] | undefined;
  columns: Column<T>[];
  getRowId: (row: T) => string;
  isLoading?: boolean;
  searchPlaceholder?: string;
  getSearchText?: (row: T) => string;
  filter?: TableFilter<T>;
  initialFilter?: string;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  mobileTitle?: (row: T) => ReactNode;
  empty: ReactNode;
  toolbar?: ReactNode;
}

const ALL = "all";

export function DataTable<T>({
  data,
  columns,
  getRowId,
  isLoading,
  searchPlaceholder = "Search…",
  getSearchText,
  filter,
  initialFilter = ALL,
  pageSize = 10,
  onRowClick,
  mobileTitle,
  empty,
  toolbar,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [filterValue, setFilterValue] = useState(initialFilter);
  const [page, setPage] = useState(0);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (data ?? []).filter((row) => {
      if (filter && filterValue !== ALL && filter.getValue(row) !== filterValue) return false;
      if (needle && getSearchText && !getSearchText(row).toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [data, query, filter, filterValue, getSearchText]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = rows.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const filterItems = filter ? [{ value: ALL, label: `All ${filter.label.toLowerCase()}` }, ...filter.options] : [];
  const mobileColumns = columns.filter((column) => !column.hideOnMobile);

  const rowProps = (row: T) =>
    onRowClick
      ? {
          role: "button" as const,
          tabIndex: 0,
          onClick: () => onRowClick(row),
          onKeyDown: (event: React.KeyboardEvent) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onRowClick(row);
            }
          },
        }
      : {};

  return (
    <div className="space-y-3">
      {(getSearchText || filter || toolbar) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {getSearchText && (
            <div className="relative sm:max-w-xs sm:flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                aria-label={searchPlaceholder}
                placeholder={searchPlaceholder}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(0);
                }}
                className="h-9 pl-8"
              />
            </div>
          )}
          {filter && (
            <Select
              items={filterItems}
              value={filterValue}
              onValueChange={(value) => {
                setFilterValue(String(value ?? ALL));
                setPage(0);
              }}
            >
              <SelectTrigger aria-label={`Filter by ${filter.label.toLowerCase()}`} className="h-9 w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filterItems.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {toolbar && <div className="flex gap-2 sm:ml-auto">{toolbar}</div>}
        </div>
      )}

      {isLoading ? (
        <Card className="gap-0 p-0">
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-9 w-full" />
            ))}
          </div>
        </Card>
      ) : rows.length === 0 ? (
        empty
      ) : (
        <>
          <Card className="hidden gap-0 p-0 md:flex">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60 hover:bg-muted/60">
                  {columns.map((column) => (
                    <TableHead key={column.id} className={cn("h-10 px-4 text-xs font-medium tracking-wide text-muted-foreground uppercase", column.className)}>
                      {column.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((row) => (
                  <TableRow key={getRowId(row)} {...rowProps(row)} className={cn(onRowClick && "cursor-pointer focus-visible:bg-accent focus-visible:outline-none")}>
                    {columns.map((column) => (
                      <TableCell key={column.id} className={cn("px-4 py-3", column.className)}>
                        {column.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <ul className="space-y-2 md:hidden">
            {visible.map((row) => (
              <li key={getRowId(row)}>
                <Card {...rowProps(row)} className={cn("gap-3 px-4", onRowClick && "cursor-pointer active:bg-accent")}>
                  {mobileTitle && <div className="font-medium">{mobileTitle(row)}</div>}
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {mobileColumns.map((column) => (
                      <div key={column.id} className="min-w-0">
                        <dt className="text-xs text-muted-foreground">{column.header}</dt>
                        <dd className="truncate text-sm">{column.cell(row)}</dd>
                      </div>
                    ))}
                  </dl>
                </Card>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
            <span>
              {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, rows.length)} of {rows.length}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon-sm" aria-label="Previous page" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>
                <ChevronLeft />
              </Button>
              <span className="px-2 tabular-nums">
                {currentPage + 1} / {pageCount}
              </span>
              <Button variant="outline" size="icon-sm" aria-label="Next page" disabled={currentPage >= pageCount - 1} onClick={() => setPage(currentPage + 1)}>
                <ChevronRight />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
