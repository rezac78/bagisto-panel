"use client";
import React, { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ShoppingCart, LogIn, X, Loader2, ChevronRightIcon } from "lucide-react";
import { toast } from "sonner";

import ConfirmationModal from "@/components/common/confirmation-modal";
import CustomerOrdersTable, { ColumnGroup } from "@/components/dashboard/common/CustomerOrdersTable";
import ListToolbar from "@/components/dashboard/common/ListToolbar";
import { DeleteCustomer, getCustomerInvoices, getCustomerOrders } from "@/utils/api/dashboard/customers";
import { renderStatusBadge } from "@/utils/lib/render-status-badge";
import { Customer } from "@/utils/types/dashboard/customers";
import { Order } from "@/utils/types/dashboard/order";

type CustomersProps = {
  token: string;
  Data: Customer;
};

export default function CustomersView({ token, Data }: CustomersProps) {
  const groups: ColumnGroup[] = useMemo(() => {
    return [
      {
        width: "1fr",
        headers: [
          { key: "OrderId", label: "Order Id" },
          { key: "date", label: "Date" },
          { key: "status", label: "Status" },
        ],
        render: ({ row }) => (
          <div className="flex flex-col gap-1.5">
            <div className="text-lg font-bold">#{row.id}</div>
            <div className="text-sm text-gray-500">{new Date(row.created_at).toLocaleString("en-US")}</div>
            <div className="truncate text-base font-bold">{renderStatusBadge(row.status)}</div>
          </div>
        ),
      },
      {
        width: "1fr",
        headers: [
          { key: "grandTotal", label: "Grand Total" },
          { key: "payby", label: "Pay By" },
          { key: "channelname", label: "Channel Name" },
        ],
        render: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate text-base font-bold">{row.formatted_grand_total}</div>
            <div className="text-sm text-gray-500">Pay By - {row.payment_title}</div>
            <div className="text-sm text-gray-500">{row.channel_name}</div>
          </div>
        ),
      },
      {
        width: "1fr",
        headers: [
          { key: "customername", label: "Customer Name" },
          { key: "email", label: "Email" },
          { key: "location", label: "Location" },
        ],
        render: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate text-base font-bold">{`${row.billing_address.first_name} ${row.billing_address.last_name}`}</div>
            <div className="text-sm text-gray-500">{row.billing_address.email}</div>
            <div className="text-sm text-gray-500">{`${row.billing_address.city},${row.billing_address.state},${row.billing_address.country}`}</div>
          </div>
        ),
      },
      {
        width: "0.5fr",
        headers: [],
        render: ({ row }) => (
          <Link
            href={`/sales/orders/view/${row.id}`}
            className="flex items-center justify-center text-gray-500 hover:text-black"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </Link>
        ),
      },
    ];
  }, []);
  const groups2: ColumnGroup[] = useMemo(() => {
    return [
      {
        width: "1fr",
        headers: [{ key: "InvoicesID", label: "Invoices Id" }],
        render: ({ row }) => (
          console.log(row),
          (
            <div className="flex flex-col gap-1.5">
              <div className="text-lg font-bold">#{row.id}</div>
            </div>
          )
        ),
      },
      {
        width: "1fr",
        headers: [{ key: "InvoicesDate", label: "Invoices Date" }],
        render: ({ row }) => (
          <div className="min-w-0">
            <div className="text-sm text-gray-500">{new Date(row.created_at).toLocaleString("en-US")}</div>
          </div>
        ),
      },
      {
        width: "1fr",
        headers: [{ key: "InvoicesAmount", label: "Invoices Amount" }],
        render: ({ row }) => <div className="min-w-0">{row.formatted_base_grand_total}</div>,
      },
      {
        width: "0.5fr",
        headers: [],
        render: ({ row }) => (
          <Link
            href={`/sales/invoices/view/${row.id}`}
            className="flex items-center justify-center text-gray-500 hover:text-black"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </Link>
        ),
      },
    ];
  }, []);
  const router = useRouter();
  const [openOrderModal, setOpenOrderModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);
  const [errorOrders, setErrorOrders] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Order[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [errorInvoices, setErrorInvoices] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [limit] = useState(10);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingOrders(true);
        const res = await getCustomerOrders(token, String(Data.id));
        const items: Order[] = res?.data ?? [];
        if (alive) {
          setOrders(Array.isArray(items) ? items : []);
          setErrorOrders(null);
        }
      } catch (err: any) {
        console.error("❌ getCustomerOrders failed:", err);
        if (alive) setErrorOrders("Failed to load orders");
      } finally {
        if (alive) setLoadingOrders(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [token, Data.id]);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingInvoices(true);
        const res = await getCustomerInvoices(token, String(Data.id));
        const items = res?.data ?? [];
        if (alive) {
          setInvoices(Array.isArray(items) ? items : []);
          setErrorInvoices(null);
        }
      } catch (err) {
        console.error("❌ getCustomerInvoices failed:", err);
        if (alive) setErrorInvoices("Failed to load invoices");
      } finally {
        if (alive) setLoadingInvoices(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [token, Data.id]);

  const handleConfirmCreateOrder = () => {
    setOpenOrderModal(false);
    toast.success("Redirecting to create order...");
    router.push("#");
  };

  const handleConfirmDelete = async () => {
    try {
      const res = await DeleteCustomer(token, String(Data.id));
      if (res) {
        toast.success("✅ Customer deleted successfully!");
        router.push("/admin/customers");
      } else {
        toast.error("❌ Failed to delete customer!");
      }
    } catch (err) {
      toast.error("⚠ Error deleting customer!");
      console.error(err);
    } finally {
      setOpenDeleteModal(false);
    }
  };
  console.log(orders);
  return (
    <div className="w-full">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-gray-900">{Data.name}</h2>
            <span>{renderStatusBadge(Data.status)}</span>
          </div>
          <div className="mt-4 flex items-center gap-6 text-sm text-gray-700">
            <button
              onClick={() => setOpenOrderModal(true)}
              className="flex cursor-pointer items-center gap-1.5 transition hover:text-[#0B1739]"
            >
              <ShoppingCart size={16} />
              <span className="font-medium">Create Order</span>
            </button>

            <button
              onClick={() => toast.success("🔑 Logged in as Customer")}
              className="flex items-center gap-1.5 transition hover:text-[#0B1739]"
            >
              <LogIn size={16} />
              <span className="font-medium">Login as customer</span>
            </button>

            <button
              onClick={() => setOpenDeleteModal(true)}
              className="flex items-center gap-1.5 transition hover:text-red-600"
            >
              <X size={16} />
              <span className="font-medium">Delete Account</span>
            </button>
          </div>
        </div>
        <button
          onClick={() => toast.info("⬅ Back clicked")}
          className="cursor-pointer text-sm font-medium text-gray-600 transition hover:text-[#0B1739]"
        >
          Back
        </button>
      </div>
      <div className="">
        <div className="w-full rounded-sm border border-gray-200 bg-white p-5 shadow-sm">
          {loadingOrders ? (
            <div className="flex items-center justify-center py-10 text-gray-500">
              <Loader2 className="mr-2 animate-spin" size={18} /> Loading orders...
            </div>
          ) : errorOrders ? (
            <div className="py-8 text-center text-red-500">{errorOrders}</div>
          ) : orders.length === 0 ? (
            <div className="py-8 text-center text-gray-400">No orders found for this customer.</div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">Orders ({orders.length})</h3>
              </div>
              <div className="">
                <ListToolbar
                  search={search}
                  onSearchChange={setSearch}
                  placeholder="Search orders..."
                  resultCount={orders.length}
                  pageSize={limit}
                  pageSizeOptions={[10, 20, 30, 50]}
                  debounceMs={300}
                  loading={loadingOrders}
                />
              </div>
              <CustomerOrdersTable rows={orders} groups={groups} />
            </>
          )}
        </div>
      </div>
      <div className="mt-4">
        <div className="w-full rounded-sm border border-gray-200 bg-white p-5 shadow-sm">
          {loadingInvoices ? (
            <div className="flex items-center justify-center py-10 text-gray-500">
              <Loader2 className="mr-2 animate-spin" size={18} /> Loading invoices...
            </div>
          ) : errorInvoices ? (
            <div className="py-8 text-center text-red-500">{errorInvoices}</div>
          ) : invoices.length === 0 ? (
            <div className="py-8 text-center text-gray-400">No orders found for this customer.</div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">Invoices ({invoices.length})</h3>
              </div>
              <div className="">
                <ListToolbar
                  search={search}
                  onSearchChange={setSearch}
                  placeholder="Search invoices..."
                  resultCount={invoices.length}
                  pageSize={limit}
                  pageSizeOptions={[10, 20, 30, 50]}
                  debounceMs={300}
                  loading={loadingInvoices}
                />
              </div>
              <CustomerOrdersTable rows={invoices} groups={groups2} />
            </>
          )}
        </div>
      </div>
      <ConfirmationModal
        open={openOrderModal}
        title="Are you sure?"
        message="Are you sure you want to create order for this customer?"
        confirmText="Agree"
        cancelText="Disagree"
        onConfirm={handleConfirmCreateOrder}
        onCancel={() => setOpenOrderModal(false)}
      />

      <ConfirmationModal
        open={openDeleteModal}
        title="Delete Account"
        message="This action cannot be undone. Do you really want to delete this customer?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setOpenDeleteModal(false)}
      />
    </div>
  );
}
