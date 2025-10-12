// گروه مشتری (Group)
export interface CustomerGroup {
  id: number;
  name: string;
  created_at: string | null;
  updated_at: string | null;
}

// یک مشتری (Customer)
export interface Customer {
  id: number;
  email: string | null;
  name: string;
  first_name: string;
  last_name: string;
  gender: "Male" | "Female" | null;
  date_of_birth: string | null;
  phone: string | null;
  status: number;
  group?: CustomerGroup; // بعضی رکوردها group ندارند
  created_at: string;
  updated_at: string;
}

// لینک در meta.links
export interface MetaLink {
  url: string | null;
  label: string;
  active: boolean;
}

// متادیتا برای صفحه‌بندی
export interface Meta {
  current_page: number;
  from: number;
  last_page: number;
  links: MetaLink[];
  path: string;
  per_page: number;
  to: number;
  total: number;
}

// لینک‌های مستقیم (first, last, next, prev)
export interface PaginationLinks {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

// پاسخ کلی API برای مشتریان
export interface AdminCustomersResponse {
  data: Customer[];
  links: PaginationLinks;
  meta: Meta;
}
