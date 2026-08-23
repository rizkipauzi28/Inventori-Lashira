import {
  User,
  Category,
  Unit,
  Supplier,
  Ingredient,
  Product,
  Recipe,
  Production,
  Sale,
  Expense,
  StockMovement,
  AuditLog,
  AppSettings,
  DashboardSummary,
  DashboardStats,
  DashboardCharts,
  FinancialReport
} from '../types';

export const api = {
  // Auth
  async login(username: string, password: string): Promise<{ success: boolean; user?: User; message: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return res.json();
  },

  async logout(userId: number, userName: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userName })
    });
    return res.json();
  },

  async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, oldPassword, newPassword })
    });
    return res.json();
  },

  // Dashboard
  async getDashboardSummary(): Promise<{ success: boolean; data: DashboardSummary }> {
    const res = await fetch('/api/dashboard/summary');
    return res.json();
  },

  async getDashboardStats(period = 'month', startDate?: string, endDate?: string): Promise<{ success: boolean; stats: DashboardStats }> {
    let url = `/api/dashboard/stats?period=${period}`;
    if (startDate && endDate) {
      url += `&startDate=${startDate}&endDate=${endDate}`;
    }
    const res = await fetch(url);
    return res.json();
  },

  async getDashboardCharts(): Promise<{ success: boolean } & DashboardCharts> {
    const res = await fetch('/api/dashboard/charts');
    return res.json();
  },

  // Master Data
  async getUnits(): Promise<{ success: boolean; data: Unit[] }> {
    const res = await fetch('/api/units');
    return res.json();
  },
  async createUnit(unit: Partial<Unit>): Promise<{ success: boolean; data: Unit; message: string }> {
    const res = await fetch('/api/units', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(unit)
    });
    return res.json();
  },

  async getCategories(type?: 'ingredient' | 'product'): Promise<{ success: boolean; data: Category[] }> {
    const res = await fetch(type ? `/api/categories?type=${type}` : '/api/categories');
    return res.json();
  },
  async createCategory(cat: Partial<Category>): Promise<{ success: boolean; data: Category; message: string }> {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cat)
    });
    return res.json();
  },

  async getSuppliers(): Promise<{ success: boolean; data: Supplier[] }> {
    const res = await fetch('/api/suppliers');
    return res.json();
  },
  async createSupplier(sup: Partial<Supplier>): Promise<{ success: boolean; data: Supplier; message: string }> {
    const res = await fetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sup)
    });
    return res.json();
  },

  // Ingredients
  async getIngredients(): Promise<{ success: boolean; data: Ingredient[] }> {
    const res = await fetch('/api/ingredients');
    return res.json();
  },
  async createIngredient(data: any): Promise<{ success: boolean; data: Ingredient; message: string }> {
    const res = await fetch('/api/ingredients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async updateIngredient(id: number, data: any): Promise<{ success: boolean; data: Ingredient; message: string }> {
    const res = await fetch(`/api/ingredients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async deleteIngredient(id: number): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/ingredients/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Products
  async getProducts(): Promise<{ success: boolean; data: Product[] }> {
    const res = await fetch('/api/products');
    return res.json();
  },
  async createProduct(data: any): Promise<{ success: boolean; data: Product; message: string }> {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async updateProduct(id: number, data: any): Promise<{ success: boolean; data: Product; message: string }> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async deleteProduct(id: number): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Recipes & HPP
  async getRecipes(): Promise<{ success: boolean; data: Recipe[] }> {
    const res = await fetch('/api/recipes');
    return res.json();
  },
  async getRecipeByProduct(productId: number): Promise<{ success: boolean; data: Recipe | null }> {
    const res = await fetch(`/api/recipes/product/${productId}`);
    return res.json();
  },
  async saveRecipe(data: any): Promise<{ success: boolean; data: Recipe; hpp_per_unit: number; message: string }> {
    const res = await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Productions
  async getProductions(): Promise<{ success: boolean; data: Production[] }> {
    const res = await fetch('/api/productions');
    return res.json();
  },
  async createProduction(data: any): Promise<{ success: boolean; data?: Production; message: string; insufficientIngredients?: any[] }> {
    const res = await fetch('/api/productions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Stocks & Movements
  async getStockMovements(item_type?: string, item_id?: number): Promise<{ success: boolean; data: StockMovement[] }> {
    let url = '/api/stocks/movements?limit=200';
    if (item_type) url += `&item_type=${item_type}`;
    if (item_id) url += `&item_id=${item_id}`;
    const res = await fetch(url);
    return res.json();
  },
  async adjustStock(data: any): Promise<{ success: boolean; message: string; current_stock: number }> {
    const res = await fetch('/api/stocks/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Sales / POS
  async getSales(): Promise<{ success: boolean; data: Sale[] }> {
    const res = await fetch('/api/sales');
    return res.json();
  },
  async createSale(data: any): Promise<{ success: boolean; data?: Sale; message: string }> {
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Expenses
  async getExpenses(): Promise<{ success: boolean; data: Expense[] }> {
    const res = await fetch('/api/expenses');
    return res.json();
  },
  async createExpense(data: any): Promise<{ success: boolean; data: Expense; message: string }> {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async deleteExpense(id: number): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Financial Reports
  async getFinancialReport(startDate?: string, endDate?: string): Promise<{ success: boolean; data: FinancialReport }> {
    let url = '/api/reports/financial';
    if (startDate && endDate) {
      url += `?start_date=${startDate}&end_date=${endDate}`;
    }
    const res = await fetch(url);
    return res.json();
  },

  // Users, Audit Logs, Settings, Database SQL
  async getUsers(): Promise<{ success: boolean; data: User[] }> {
    const res = await fetch('/api/users');
    return res.json();
  },
  async createUser(data: any): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async getAuditLogs(): Promise<{ success: boolean; data: AuditLog[] }> {
    const res = await fetch('/api/audit-logs');
    return res.json();
  },
  async getSettings(): Promise<{ success: boolean; data: AppSettings }> {
    const res = await fetch('/api/settings');
    return res.json();
  },
  async updateSettings(data: Partial<AppSettings>): Promise<{ success: boolean; data: AppSettings; message: string }> {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async getDatabaseSQL(): Promise<{ success: boolean; sql: string }> {
    const res = await fetch('/api/database/sql');
    return res.json();
  },

  // Upload
  async uploadImage(imageBase64: string): Promise<{ success: boolean; url: string; message: string }> {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64 })
    });
    return res.json();
  }
};
