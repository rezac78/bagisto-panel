"use client";
import React, { useEffect, useMemo, useState } from "react";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

type SortDir = "asc" | "desc";
type SortState = { key: keyof MarketplaceOrder; dir: SortDir } | null;

export type HeaderItem = {
  key: keyof MarketplaceOrder | string;
  label: string;
  sortable?: boolean;
  sortKey?: keyof MarketplaceOrder;
};

export type ColumnGroup = {
  width: string;
  headers: HeaderItem[];
  render: (args: {
    row: MarketplaceOrder;
    stars: (n: number) => string;
    selected: boolean;
    toggleOne: () => void;
    selectable: boolean;
  }) => React.ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
};

export type CustomerOrdersTableProps = {
  rows: MarketplaceOrder[];
  groups: ColumnGroup[];
  loading?: boolean;
  selectable?: boolean;
  selectedIds?: Array<string | number>;
  onSelectionChange?: (ids: Array<string | number>) => void;
  sort?: SortState;
  onSortChange?: (s: SortState) => void;
  className?: string;
  dir?: "ltr" | "rtl";
  emptyMessage?: string;
  onRowClick?: (row: MarketplaceOrder) => void;

  /** حداقل عرض کل جدول برای فعال‌شدن اسکرول افقی در موبایل */
  minGridWidth?: number;
  /** حداقل عرض هر ستون fr تا truncate درست کار کند */
  minColWidth?: number;

  /** صفحه‌بندی */
  page?: number;
  perPage?: number;
  /** اگر سرور-ساید paginate می‌کنی، total رو بده */
  total?: number;
  /** اگر بدی، جدول فقط اعلام می‌کند که صفحه عوض شده (بدون لوکال paginate) */
  onPageChange?: (page: number) => void;
};

function stars(n: number) {
  const clamped = Math.max(0, Math.min(5, Math.round(n)));
  return "★".repeat(clamped) + "☆".repeat(5 - clamped);
}

