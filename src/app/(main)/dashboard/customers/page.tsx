import Customers from "@/components/dashboard/customers/customers";
import { getCustomers } from "@/utils/api/dashboard/customers";
import { getAuthToken } from "@/utils/lib/check-cookies";

export default async function Page() {
  const Token = await getAuthToken("user");

  const CustomerData = await getCustomers(Token ?? "");
  if (!CustomerData) {
    return <div className="p-6 text-red-500">❌ No customer data available.</div>;
  }
  return <Customers CustomerData={CustomerData} />;
}
