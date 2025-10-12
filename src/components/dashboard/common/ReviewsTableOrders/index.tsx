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

export type ReviewsTableOrdersProps = {
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
  minGridWidth?: number; // px
  /** حداقل عرض هر ستون fr تا truncate درست کار کند */
  minColWidth?: number; // px

  /** صفحه‌بندی */
  page?: number; // 1-based
  perPage?: number;
  /** اگر سرور-ساید paginate می‌کنی، total رو بده؛ وگرنه ردیش کن */
  total?: number;
  /** اگر بدی، کامپوننت فقط اعلام می‌کنه صفحه عوض شد (سرور-ساید)؛ اگر ندی، خودش لوکال paginate می‌کند */
  onPageChange?: (page: number) => void;
};

function stars(n: number) {
  const clamped = Math.max(0, Math.min(5, Math.round(n)));
  return "★".repeat(clamped) + "☆".repeat(5 - clamped);
}

export default function ReviewsTableOrders({
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

  // صفحه‌بندی
  page = 1,
  perPage = 10,
  total,
  onPageChange,
}: ReviewsTableOrdersProps) {
  /** انتخاب سطرها */
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

  /** سورت */
  const nextSort = (key: keyof MarketplaceOrder) => {
    if (!onSortChange) return;
    if (!sort || sort.key !== key) onSortChange({ key, dir: "asc" });
    else onSortChange({ key, dir: sort.dir === "asc" ? "desc" : "asc" });
  };

  /** قالب ستون‌ها برای فعال‌شدن اسکرول افقی */
  const template = useMemo(() => {
    return groups
      .map((g) => {
        const w = g.width?.trim() || "1fr";
        if (/\bfr\b/.test(w)) return `minmax(${minColWidth}px, ${w})`;
        return w; // px/%/auto
      })
      .join(" ");
  }, [groups, minColWidth]);

  /** مرتب‌سازی ردیف‌ها */
  const sortedRows = useMemo(() => {
    if (!sort) return rows;

    const { key, dir } = sort;
    const factor = dir === "asc" ? 1 : -1;

    return [...rows].sort((a, b) => {
      const va = a[key] as string | number | Date | null | undefined;
      const vb = b[key] as string | number | Date | null | undefined;

      if (va == null && vb == null) return 0;
      if (va == null) return -1 * factor;
      if (vb == null) return 1 * factor;

      // عدد
      if (typeof va === "number" && typeof vb === "number") {
        return (va - vb) * factor;
      }

      // تاریخ
      if (key === "created_at" || key === "updated_at") {
        const sa = new Date(va as string).getTime();
        const sb = new Date(vb as string).getTime();
        return (sa - sb) * factor;
      }

      // رشته
      const sa = String(va).toLowerCase();
      const sb = String(vb).toLowerCase();
      if (sa < sb) return -1 * factor;
      if (sa > sb) return 1 * factor;
      return 0;
    });
  }, [rows, sort]);

  /** --- صفحه‌بندی --- */
  const totalCount = typeof total === "number" ? total : rows.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));

  // اگر onPageChange داری، از prop page استفاده می‌کنیم؛ وگرنه از state محلی
  const [localPage, setLocalPage] = useState<number>(page || 1);

  // اگر بیرون page تغییر کرد و سرور-ساید نیست، هم‌راستا شو
  useEffect(() => {
    if (!onPageChange) setLocalPage(page || 1);
  }, [page, onPageChange]);

  const currentFromProp = Math.min(Math.max(page, 1), totalPages);
  const currentFromState = Math.min(Math.max(localPage, 1), totalPages);
  const effectivePage = onPageChange ? currentFromProp : currentFromState;

  const setPage = (p: number) => {
    const clamped = Math.min(Math.max(1, p), totalPages);
    if (onPageChange) onPageChange(clamped);
    else setLocalPage(clamped);
  };

  const startIdx = totalCount === 0 ? 0 : (effectivePage - 1) * perPage;
  const endIdx = totalCount === 0 ? 0 : Math.min(startIdx + perPage, totalCount);

  const gotoPrev = () => setPage(effectivePage - 1);
  const gotoNext = () => setPage(effectivePage + 1);

  const onPageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    const num = Number(val);
    if (!Number.isNaN(num)) setPage(num);
  };

  // اگر سرور-ساید paginate می‌کنی، rows از قبل صفحه‌شده است؛ وگرنه slice کن
  const pagedRows = useMemo(() => {
    if (onPageChange) return sortedRows;
    return sortedRows.slice(startIdx, endIdx);
  }, [sortedRows, startIdx, endIdx, onPageChange]);

  return (
    <div
      dir={dir}
      className={`border-border rounded-12 relative mt-8 mr-4 h-fit w-full overflow-x-auto border bg-white ${className}`}
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <div
        className="grid grid-cols-3"
        style={{
          gridTemplateColumns: template,
          minWidth: `${minGridWidth}px`,
        }}
      >
        {/* هدرها */}
        <div className="contents">
          <div className="border-border flex min-w-0 items-center gap-2.5 border-b px-4 py-2.5">
            {selectable && (
              <label className="flex w-max cursor-pointer items-center gap-1 select-none" htmlFor="mass_select_all">
                <input
                  type="checkbox"
                  id="mass_select_all"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="peer hidden"
                />
                <span className="icon-uncheck cursor-pointer rounded-md text-2xl" />
              </label>
            )}
            <p className="min-w-0 text-sm leading-5 font-medium">
              <span className="[&>*]:after:content-['_/_']">
                {groups[0]?.headers.map((h, idx) => {
                  const sortKey = (h.sortKey as keyof MarketplaceOrder) ?? (h.key as keyof MarketplaceOrder);
                  const isValidSortKey = typeof sortKey !== "undefined";
                  return (
                    <button
                      key={`${h.key}-${idx}`}
                      type="button"
                      onClick={isValidSortKey ? () => nextSort(sortKey) : undefined}
                      className="cursor-pointer after:content-['/'] last:after:content-['']"
                    >
                      {h.label}
                    </button>
                  );
                })}
              </span>
            </p>
          </div>

          {groups.slice(1).map((g, gi) => (
            <div key={`gh-${gi}`} className="border-border flex min-w-0 items-center gap-2.5 border-b px-4 py-2.5">
              <p className="min-w-0 text-sm leading-5 font-medium">
                <span className="[&>*]:after:content-['_/_']">
                  {g.headers.map((h, idx) => {
                    const sortKey = (h.sortKey as keyof MarketplaceOrder) ?? (h.key as keyof MarketplaceOrder);
                    const isValidSortKey = typeof sortKey !== "undefined";
                    return (
                      <button
                        key={`${h.key}-${idx}`}
                        type="button"
                        onClick={isValidSortKey ? () => nextSort(sortKey) : undefined}
                        className="cursor-pointer after:content-['/'] last:after:content-['']"
                      >
                        {h.label}
                      </button>
                    );
                  })}
                </span>
              </p>
            </div>
          ))}
        </div>

        {/* بدون دیتا */}
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
                  className={`border-border flex min-w-0 items-start gap-3 border-b px-4 py-3 ${g.className || ""} ${
                    g.align === "center" ? "justify-center" : g.align === "end" ? "justify-end" : ""
                  }`}
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
      <div className="flex items-center justify-between p-6 max-md:p-2">
        <p className="text-xs font-medium">
          {totalCount === 0 ? "Showing 0 entries" : `Showing ${startIdx + 1} to ${endIdx} of ${totalCount} entries`}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={gotoPrev}
            disabled={effectivePage <= 1}
            className="inline-flex max-w-max cursor-pointer items-center justify-between gap-x-1 rounded-md border border-transparent p-1.5 text-center text-gray-600 transition-all hover:bg-gray-200 focus:ring-2 focus:ring-black focus:outline-none active:border-gray-300 disabled:opacity-40"
            aria-label="Prev page"
            type="button"
          >
            <span className="icon-sort-left text-2xl" />
          </button>
          <button
            onClick={gotoNext}
            disabled={effectivePage >= totalPages}
            className="inline-flex max-w-max cursor-pointer items-center justify-between gap-x-1 rounded-md border border-transparent p-1.5 text-center text-gray-600 transition-all hover:bg-gray-200 focus:ring-2 focus:ring-black focus:outline-none active:border-gray-300 disabled:opacity-40"
            aria-label="Next page"
            type="button"
          >
            <span className="icon-sort-right text-2xl" />
          </button>
        </div>

        <nav aria-label="Page Navigation">
          <ul className="inline-flex items-center -space-x-px rounded-lg border border-zinc-200 max-md:px-0">
            <li>
              <button
                onClick={() => setPage(1)}
                className="flex h-10 w-9 items-center justify-center leading-normal font-medium hover:bg-gray-100 max-md:h-8 max-md:w-6"
                aria-label="First Page"
                type="button"
              >
                <ChevronLeftIcon />
              </button>
            </li>
            <li>
              <input
                type="text"
                inputMode="numeric"
                value={String(effectivePage)}
                onChange={onPageInput}
                className="max-w-[42px] items-center border-r border-l px-4 py-2 leading-normal font-medium text-black hover:bg-gray-100 max-md:max-w-9 max-md:px-0 max-md:py-1 max-md:text-center"
                aria-label="Page Number"
              />
            </li>
            <li>
              <button
                onClick={() => setPage(totalPages)}
                className="flex h-10 w-9 items-center justify-center leading-normal font-medium hover:bg-gray-100 max-md:h-8 max-md:w-6"
                aria-label="Last Page"
                type="button"
              >
                <ChevronRightIcon />
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
