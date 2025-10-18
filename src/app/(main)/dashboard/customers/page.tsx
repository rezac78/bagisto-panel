import Customers from "@/components/dashboard/customers/customers";
import { getAuthToken } from "@/utils/lib/check-cookies";

export default async function Page() {
  const Token = await getAuthToken("user");
  return <Customers token={Token ?? ""} />;
}
