"use client";
import React, { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { ChevronRightIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getCustomers } from "@/utils/api/dashboard/customers";
import { renderStatusBadge } from "@/utils/lib/render-status-badge";
import { AdminCustomersResponse } from "@/utils/types/dashboard/customers";

import ListToolbar from "../../common/ListToolbar";
import ReviewsTableCustomers, { ColumnGroup } from "../../common/ReviewsTableCustomers";

type CustomersProps = {
  token: string;
};
export default function Customers({ token }: CustomersProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [customerData, setCustomerData] = useState<AdminCustomersResponse | null>(null);
  const [page, setPage] = useState(Number(searchParams.get("page") ?? 1));
  const [limit, setLimit] = useState(Number(searchParams.get("limit") ?? 10));
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "id");
  const [order, setOrder] = useState(searchParams.get("order") ?? "asc");
  const updateURL = (params: Record<string, string | number | undefined>) => {
    const current = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") current.set(key, String(val));
      else current.delete(key);
    });
    router.replace(`?${current.toString()}`);
  };
  useEffect(() => {
    if (!token) return;
    let mounted = true;
    setLoading(true);
    getCustomers(token, page, limit, sort, order)
      .then((res) => {
        if (mounted && res) setCustomerData(res);
        else if (mounted) setCustomerData(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [token, page, limit, sort, order, search]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateURL({ page: newPage });
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    updateURL({ limit: newLimit, page: 1 });
  };

  const handleSearchSubmit = (term: string) => {
    setSearch(term);
    setPage(1);
    updateURL({ search: term, page: 1 });
  };

  const handleSortChange = (newSort: string, newOrder: string) => {
    setSort(newSort);
    setOrder(newOrder);
    updateURL({ sort: newSort, order: newOrder });
  };
  const groups: ColumnGroup[] = useMemo(() => {
    return [
      {
        width: "1fr",
        headers: [
          { key: "customerName", label: "Customer Name" },
          { key: "email", label: "Email" },
          { key: "contactNumber", label: "Contact Number" },
        ],
        render: ({ row }) => (
          <div className="flex flex-col gap-1.5">
            <div className="text-lg font-bold">{row.name}</div>
            <div className="text-sm text-gray-500">{row.email}</div>
            <div>{row.phone}</div>
          </div>
        ),
      },
      {
        width: "1fr",
        headers: [
          { key: "status", label: "Status" },
          { key: "gender", label: "Gender" },
          { key: "group", label: "Group" },
          { key: "customerId", label: "Customer ID" },
        ],
        render: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate text-base font-bold">{renderStatusBadge(row.status)}</div>
            <div className="text-sm text-gray-500">{row.gender}</div>
            <div className="text-sm text-gray-500">{row.date_of_birth}</div>
            <div className="text-sm text-gray-500">{`ID - ${row.id}`}</div>
          </div>
        ),
      },
      {
        width: "1fr",
        headers: [
          { key: "revenue", label: "Revenue" },
          { key: "orderCount", label: "Order Count" },
          { key: "addressCount", label: "Address Count" },
        ],
        render: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate text-base font-bold">$0.00</div>
            <div className="text-sm text-gray-500">0 Order(s)</div>
            <div className="text-sm text-gray-500">0 Address(s)</div>
          </div>
        ),
      },
      {
        width: "0.5fr",
        headers: [],
        render: ({ row }) => (
          <Link
            href={`/dashboard/customers/view/${row.id}`}
            className="flex items-center justify-center text-gray-500 hover:text-black"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </Link>
        ),
      },
    ];
  }, []);
  return (
    <div className="">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-medium">Customers</h2>
        <Button size="lg" variant="outline" onClick={() => toast.info("Create Customers")}>
          Create Customers
        </Button>
      </div>

      <div className="">
        <ListToolbar
          search={search}
          onSearchChange={setSearch}
          onSearchSubmit={handleSearchSubmit}
          placeholder="Search customers..."
          resultCount={customerData?.meta.total ?? 0}
          pageSize={limit}
          pageSizeOptions={[10, 20, 30, 50]}
          onPageSizeChange={handleLimitChange}
          onOpenFilters={() => console.log("Open filters")}
          debounceMs={300}
          loading={loading}
        />
      </div>

      <div className="pr-4">
        <ReviewsTableCustomers
          rows={loading || !customerData ? [] : customerData.data}
          groups={groups}
          loading={loading}
          selectable
          emptyMessage="No Records Available."
          dir="ltr"
          perPage={limit}
          total={customerData?.meta.total}
          page={page}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
