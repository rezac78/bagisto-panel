"use client";
import React, { useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";

import { ChevronDownIcon, EyeClosed, ListFilterIcon, SearchIcon } from "lucide-react";

// import LoadingInline from "@/components/common/LoadingInline";

export type ListToolbarRef = { focusSearch: () => void };

type StatusOption = "Pending" | "Approved" | "Disapproved";

type FiltersState = {
  customer_full_name: string;
  created_from: string;
  created_to: string;
  status: StatusOption | "";
  rating: string;
  title: string;
  comment: string;
};

export type ListToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
  placeholder?: string;
  resultCount?: number | string;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  className?: string;
  dir?: "ltr" | "rtl";
  debounceMs?: number;
  initialFilters?: Partial<FiltersState>;
  onApplyFilters?: (filters: FiltersState) => void;
  onOpenFilters?: () => void;
  loading?: boolean;
};

const DEFAULT_PAGE_SIZES = [10, 20, 30, 50];
const STATUS_OPTIONS: StatusOption[] = ["Pending", "Approved", "Disapproved"];

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}
function fmtDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function monthRange(y: number, m0: number) {
  const s = new Date(y, m0, 1);
  const e = new Date(y, m0 + 1, 0);
  return { start: startOfDay(s), end: endOfDay(e) };
}
function lastNFullMonths(n: number) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const startMonth = m - n;
  const startDate = new Date(y, startMonth + 1, 1);
  startDate.setMonth(startDate.getMonth() - 1);
  startDate.setDate(1);
  const endDate = new Date(y, m, 0);
  return { start: startOfDay(startDate), end: endOfDay(endDate) };
}

