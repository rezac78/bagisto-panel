import CustomersView from "@/components/dashboard/customers/customers/view";
import { getCustomerID } from "@/utils/api/dashboard/customers";
import { getAuthToken } from "@/utils/lib/check-cookies";
import { Customer } from "@/utils/types/dashboard/customers";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const Token = await getAuthToken("user");

  const DataCustomer = await getCustomerID(Token ?? "", id);
  const customerData = DataCustomer?.data as Customer | undefined;

  if (!customerData) {
    return <div className="p-10 text-center text-gray-500">Customer not found</div>;
  }
  return <CustomersView token={Token ?? ""} Data={customerData} />;
}
