export interface User {
  id: number;
  name: string;
  username: string;
  email?: string;
  role: 'superadmin' | 'admin' | 'cashier' | 'kitchen';
  status: 'active' | 'inactive';
  must_change_password?: boolean;
  created_at: string;
}

export interface Unit {
  id: number;
  name: string;
  symbol: string;
  base_unit: string;
  conversion_value: number;
}

export interface Category {
  id: number;
  name: string;
  type: 'ingredient' | 'product';
}

export interface Supplier {
  id: number;
  name: string;
  phone: string;
  address: string;
  notes?: string;
}

export interface Ingredient {
  id: number;
  code: string;
  name: string;
  category_id: number;
  category_name?: string;
  unit_id: number;
  unit_name?: string;
  unit_symbol?: string;
  base_unit: string;
  conversion_value?: number;
  purchase_price: number;
  purchase_quantity: number;
  price_per_unit: number; // Price per base unit (e.g. per gram or per ml)
  stock: number; // Stock in base unit
  minimum_stock: number;
  supplier_id?: number;
  supplier_name?: string;
  buy_date?: string;
  status: 'active' | 'inactive';
  stock_value?: number;
  is_low_stock?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  category_id: number;
  category_name?: string;
  image?: string;
  description?: string;
  selling_price: number;
  hpp: number;
  profit_per_unit?: number;
  profit_nominal?: number;
  margin_percent?: number;
  margin_percentage?: number;
  stock: number;
  minimum_stock: number;
  has_recipe?: boolean;
  recipe_id?: number | null;
  is_low_stock?: boolean;
  stock_value?: number;
  total_sold?: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface RecipeItem {
  id: number;
  recipe_id: number;
  ingredient_id: number;
  ingredient_name?: string;
  ingredient_code?: string;
  ingredient_price_per_unit?: number;
  quantity: number;
  unit_id: number;
  unit_name?: string;
  unit_symbol?: string;
  calculated_cost: number;
}

export interface Recipe {
  id: number;
  product_id: number;
  product_name?: string;
  product_code?: string;
  product_selling_price?: number;
  production_quantity: number; // batch yield
  packaging_cost: number;
  labor_cost: number;
  utility_cost: number;
  other_cost: number;
  notes?: string;
  total_ingredient_cost?: number;
  total_batch_cost?: number;
  hpp_per_unit?: number;
  items: RecipeItem[];
  updated_at: string;
}

export interface ProductionItem {
  id: number;
  production_id: number;
  ingredient_id: number;
  ingredient_name: string;
  quantity_used: number;
  unit_symbol: string;
  cost: number;
}

export interface Production {
  id: number;
  production_number: string;
  product_id: number;
  product_name: string;
  quantity: number;
  ingredient_cost: number;
  packaging_cost: number;
  labor_cost: number;
  utility_cost: number;
  other_cost: number;
  total_cost: number;
  hpp_per_unit: number;
  production_date: string;
  notes?: string;
  created_by: number;
  created_by_name: string;
  items: ProductionItem[];
  created_at: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  selling_price: number;
  hpp: number;
  subtotal: number;
  profit: number;
}

export interface Sale {
  id: number;
  invoice_number: string;
  sale_date: string;
  customer_name: string;
  subtotal: number;
  discount: number;
  total: number;
  total_hpp: number;
  total_profit: number;
  payment_method: 'Cash' | 'Transfer' | 'QRIS' | 'E-wallet' | 'Lainnya';
  notes?: string;
  created_by: number;
  created_by_name: string;
  items: SaleItem[];
  created_at: string;
}

export interface Expense {
  id: number;
  expense_number: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  payment_method: string;
  receipt?: string;
  notes?: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
}

export interface StockMovement {
  id: number;
  item_type: 'ingredient' | 'product';
  item_id: number;
  item_name: string;
  movement_type: 'in' | 'out' | 'adjustment' | 'production' | 'sale';
  quantity: number;
  previous_stock: number;
  current_stock: number;
  reference_type: 'production' | 'sale' | 'purchase' | 'manual';
  reference_id?: string;
  notes?: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  user_name: string;
  action: string;
  module: string;
  details?: string;
  created_at: string;
}

export interface AppSettings {
  business_name: string;
  tagline: string;
  logo?: string;
  address: string;
  phone: string;
  owner_name?: string;
  whatsapp?: string;
  receipt_footer: string;
  currency: string;
  default_profit_target_percent: number;
  low_stock_threshold?: number;
}

export interface DashboardStats {
  totalProduk: number;
  totalBahanBaku: number;
  nilaiStokBahan: number;
  nilaiStokProduk: number;
  omzetToday: number;
  pengeluaranToday: number;
  labaKotorToday: number;
  labaBersihToday: number;
  produkTerjualToday: number;
  omzetPeriod: number;
  hppPeriod: number;
  labaKotorPeriod: number;
  pengeluaranPeriod: number;
  labaBersihPeriod: number;
  isProfit: boolean;
  alerts: {
    lowIngredientsCount: number;
    lowProductsCount: number;
    lowIngredients: Ingredient[];
    lowProducts: Product[];
    lossMakingProducts: Product[];
  };
}

export interface DashboardCharts {
  last7Days: { date: string; label: string; omzet: number; laba: number; pengeluaran: number }[];
  monthlyTrend: { month: string; omzet: number; laba: number; pengeluaran: number }[];
  topProducts: { id: number; name: string; quantity: number; omzet: number; profit: number }[];
  topIngredients: { id: number; name: string; quantity: number; unit: string; cost: number }[];
}

export interface DashboardSummary {
  today_revenue: number;
  today_gross_profit: number;
  today_expenses: number;
  today_net_profit: number;
  today_sales_count: number;
  month_revenue: number;
  month_gross_profit: number;
  month_expenses: number;
  month_net_profit: number;
  total_ingredient_stock_value: number;
  total_product_stock_value: number;
  low_stock_ingredients: Ingredient[];
  low_stock_products: Product[];
  recent_sales: Sale[];
  recent_productions: Production[];
  sales_chart: { date: string; revenue: number; profit: number }[];
}

export interface FinancialReport {
  start_date: string;
  end_date: string;
  gross_revenue: number;
  total_discount: number;
  net_revenue: number;
  total_hpp: number;
  gross_profit: number;
  gross_profit_margin: number;
  total_expenses: number;
  expenses_by_category: { category: string; total: number }[];
  net_profit: number;
  net_profit_margin: number;
  sales_count: number;
  production_count: number;
  total_production_cost: number;
}
