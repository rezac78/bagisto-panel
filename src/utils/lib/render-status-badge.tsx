import React from "react";

export function renderStatusBadge(status: string | number | null | undefined) {
  if (status === null || status === undefined) return null;
  const normalized = String(status).trim().toLowerCase();
  const statusMap: Record<string, { text: string; color: string; bg: string }> = {
    completed: { text: "Completed", color: "#FFFFFF", bg: "#35AF62" }, // سبز
    paid: { text: "Paid", color: "#FFFFFF", bg: "#35AF62" }, // سبز
    canceled: { text: "Canceled", color: "#FFFFFF", bg: "#DD2A77" }, // قرمز
    pending: { text: "Pending", color: "#FFFFFF", bg: "#EAB308" }, // زرد
    requested: { text: "Requested", color: "#FFFFFF", bg: "#EAB308" },
    invoicepending: { text: "Invoice Pending", color: "#FFFFFF", bg: "#EAB308" },
    paymentrequested: { text: "Payment Requested", color: "#FFFFFF", bg: "#EAB308" },
    manual: { text: "Manual Payment", color: "#FFFFFF", bg: "#02B1FD" },

    // 🔢 حالت‌های عددی احتمالی
    "0": { text: "Inactive", color: "#FFFFFF", bg: "#DD2A77" },
    "1": { text: "Active", color: "#FFFFFF", bg: "#35AF62" },
    "2": { text: "Pending", color: "#FFFFFF", bg: "#EAB308" },
  };

  const current = statusMap[normalized] || { text: normalized, color: "#222", bg: "#EAEAEA" };

  return (
    <span
      className="rounded-full px-1.5 py-[1px] text-xs font-semibold capitalize"
      style={{
        backgroundColor: current.bg,
        color: current.color,
      }}
    >
      {current.text}
    </span>
  );
}