const ListToolbar = React.forwardRef<ListToolbarRef, ListToolbarProps>(
  (
    {
      search,
      onSearchChange,
      onSearchSubmit,
      placeholder = "Search",
      resultCount,
      pageSize,
      pageSizeOptions = DEFAULT_PAGE_SIZES,
      onPageSizeChange,
      className = "",
      dir,
      debounceMs,
      initialFilters,
      onApplyFilters,
      onOpenFilters,
      loading,
    },
    ref,
  ) => {
    console.log(resultCount);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const statusWrapRef = useRef<HTMLDivElement | null>(null);
    const [localSearch, setLocalSearch] = useState(search);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [statusOpen, setStatusOpen] = useState(false);
    const [filters, setFilters] = useState<FiltersState>({
      customer_full_name: initialFilters?.customer_full_name ?? "",
      created_from: initialFilters?.created_from ?? "",
      created_to: initialFilters?.created_to ?? "",
      status: (initialFilters?.status as FiltersState["status"]) ?? "",
      rating: initialFilters?.rating ?? "",
      title: initialFilters?.title ?? "",
      comment: initialFilters?.comment ?? "",
    });

    useEffect(() => {
      setLocalSearch(search);
    }, [search]);

    useEffect(() => {
      if (debounceMs && debounceMs > 0) {
        const t = setTimeout(() => onSearchChange(localSearch), debounceMs);
        return () => clearTimeout(t);
      }
      onSearchChange(localSearch);
    }, [localSearch]);

    useImperativeHandle(ref, () => ({ focusSearch: () => inputRef.current?.focus() }));

    const hasPageSize = typeof pageSize === "number" && !!onPageSizeChange;
    const wrapperDirProps = useMemo(() => (dir ? { dir } : {}), [dir]);

    const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
      if (!onSearchSubmit) return;
      e.preventDefault();
      onSearchSubmit(localSearch);
    };

    const anyFilterSet = Object.values(filters).some((v) => `${v}`.trim() !== "");

    useEffect(() => {
      const onDocClick = (e: MouseEvent) => {
        if (!statusOpen) return;
        if (!statusWrapRef.current) return;
        if (!statusWrapRef.current.contains(e.target as Node)) setStatusOpen(false);
      };
      document.addEventListener("mousedown", onDocClick);
      return () => document.removeEventListener("mousedown", onDocClick);
    }, [statusOpen]);

    const applyPreset = (preset: string) => {
      const now = new Date();
      if (preset === "today") {
        setFilters((f) => ({ ...f, created_from: fmtDate(startOfDay(now)), created_to: fmtDate(endOfDay(now)) }));
      } else if (preset === "yesterday") {
        const y = new Date(now);
        y.setDate(now.getDate() - 1);
        setFilters((f) => ({ ...f, created_from: fmtDate(startOfDay(y)), created_to: fmtDate(endOfDay(y)) }));
      } else if (preset === "thisWeek") {
        const day = now.getDay();
        const mondayOffset = (day + 6) % 7;
        const s = new Date(now);
        s.setDate(now.getDate() - mondayOffset);
        const e = new Date(s);
        e.setDate(s.getDate() + 6);
        setFilters((f) => ({ ...f, created_from: fmtDate(startOfDay(s)), created_to: fmtDate(endOfDay(e)) }));
      } else if (preset === "thisMonth") {
        const { start, end } = monthRange(now.getFullYear(), now.getMonth());
        setFilters((f) => ({ ...f, created_from: fmtDate(start), created_to: fmtDate(end) }));
      } else if (preset === "lastMonth") {
        const m = now.getMonth() - 1;
        const y = now.getFullYear();
        const { start, end } = monthRange(y, m);
        setFilters((f) => ({ ...f, created_from: fmtDate(start), created_to: fmtDate(end) }));
      } else if (preset === "last3Months") {
        const { start, end } = lastNFullMonths(3);
        setFilters((f) => ({ ...f, created_from: fmtDate(start), created_to: fmtDate(end) }));
      } else if (preset === "last6Months") {
        const { start, end } = lastNFullMonths(6);
        setFilters((f) => ({ ...f, created_from: fmtDate(start), created_to: fmtDate(end) }));
      } else if (preset === "thisYear") {
        const s = new Date(now.getFullYear(), 0, 1);
        const e = new Date(now.getFullYear(), 11, 31);
        setFilters((f) => ({ ...f, created_from: fmtDate(startOfDay(s)), created_to: fmtDate(endOfDay(e)) }));
      }
    };

    return (
      <div {...wrapperDirProps} className={`mt-7 flex items-center justify-between gap-4 max-md:block ${className}`}>
        <div className="flex w-full gap-x-1">
          <div className="flex w-full items-center gap-x-1">
            <form
              onSubmit={handleSubmit}
              className="flex max-w-[445px] items-center max-md:w-full max-md:max-w-[250px]"
            >
              <div className="relative w-full">
                <input
                  ref={inputRef}
                  type="text"
                  name="search"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-600 transition-all hover:border-gray-400 focus:border-gray-400 max-md:max-w-[250px] max-md:py-2 max-sm:py-1.5 ltr:pr-8 rtl:pl-8"
                  placeholder={placeholder}
                  autoComplete="off"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  aria-label="Search"
                />
                {loading ? (
                  <SearchIcon className="absolute top-2.5 h-5 w-5 ltr:right-2.5 rtl:left-2.5" />
                ) : (
                  <SearchIcon className="pointer-events-none absolute top-2.5 h-5 w-5 ltr:right-2.5 rtl:left-2.5" />
                )}
              </div>
            </form>
            {typeof resultCount !== "undefined" && (
              <div className="max-md:hidden ltr:pl-2.5 rtl:pr-2.5" aria-live="polite">
                <p className="text-sm font-light text-gray-800 max-md:w-full">{resultCount} Results</p>
              </div>
            )}
          </div>
          <div className="hidden w-11 max-md:block">
            <button
              type="button"
              onClick={() => {
                setFiltersOpen(true);
                onOpenFilters?.();
              }}
              className="flex w-full max-w-[200px] items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-white py-2 text-sm hover:border-gray-400 focus:border-gray-400 ltr:pr-4 ltr:pl-3 max-md:ltr:pr-2.5 max-md:ltr:pl-2.5 rtl:pr-3 rtl:pl-4 max-md:rtl:pr-2.5 max-md:rtl:pl-2.5"
              aria-label="Open filters"
            >
              <span className="flex items-center gap-1.5">
                <ListFilterIcon className="h-5 w-5" />
                <span className="max-md:hidden">Filter</span>
              </span>
            </button>
          </div>
        </div>

        <div className="flex gap-x-4 max-md:my-4 max-md:items-center max-md:justify-between">
          {hasPageSize && (
            <div className="relative min-w-[96px]">
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="w-full appearance-none rounded-lg border border-zinc-200 bg-white py-2 text-sm hover:border-gray-400 focus:border-gray-400 ltr:pr-9 ltr:pl-4 max-md:ltr:pr-7 max-md:ltr:pl-2.5 rtl:pr-4 rtl:pl-9 max-md:rtl:pr-2.5 max-md:rtl:pl-7"
                aria-label="Items per page"
              >
                {(pageSizeOptions || DEFAULT_PAGE_SIZES).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 ltr:right-3 rtl:left-3" />
            </div>
          )}
          {typeof resultCount !== "undefined" && (
            <div className="hidden max-md:block ltr:pl-2.5 rtl:pr-2.5" aria-live="polite">
              <p className="text-sm font-light text-gray-800 max-md:w-full">{resultCount} Results</p>
            </div>
          )}
          <div className="max-md:hidden">
            <button
              type="button"
              onClick={() => {
                setFiltersOpen(true);
                onOpenFilters?.();
              }}
              className="flex w-full max-w-[200px] items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-white py-2 text-sm hover:border-gray-400 focus:border-gray-400 ltr:pr-4 ltr:pl-3 rtl:pr-3 rtl:pl-4"
            >
              <span className="flex items-center gap-1.5">
                <span className="max-md:hidden">Filter</span>
                <ListFilterIcon className="h-4 w-4" />
              </span>
            </button>
          </div>
        </div>

        {filtersOpen && (
          <>
            <div className="fixed inset-0 z-20 bg-gray-200/50" onClick={() => setFiltersOpen(false)} />
            <div
              className="fixed inset-y-0 z-[1000] overflow-hidden bg-white max-md:!w-full"
              style={{ width: 350, [dir === "rtl" ? "left" : "right"]: 0 }}
            >
              <div className="pointer-events-auto h-full w-full overflow-auto bg-white">
                <div className="flex h-full w-full flex-col">
                  <div className="min-h-0 min-w-0 flex-1 overflow-auto">
                    <div className="flex h-full flex-col">
                      <div className="relative grid gap-y-2.5 border-b border-zinc-200 p-6 pb-5 max-md:gap-y-1.5 max-md:p-4">
                        <p className="text-lg font-semibold">Apply Filters</p>
                        <div className="absolute top-5 max-sm:top-4" style={{ [dir === "rtl" ? "left" : "right"]: 20 }}>
                          <EyeClosed className="h-6 w-6 cursor-pointer" onClick={() => setFiltersOpen(false)} />
                        </div>
                      </div>

                      <div className="flex-1 overflow-auto p-4 px-6 max-md:px-4 max-md:pt-2.5">
                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm leading-6 font-medium text-gray-800">Customer</p>
                            <div className="flex items-center gap-x-1.5" />
                          </div>
                          <div className="mt-1.5 mb-2 grid">
                            <input
                              type="text"
                              className="w-full rounded-lg border px-3 py-2 text-sm text-gray-600 transition-all hover:border-gray-400 focus:border-gray-400"
                              name="customer_full_name"
                              placeholder="Customer"
                              value={filters.customer_full_name}
                              onChange={(e) => setFilters((f) => ({ ...f, customer_full_name: e.target.value }))}
                            />
                          </div>
                          <div className="mb-4 flex flex-wrap gap-2" />
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm leading-6 font-medium text-gray-800">Date</p>
                            <div className="flex items-center gap-x-1.5" />
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-1.5 max-sm:my-2">
                            <p
                              className="cursor-pointer rounded-md border border-gray-300 px-2 py-1.5 text-center leading-6 font-medium text-gray-600"
                              onClick={() => applyPreset("today")}
                            >
                              Today
                            </p>
                            <p
                              className="cursor-pointer rounded-md border border-gray-300 px-2 py-1.5 text-center leading-6 font-medium text-gray-600"
                              onClick={() => applyPreset("yesterday")}
                            >
                              Yesterday
                            </p>
                            <p
                              className="cursor-pointer rounded-md border border-gray-300 px-2 py-1.5 text-center leading-6 font-medium text-gray-600"
                              onClick={() => applyPreset("thisWeek")}
                            >
                              This Week
                            </p>
                            <p
                              className="cursor-pointer rounded-md border border-gray-300 px-2 py-1.5 text-center leading-6 font-medium text-gray-600"
                              onClick={() => applyPreset("thisMonth")}
                            >
                              This Month
                            </p>
                            <p
                              className="cursor-pointer rounded-md border border-gray-300 px-2 py-1.5 text-center leading-6 font-medium text-gray-600"
                              onClick={() => applyPreset("lastMonth")}
                            >
                              Last Month
                            </p>
                            <p
                              className="cursor-pointer rounded-md border border-gray-300 px-2 py-1.5 text-center leading-6 font-medium text-gray-600"
                              onClick={() => applyPreset("last3Months")}
                            >
                              Last 3 Months
                            </p>
                            <p
                              className="cursor-pointer rounded-md border border-gray-300 px-2 py-1.5 text-center leading-6 font-medium text-gray-600"
                              onClick={() => applyPreset("last6Months")}
                            >
                              Last 6 Months
                            </p>
                            <p
                              className="cursor-pointer rounded-md border border-gray-300 px-2 py-1.5 text-center leading-6 font-medium text-gray-600"
                              onClick={() => applyPreset("thisYear")}
                            >
                              This Year
                            </p>
                            <span className="relative">
                              <input
                                type="date"
                                name="created_at[from]"
                                className="flex min-h-10 w-full rounded-md border px-3 py-2 text-sm text-gray-600 hover:border-gray-400"
                                value={filters.created_from}
                                onChange={(e) => setFilters((f) => ({ ...f, created_from: e.target.value }))}
                              />
                            </span>
                            <span className="relative">
                              <input
                                type="date"
                                name="created_at[to]"
                                className="flex min-h-10 w-full rounded-md border px-3 py-2 text-sm text-gray-600 hover:border-gray-400"
                                value={filters.created_to}
                                onChange={(e) => setFilters((f) => ({ ...f, created_to: e.target.value }))}
                              />
                            </span>
                            <div className="mb-4 flex flex-wrap gap-2" />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm leading-6 font-medium text-gray-800">Status</p>
                            <div className="flex items-center gap-x-1.5" />
                          </div>
                          <div className="mt-1.5 mb-2">
                            <div className="relative" ref={statusWrapRef}>
                              <button
                                type="button"
                                onClick={() => setStatusOpen((s) => !s)}
                                className="flex w-full items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-white py-2 text-sm hover:border-gray-400 focus:border-gray-400 ltr:pr-3 ltr:pl-4 rtl:pr-4 rtl:pl-3"
                              >
                                <span>{filters.status || "Select"}</span>
                                <ChevronDownIcon className="h-4 w-4" />
                              </button>
                              {statusOpen && (
                                <div
                                  className="absolute z-20 w-max rounded-[20px] bg-white shadow-[0px_10px_84px_rgba(0,0,0,0.1)] max-md:rounded-lg"
                                  style={{ minWidth: 120, top: 46, [dir === "rtl" ? "left" : "right"]: 0 }}
                                >
                                  <ul className="py-4">
                                    {STATUS_OPTIONS.map((opt) => (
                                      <li
                                        key={opt}
                                        className="cursor-pointer px-5 py-2 text-base hover:bg-gray-100"
                                        onClick={() => {
                                          setFilters((f) => ({ ...f, status: opt }));
                                          setStatusOpen(false);
                                        }}
                                      >
                                        {opt}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="mb-4 flex flex-wrap gap-2" />
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm leading-6 font-medium text-gray-800">Rating</p>
                            <div className="flex items-center gap-x-1.5" />
                          </div>
                          <div className="mt-1.5 mb-2 grid">
                            <input
                              type="text"
                              className="w-full rounded-lg border px-3 py-2 text-sm text-gray-600 hover:border-gray-400 focus:border-gray-400"
                              name="rating"
                              placeholder="Rating"
                              value={filters.rating}
                              onChange={(e) => setFilters((f) => ({ ...f, rating: e.target.value }))}
                            />
                          </div>
                          <div className="mb-4 flex flex-wrap gap-2" />
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm leading-6 font-medium text-gray-800">Title</p>
                            <div className="flex items-center gap-x-1.5" />
                          </div>
                          <div className="mt-1.5 mb-2 grid">
                            <input
                              type="text"
                              className="w-full rounded-lg border px-3 py-2 text-sm text-gray-600 hover:border-gray-400 focus:border-gray-400"
                              name="title"
                              placeholder="Title"
                              value={filters.title}
                              onChange={(e) => setFilters((f) => ({ ...f, title: e.target.value }))}
                            />
                          </div>
                          <div className="mb-4 flex flex-wrap gap-2" />
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm leading-6 font-medium text-gray-800">Description</p>
                            <div className="flex items-center gap-x-1.5" />
                          </div>
                          <div className="mt-1.5 mb-2 grid">
                            <input
                              type="text"
                              className="w-full rounded-lg border px-3 py-2 text-sm text-gray-600 hover:border-gray-400 focus:border-gray-400"
                              name="comment"
                              placeholder="Description"
                              value={filters.comment}
                              onChange={(e) => setFilters((f) => ({ ...f, comment: e.target.value }))}
                            />
                          </div>
                          <div className="mb-4 flex flex-wrap gap-2" />
                        </div>

                        <div>
                          <button
                            type="button"
                            className={`primary-button w-full p-2.5 text-sm font-medium ${
                              !anyFilterSet ? "cursor-not-allowed opacity-50" : ""
                            }`}
                            disabled={!anyFilterSet}
                            onClick={() => {
                              onApplyFilters?.(filters);
                              setFiltersOpen(false);
                            }}
                          >
                            Apply Filters
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  },
);

ListToolbar.displayName = "ListToolbar";
export default ListToolbar;
