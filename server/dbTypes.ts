import fs from 'fs';
import path from 'path';

// Database file path for persistent file-based JSON relational engine
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  password: string; // bcrypt hash
  role: 'superadmin' | 'admin';
  status: 'active' | 'inactive';
  must_change_password?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  type: 'ingredient' | 'product';
}

export interface Unit {
  id: number;
  name: string;
  symbol: string;
  base_unit: string;
  conversion_value: number; // e.g., 1 kg = 1000 gram
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
  unit_id: number;
  purchase_price: number;
  purchase_quantity: number;
  price_per_unit: number; // calculated e.g. purchase_price / (purchase_quantity * conversion_value)
  stock: number; // stored in base unit (e.g. gram/ml/pcs) or display unit
  minimum_stock: number;
  supplier_id?: number;
  buy_date?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  category_id: number;
  image?: string;
  description?: string;
  selling_price: number;
  hpp: number;
  margin_percentage: number;
  stock: number;
  minimum_stock: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface RecipeItem {
  id: number;
  recipe_id: number;
  ingredient_id: number;
  quantity: number;
  unit_id: number;
  calculated_cost: number;
}

export interface Recipe {
  id: number;
  product_id: number;
  production_quantity: number; // batch yield e.g. 10 pcs
  packaging_cost: number;
  labor_cost: number;
  utility_cost: number; // gas / electricity
  other_cost: number;
  notes?: string;
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
  quantity: number; // positive or negative
  previous_stock: number;
  current_stock: number;
  reference_type: 'production' | 'sale' | 'purchase' | 'manual';
  reference_id?: number | string;
  notes?: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  user_name: string;
  activity: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

export interface AppSettings {
  business_name: string;
  tagline: string;
  logo: string;
  address: string;
  whatsapp: string;
  email: string;
  receipt_footer: string;
  currency: string;
  enable_negative_stock: boolean;
  auto_update_product_hpp: boolean;
}

export interface DatabaseSchema {
  users: User[];
  categories: Category[];
  units: Unit[];
  suppliers: Supplier[];
  ingredients: Ingredient[];
  products: Product[];
  recipes: Recipe[];
  productions: Production[];
  sales: Sale[];
  expenses: Expense[];
  stock_movements: StockMovement[];
  audit_logs: AuditLog[];
  settings: AppSettings;
}
