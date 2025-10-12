"use client";
import React, { useMemo, useState } from "react";
import ListToolbar from "../../common/ListToolbar";
import ReviewsTableOrders, { ColumnGroup } from "../../common/ReviewsTableOrders";
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdminCustomersResponse } from "@/utils/types/dashboard/customers";

// 🔸 فیک تابع رندر وضعیت
function renderStatusBadge(status: string) {
  const colors: Record<string, string> = {
    completed: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    canceled: "bg-red-100 text-red-700",
    requested: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`rounded px-2 py-1 text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

// 🔸 داده‌های فیک
const fakeOrders = [
  {
    id: 1,
    increment_id: "1001",
    updated_at: "2025-10-10T14:32:00Z",
    status: "completed",
    customer_name: "Alice Johnson",
    customer_email: "alice@example.com",
    location: "Düsseldorf",
    total_item_count: 3,
    payment_method: "PayPal",
    shipping_method: "DHL Express",
    grand_total: 245.99,
    base_discount_amount: 15,
    commission: 24.6,
    seller_total: 206.39,
    seller_payout_status: "paid",
    order_id: 1,
    marketplace_transaction_id: 100,
  },
  {
    id: 2,
    increment_id: "1002",
    updated_at: "2025-10-11T11:21:00Z",
    status: "pending",
    customer_name: "Bob Smith",
    customer_email: "bob@example.com",
    location: "Berlin",
    total_item_count: 1,
    payment_method: "Credit Card",
    shipping_method: "UPS",
    grand_total: 85.5,
    base_discount_amount: 0,
    commission: 8.5,
    seller_total: 77,
    seller_payout_status: "pending",
    order_id: 2,
    marketplace_transaction_id: null,
  },
  {
    id: 3,
    increment_id: "1003",
    updated_at: "2025-10-12T09:00:00Z",
    status: "canceled",
    customer_name: "Chris Green",
    customer_email: "chris@example.com",
    location: "Hamburg",
    total_item_count: 5,
    payment_method: "Klarna",
    shipping_method: "DPD",
    grand_total: 300,
    base_discount_amount: 20,
    commission: 30,
    seller_total: 250,
    seller_payout_status: "pending",
    order_id: 3,
    marketplace_transaction_id: null,
  },
];
type CustomersProps = {
  CustomerData: AdminCustomersResponse;
};
export default function Customers({ CustomerData }: CustomersProps) {
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState(fakeOrders);
  console.log(CustomerData);
  // برای تست تغییر وضعیت پرداخت
  const updateRowStatus = (orderId: string | number, newStatus: Partial<(typeof rows)[number]>) => {
    setRows((prev) => prev.map((r) => (r.id === orderId ? { ...r, ...newStatus } : r)));
  };

  const groups: ColumnGroup[] = useMemo(() => {
    return [
      {
        width: "1fr",
        headers: [
          { key: "id", label: "ID" },
          { key: "Date", label: "Date" },
          { key: "Status", label: "Status" },
        ],
        render: ({ row }) => (
          <div className="flex flex-col gap-1.5">
            <div className="text-lg font-bold">{`ID - #${row.increment_id}`}</div>
            <div className="text-sm text-gray-500">{new Date(row.updated_at).toLocaleString("en-US")}</div>
            <div>{renderStatusBadge(row.status)}</div>
          </div>
        ),
      },
      {
        width: "1fr",
        headers: [
          { key: "Customer", label: "Customer" },
          { key: "Email", label: "Email" },
          { key: "Location", label: "Location" },
        ],
        render: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate text-base font-bold">{row.customer_name}</div>
            <div className="text-sm text-gray-500">{row.customer_email}</div>
            <div className="text-sm text-gray-500">{row.location}</div>
          </div>
        ),
      },
      {
        width: "1fr",
        headers: [
          { key: "Items", label: "Items" },
          { key: "Payment", label: "Payment" },
          { key: "Shipment", label: "Shipment" },
        ],
        render: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate text-sm text-gray-900">{row.total_item_count}</div>
            <div className="truncate text-sm text-gray-900">{row.payment_method}</div>
            <div className="truncate text-xs text-gray-500">{row.shipping_method}</div>
          </div>
        ),
      },
      {
        width: "1fr",
        headers: [
          { key: "Gross Amt", label: "Gross Amt" },
          { key: "Discount", label: "Discount" },
          { key: "Commission", label: "Commission" },
        ],
        render: ({ row }) => (
          <div className="min-w-0">
            <div className="text-sm text-gray-900">{row.grand_total.toFixed(2)}</div>
            <div className="text-sm text-gray-900">{row.base_discount_amount.toFixed(2)}</div>
            <div className="text-sm text-gray-500">{row.commission.toFixed(2)}</div>
          </div>
        ),
      },
      {
        width: "1fr",
        headers: [
          { key: "Seller Earn", label: "Seller Earn" },
          { key: "Payout", label: "Payout" },
        ],
        render: ({ row }) => (
          <div className="min-w-0">
            <div className="text-sm text-gray-900">{row.seller_total.toFixed(2)}</div>
            {row.seller_payout_status === "pending" && (
              <button
                onClick={() => {
                  toast.success(`Payment requested for #${row.increment_id}`);
                  updateRowStatus(row.id, { seller_payout_status: "requested" });
                }}
                className="mt-1 text-sm text-blue-500"
              >
                Request Payment
              </button>
            )}
            {row.seller_payout_status === "requested" && (
              <div className="mt-1 text-sm text-blue-500">Payment Requested</div>
            )}
            {row.seller_payout_status === "paid" && (
              <Link
                href={`/seller/transactions/view/${row.marketplace_transaction_id}`}
                className="mt-1 text-sm text-blue-500"
              >
                View Transaction
              </Link>
            )}
          </div>
        ),
      },
      {
        width: "0.5fr",
        headers: [],
        render: ({ row }) => (
          <Link
            href={`/seller/orders/view/${row.increment_id}`}
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
          onSearchSubmit={(v) => console.log("Search:", v)}
          placeholder="Search orders..."
          resultCount={rows.length}
          pageSize={pageSize}
          pageSizeOptions={[10, 20, 30, 50]}
          onPageSizeChange={setPageSize}
          onOpenFilters={() => console.log("Open filters")}
          debounceMs={250}
          onApplyFilters={(f) => console.log("Applied filters:", f)}
          loading={loading}
        />
      </div>

      <div className="pr-4">
        <ReviewsTableOrders
          rows={rows}
          groups={groups}
          loading={loading}
          selectable
          emptyMessage="No Records Available."
          onRowClick={(r) => console.log("Row clicked:", r)}
          onSortChange={(s) => console.log("Sort:", s)}
          dir="ltr"
        />
      </div>
    </div>
  );
}