export default function CustomerOrdersTable({
  rows,
  groups,
  loading,
  selectable = true,
  selectedIds,
  onSelectionChange,
  sort,
  onSortChange,
  className = "",
  dir,
  emptyMessage = "No Records Available.",
  onRowClick,
  minGridWidth = 960,
  minColWidth = 220,
  page = 1,
  perPage = 10,
  total,
  onPageChange,
}: CustomerOrdersTableProps) {
  // --- انتخاب سطرها ---
  const [internalSelected, setInternalSelected] = useState<Array<string | number>>([]);
  const selected = selectedIds ?? internalSelected;
  const setSelected = onSelectionChange ?? setInternalSelected;

  useEffect(() => {
    if (selectedIds) setInternalSelected(selectedIds);
  }, [selectedIds]);

  const allSelected = rows.length > 0 && selected.length === rows.length;
  const toggleAll = () => (allSelected ? setSelected([]) : setSelected(rows.map((r) => r.id)));
  const toggleOne = (id: string | number) =>
    setSelected(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  // --- مرتب‌سازی ---
  const nextSort = (key: keyof MarketplaceOrder) => {
    if (!onSortChange) return;
    if (!sort || sort.key !== key) onSortChange({ key, dir: "asc" });
    else onSortChange({ key, dir: sort.dir === "asc" ? "desc" : "asc" });
  };

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const { key, dir } = sort;
    const factor = dir === "asc" ? 1 : -1;

    return [...rows].sort((a, b) => {
      const va = a[key] as any;
      const vb = b[key] as any;

      if (va == null && vb == null) return 0;
      if (va == null) return -1 * factor;
      if (vb == null) return 1 * factor;

      if (typeof va === "number" && typeof vb === "number") return (va - vb) * factor;

      if (key === "created_at" || key === "updated_at") {
        return (new Date(va).getTime() - new Date(vb).getTime()) * factor;
      }

      const sa = String(va).toLowerCase();
      const sb = String(vb).toLowerCase();
      return sa.localeCompare(sb) * factor;
    });
  }, [rows, sort]);

  // --- صفحه‌بندی ---
  const totalCount = typeof total === "number" ? total : rows.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const effectivePage = Math.min(Math.max(page || 1, 1), totalPages);

  const startIdx = totalCount === 0 ? 0 : (effectivePage - 1) * perPage;
  const endIdx = totalCount === 0 ? 0 : Math.min(startIdx + perPage, totalCount);

  // ✅ اگر server-side باشه، slice نکن
  const pagedRows = useMemo(() => {
    if (typeof total === "number" && onPageChange) return sortedRows;
    return sortedRows.slice(startIdx, endIdx);
  }, [sortedRows, startIdx, endIdx, total, onPageChange]);

  const gotoPrev = () => effectivePage > 1 && onPageChange?.(effectivePage - 1);
  const gotoNext = () => effectivePage < totalPages && onPageChange?.(effectivePage + 1);

  const onPageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = Number(e.target.value.trim());
    if (!Number.isNaN(num)) {
      const clamped = Math.min(Math.max(1, num), totalPages);
      onPageChange?.(clamped);
    }
  };

  // --- قالب جدول ---
  const template = useMemo(() => {
    return groups
      .map((g) => {
        const w = g.width?.trim() || "1fr";
        if (/\bfr\b/.test(w)) return `minmax(${minColWidth}px, ${w})`;
        return w;
      })
      .join(" ");
  }, [groups, minColWidth]);

  return (
    <div
      dir={dir}
      className={`border-border rounded-12 relative mt-8 mr-4 h-fit w-full overflow-x-auto border bg-white ${className}`}
    >
      <div
        className="grid grid-cols-3"
        style={{
          gridTemplateColumns: template,
          minWidth: `${minGridWidth}px`,
        }}
      >
        {/* ---- Header ---- */}
        <div className="contents">
          {groups.map((g, gi) => (
            <div key={`header-${gi}`} className="border-border flex items-center border-b px-4 py-2.5">
              <p className="min-w-0 text-sm leading-5 font-medium">
                {g.headers.map((h, idx) => (
                  <button
                    key={`${h.key}-${idx}`}
                    type="button"
                    onClick={() =>
                      h.sortKey || h.key ? nextSort((h.sortKey as keyof MarketplaceOrder) ?? (h.key as any)) : undefined
                    }
                    className="mr-2"
                  >
                    {h.label}
                  </button>
                ))}
              </p>
            </div>
          ))}
        </div>

        {/* ---- Rows ---- */}
        {!loading && pagedRows.length === 0 && (
          <div className="col-span-full border-b border-gray-300 px-4 py-4 text-center text-gray-600">
            <p>{emptyMessage}</p>
          </div>
        )}

        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="contents">
              {groups.map((_, gi) => (
                <div key={`sk-${gi}`} className="border-border border-b px-4 py-4">
                  <div className="h-4 w-[240px] max-w-full animate-pulse rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ))}

        {!loading &&
          pagedRows.map((row, i) => (
            <div key={i} className="contents">
              {groups.map((g, gi) => (
                <div
                  key={`gc-${gi}`}
                  className={`border-border flex min-w-0 items-start gap-3 border-b px-4 py-3 ${g.className || ""}`}
                  onClick={() => onRowClick?.(row)}
                >
                  <div className="w-full min-w-0">
                    {g.render({
                      row,
                      stars,
                      selected: selected.includes(row.id),
                      toggleOne: () => toggleOne(row.id),
                      selectable,
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
      </div>

      {/* ---- Pagination ---- */}
      <div className="flex items-center justify-between p-6 max-md:p-2">
        <p className="text-xs font-medium">
          {totalCount === 0 ? "Showing 0 entries" : `Showing ${startIdx + 1} to ${endIdx} of ${totalCount} entries`}
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={gotoPrev}
            disabled={effectivePage <= 1}
            className="rounded-md p-2 hover:bg-gray-200 disabled:opacity-40"
          >
            <ChevronLeftIcon />
          </button>

          <input
            type="text"
            inputMode="numeric"
            value={String(effectivePage)}
            onChange={onPageInput}
            className="w-[42px] border px-1 py-1 text-center text-sm"
          />

          <button
            onClick={gotoNext}
            disabled={effectivePage >= totalPages}
            className="rounded-md p-2 hover:bg-gray-200 disabled:opacity-40"
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
