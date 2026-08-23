import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from './db.js';
import { User, Ingredient, Product, Recipe, Production, Sale, Expense, StockMovement, RecipeItem } from './dbTypes.js';

export const apiRouter = Router();

// Helper to calculate price per unit base (per gram or per ml or per pcs)
export function calculatePricePerUnit(purchasePrice: number, purchaseQuantity: number, unitId: number): number {
  const data = db.getData();
  const unit = data.units.find(u => u.id === unitId);
  const conversion = unit ? unit.conversion_value : 1;
  const totalBaseUnits = purchaseQuantity * conversion;
  if (totalBaseUnits <= 0) return 0;
  return Number((purchasePrice / totalBaseUnits).toFixed(4));
}

// Helper to convert recipe item quantity into cost based on ingredient price
export function calculateRecipeItemCost(ingredient: Ingredient, quantity: number, unitId: number): number {
  const data = db.getData();
  const unit = data.units.find(u => u.id === unitId);
  const conversion = unit ? unit.conversion_value : 1;
  const baseQuantity = quantity * conversion;
  return Number((baseQuantity * ingredient.price_per_unit).toFixed(2));
}

// ==========================================
// 1. AUTHENTICATION & SESSIONS
// ==========================================
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username/email dan password wajib diisi.' });
  }

  const data = db.getData();
  const user = data.users.find(u => 
    (u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase()) && 
    u.status === 'active'
  );

  if (!user) {
    return res.status(401).json({ success: false, message: 'Kombinasi akun atau password salah, atau akun nonaktif.' });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ success: false, message: 'Password salah. Silakan coba lagi.' });
  }

  db.logAudit(user.id, user.name, 'Admin Login', `Login berhasil melalui web dashboard.`);

  // Return safe user info (exclude hashed password)
  const safeUser = {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status,
    must_change_password: user.must_change_password || false
  };

  return res.json({ success: true, user: safeUser, message: `Selamat datang kembali, ${user.name}!` });
});

apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  const { userId, userName } = req.body;
  if (userId) {
    db.logAudit(userId, userName || 'User', 'Admin Logout', 'Pengguna keluar dari sistem.');
  }
  return res.json({ success: true, message: 'Logout berhasil.' });
});

apiRouter.post('/auth/change-password', (req: Request, res: Response) => {
  const { userId, oldPassword, newPassword } = req.body;
  if (!userId || !newPassword) {
    return res.status(400).json({ success: false, message: 'Data tidak lengkap.' });
  }

  const data = db.getData();
  const user = data.users.find(u => u.id === Number(userId));
  if (!user) {
    return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
  }

  if (oldPassword) {
    const isValid = bcrypt.compareSync(oldPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Password lama tidak sesuai.' });
    }
  }

  const salt = bcrypt.genSaltSync(10);
  user.password = bcrypt.hashSync(newPassword, salt);
  user.must_change_password = false;
  user.updated_at = new Date().toISOString().replace('T', ' ').substring(0, 19);

  db.save();
  db.logAudit(user.id, user.name, 'Ganti Password', 'Password akun berhasil diperbarui.');

  return res.json({ success: true, message: 'Password berhasil diubah!' });
});

// ==========================================
// 2. DASHBOARD & STATS
// ==========================================
apiRouter.get('/dashboard/stats', (req: Request, res: Response) => {
  const { period = 'month', startDate, endDate } = req.query;
  const data = db.getData();

  const now = new Date();
  let start = new Date(now.getFullYear(), now.getMonth(), 1);
  let end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  if (period === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  } else if (period === 'week') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
    start = new Date(now.setDate(diff));
    start.setHours(0, 0, 0, 0);
    end = new Date(now.setDate(diff + 6));
    end.setHours(23, 59, 59, 999);
  } else if (period === 'year') {
    start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
    end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
  } else if (period === 'custom' && startDate && endDate) {
    start = new Date(String(startDate) + 'T00:00:00');
    end = new Date(String(endDate) + 'T23:59:59');
  }

  // Today specific calculations
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const salesToday = data.sales.filter(s => {
    const d = new Date(s.sale_date);
    return d >= todayStart && d <= todayEnd;
  });

  const expensesToday = data.expenses.filter(e => {
    const d = new Date(e.date + 'T12:00:00');
    return d >= todayStart && d <= todayEnd;
  });

  const omzetToday = salesToday.reduce((sum, s) => sum + s.total, 0);
  const hppToday = salesToday.reduce((sum, s) => sum + s.total_hpp, 0);
  const labaKotorToday = omzetToday - hppToday;
  const pengeluaranToday = expensesToday.reduce((sum, e) => sum + e.amount, 0);
  const labaBersihToday = labaKotorToday - pengeluaranToday;
  const produkTerjualToday = salesToday.reduce((sum, s) => sum + s.items.reduce((iSum, item) => iSum + item.quantity, 0), 0);

  // Period specific calculations
  const salesPeriod = data.sales.filter(s => {
    const d = new Date(s.sale_date);
    return d >= start && d <= end;
  });

  const expensesPeriod = data.expenses.filter(e => {
    const d = new Date(e.date + 'T12:00:00');
    return d >= start && d <= end;
  });

  const omzetPeriod = salesPeriod.reduce((sum, s) => sum + s.total, 0);
  const hppPeriod = salesPeriod.reduce((sum, s) => sum + s.total_hpp, 0);
  const labaKotorPeriod = omzetPeriod - hppPeriod;
  const pengeluaranPeriod = expensesPeriod.reduce((sum, e) => sum + e.amount, 0);
  const labaBersihPeriod = labaKotorPeriod - pengeluaranPeriod;

  // Inventory value calculations
  const totalBahanBaku = data.ingredients.length;
  const totalProduk = data.products.length;
  const nilaiStokBahan = data.ingredients.reduce((sum, ing) => sum + (ing.stock * ing.price_per_unit), 0);
  const nilaiStokProduk = data.products.reduce((sum, p) => sum + (p.stock * p.hpp), 0);

  // Alerts: Low ingredients & Low product stocks
  const lowIngredients = data.ingredients.filter(ing => ing.status === 'active' && ing.stock <= ing.minimum_stock);
  const lowProducts = data.products.filter(p => p.status === 'active' && p.stock <= p.minimum_stock);

  // Negative profit products check
  const lossMakingProducts = data.products.filter(p => p.selling_price < p.hpp);

  return res.json({
    success: true,
    stats: {
      totalProduk,
      totalBahanBaku,
      nilaiStokBahan,
      nilaiStokProduk,
      // Today
      omzetToday,
      pengeluaranToday,
      labaKotorToday,
      labaBersihToday,
      produkTerjualToday,
      // Period
      omzetPeriod,
      hppPeriod,
      labaKotorPeriod,
      pengeluaranPeriod,
      labaBersihPeriod,
      // Status
      isProfit: labaBersihPeriod >= 0,
      alerts: {
        lowIngredientsCount: lowIngredients.length,
        lowProductsCount: lowProducts.length,
        lowIngredients,
        lowProducts,
        lossMakingProducts
      }
    }
  });
});

apiRouter.get('/dashboard/charts', (req: Request, res: Response) => {
  const data = db.getData();
  const now = new Date();

  // 1. Last 7 Days Omzet & Profit
  const last7Days: { date: string; label: string; omzet: number; laba: number; pengeluaran: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });

    const daySales = data.sales.filter(s => s.sale_date.startsWith(dateStr));
    const dayExpenses = data.expenses.filter(e => e.date === dateStr);

    const dayOmzet = daySales.reduce((sum, s) => sum + s.total, 0);
    const dayHpp = daySales.reduce((sum, s) => sum + s.total_hpp, 0);
    const dayLabaKotor = dayOmzet - dayHpp;
    const dayPengeluaran = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const dayLabaBersih = dayLabaKotor - dayPengeluaran;

    last7Days.push({
      date: dateStr,
      label: dayLabel,
      omzet: dayOmzet,
      laba: dayLabaBersih,
      pengeluaran: dayPengeluaran
    });
  }

  // 2. Monthly Trend (last 6 months)
  const monthlyTrend: { month: string; omzet: number; laba: number; pengeluaran: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const monthKey = `${yyyy}-${mm}`;
    const monthLabel = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });

    const monthSales = data.sales.filter(s => s.sale_date.startsWith(monthKey));
    const monthExpenses = data.expenses.filter(e => e.date.startsWith(monthKey));

    const mOmzet = monthSales.reduce((sum, s) => sum + s.total, 0);
    const mHpp = monthSales.reduce((sum, s) => sum + s.total_hpp, 0);
    const mPengeluaran = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const mLabaBersih = (mOmzet - mHpp) - mPengeluaran;

    monthlyTrend.push({
      month: monthLabel,
      omzet: mOmzet,
      laba: mLabaBersih,
      pengeluaran: mPengeluaran
    });
  }

  // 3. Top 5 Best Selling Products
  const productSalesMap: Record<number, { id: number; name: string; quantity: number; omzet: number; profit: number }> = {};
  data.sales.forEach(sale => {
    sale.items.forEach(item => {
      if (!productSalesMap[item.product_id]) {
        productSalesMap[item.product_id] = {
          id: item.product_id,
          name: item.product_name,
          quantity: 0,
          omzet: 0,
          profit: 0
        };
      }
      productSalesMap[item.product_id].quantity += item.quantity;
      productSalesMap[item.product_id].omzet += item.subtotal;
      productSalesMap[item.product_id].profit += item.profit;
    });
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // 4. Ingredient Usage Stats from Productions
  const ingredientUsageMap: Record<number, { id: number; name: string; quantity: number; unit: string; cost: number }> = {};
  data.productions.forEach(prod => {
    prod.items.forEach(item => {
      if (!ingredientUsageMap[item.ingredient_id]) {
        ingredientUsageMap[item.ingredient_id] = {
          id: item.ingredient_id,
          name: item.ingredient_name,
          quantity: 0,
          unit: item.unit_symbol,
          cost: 0
        };
      }
      ingredientUsageMap[item.ingredient_id].quantity += item.quantity_used;
      ingredientUsageMap[item.ingredient_id].cost += item.cost;
    });
  });

  const topIngredients = Object.values(ingredientUsageMap)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5);

  return res.json({
    success: true,
    last7Days,
    monthlyTrend,
    topProducts,
    topIngredients
  });
});

// ==========================================
// 3. MASTER DATA: UNITS, CATEGORIES, SUPPLIERS
// ==========================================
apiRouter.get('/units', (req: Request, res: Response) => {
  res.json({ success: true, data: db.getData().units });
});

apiRouter.post('/units', (req: Request, res: Response) => {
  const { name, symbol, base_unit, conversion_value } = req.body;
  if (!name || !symbol) return res.status(400).json({ success: false, message: 'Nama dan simbol satuan wajib diisi.' });

  const data = db.getData();
  const newId = data.units.length > 0 ? Math.max(...data.units.map(u => u.id)) + 1 : 1;
  const newUnit: any = {
    id: newId,
    name,
    symbol,
    base_unit: base_unit || symbol,
    conversion_value: Number(conversion_value) || 1
  };
  data.units.push(newUnit);
  db.save();
  return res.json({ success: true, data: newUnit, message: 'Satuan berhasil ditambahkan.' });
});

apiRouter.get('/categories', (req: Request, res: Response) => {
  const { type } = req.query;
  const data = db.getData();
  let categories = data.categories;
  if (type) {
    categories = categories.filter(c => c.type === type);
  }
  res.json({ success: true, data: categories });
});

apiRouter.post('/categories', (req: Request, res: Response) => {
  const { name, type } = req.body;
  if (!name || !type) return res.status(400).json({ success: false, message: 'Nama dan tipe kategori wajib diisi.' });

  const data = db.getData();
  const newId = data.categories.length > 0 ? Math.max(...data.categories.map(c => c.id)) + 1 : 1;
  const newCategory = { id: newId, name, type };
  data.categories.push(newCategory);
  db.save();
  return res.json({ success: true, data: newCategory, message: 'Kategori berhasil ditambahkan.' });
});

apiRouter.get('/suppliers', (req: Request, res: Response) => {
  res.json({ success: true, data: db.getData().suppliers });
});

apiRouter.post('/suppliers', (req: Request, res: Response) => {
  const { name, phone, address, notes } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Nama supplier wajib diisi.' });

  const data = db.getData();
  const newId = data.suppliers.length > 0 ? Math.max(...data.suppliers.map(s => s.id)) + 1 : 1;
  const newSupplier = { id: newId, name, phone, address, notes };
  data.suppliers.push(newSupplier);
  db.save();
  return res.json({ success: true, data: newSupplier, message: 'Supplier berhasil ditambahkan.' });
});

// ==========================================
// 4. MASTER DATA: BAHAN BAKU (INGREDIENTS)
// ==========================================
apiRouter.get('/ingredients', (req: Request, res: Response) => {
  const data = db.getData();
  const enriched = data.ingredients.map(ing => {
    const category = data.categories.find(c => c.id === ing.category_id);
    const unit = data.units.find(u => u.id === ing.unit_id);
    const supplier = data.suppliers.find(s => s.id === ing.supplier_id);
    return {
      ...ing,
      category_name: category ? category.name : '-',
      unit_name: unit ? unit.name : '-',
      unit_symbol: unit ? unit.symbol : '-',
      base_unit: unit ? unit.base_unit : 'g',
      conversion_value: unit ? unit.conversion_value : 1,
      supplier_name: supplier ? supplier.name : '-',
      stock_value: ing.stock * ing.price_per_unit,
      is_low_stock: ing.stock <= ing.minimum_stock
    };
  });
  res.json({ success: true, data: enriched });
});

apiRouter.post('/ingredients', (req: Request, res: Response) => {
  const {
    code,
    name,
    category_id,
    unit_id,
    purchase_price,
    purchase_quantity,
    stock,
    minimum_stock,
    supplier_id,
    buy_date,
    status = 'active',
    userId,
    userName
  } = req.body;

  if (!name || !category_id || !unit_id || purchase_price === undefined) {
    return res.status(400).json({ success: false, message: 'Nama bahan, kategori, satuan, dan harga beli wajib diisi.' });
  }

  const data = db.getData();
  const finalCode = code || db.generateCode('BAHAN');
  const finalPricePerUnit = calculatePricePerUnit(Number(purchase_price), Number(purchase_quantity) || 1, Number(unit_id));

  // Determine initial stock in base unit
  const unit = data.units.find(u => u.id === Number(unit_id));
  const conversion = unit ? unit.conversion_value : 1;
  const initialStockBase = stock !== undefined ? Number(stock) : (Number(purchase_quantity) || 1) * conversion;

  const newId = data.ingredients.length > 0 ? Math.max(...data.ingredients.map(i => i.id)) + 1 : 1;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  const newIngredient: Ingredient = {
    id: newId,
    code: finalCode,
    name,
    category_id: Number(category_id),
    unit_id: Number(unit_id),
    purchase_price: Number(purchase_price),
    purchase_quantity: Number(purchase_quantity) || 1,
    price_per_unit: finalPricePerUnit,
    stock: initialStockBase,
    minimum_stock: Number(minimum_stock) || 0,
    supplier_id: supplier_id ? Number(supplier_id) : undefined,
    buy_date: buy_date || new Date().toISOString().split('T')[0],
    status,
    created_at: now,
    updated_at: now
  };

  data.ingredients.push(newIngredient);

  // Record initial stock movement
  if (initialStockBase > 0) {
    const newMovementId = data.stock_movements.length > 0 ? Math.max(...data.stock_movements.map(m => m.id)) + 1 : 1;
    data.stock_movements.push({
      id: newMovementId,
      item_type: 'ingredient',
      item_id: newId,
      item_name: name,
      movement_type: 'in',
      quantity: initialStockBase,
      previous_stock: 0,
      current_stock: initialStockBase,
      reference_type: 'purchase',
      reference_id: finalCode,
      notes: 'Pencatatan stok awal bahan baku baru',
      created_at: now
    });
  }

  db.save();
  db.logAudit(userId || 1, userName || 'Admin', 'Tambah Bahan Baku', `Menambahkan bahan: ${name} (${finalCode}) harga Rp ${Number(purchase_price).toLocaleString('id-ID')}`);

  return res.json({ success: true, data: newIngredient, message: `Bahan baku ${name} berhasil ditambahkan!` });
});

apiRouter.put('/ingredients/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const data = db.getData();
  const index = data.ingredients.findIndex(i => i.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Bahan baku tidak ditemukan.' });
  }

  const existing = data.ingredients[index];
  const {
    name,
    category_id,
    unit_id,
    purchase_price,
    purchase_quantity,
    stock,
    minimum_stock,
    supplier_id,
    buy_date,
    status,
    userId,
    userName
  } = req.body;

  const newUnitId = unit_id !== undefined ? Number(unit_id) : existing.unit_id;
  const newPurchasePrice = purchase_price !== undefined ? Number(purchase_price) : existing.purchase_price;
  const newPurchaseQty = purchase_quantity !== undefined ? Number(purchase_quantity) : existing.purchase_quantity;

  const updatedPricePerUnit = calculatePricePerUnit(newPurchasePrice, newPurchaseQty, newUnitId);
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  // If stock was adjusted manually
  if (stock !== undefined && Number(stock) !== existing.stock) {
    const diff = Number(stock) - existing.stock;
    const movementId = data.stock_movements.length > 0 ? Math.max(...data.stock_movements.map(m => m.id)) + 1 : 1;
    data.stock_movements.push({
      id: movementId,
      item_type: 'ingredient',
      item_id: id,
      item_name: name || existing.name,
      movement_type: diff > 0 ? 'in' : 'out',
      quantity: diff,
      previous_stock: existing.stock,
      current_stock: Number(stock),
      reference_type: 'manual',
      notes: 'Penyesuaian stok manual dari form edit bahan',
      created_at: now
    });
  }

  data.ingredients[index] = {
    ...existing,
    name: name || existing.name,
    category_id: category_id !== undefined ? Number(category_id) : existing.category_id,
    unit_id: newUnitId,
    purchase_price: newPurchasePrice,
    purchase_quantity: newPurchaseQty,
    price_per_unit: updatedPricePerUnit,
    stock: stock !== undefined ? Number(stock) : existing.stock,
    minimum_stock: minimum_stock !== undefined ? Number(minimum_stock) : existing.minimum_stock,
    supplier_id: supplier_id !== undefined ? (supplier_id ? Number(supplier_id) : undefined) : existing.supplier_id,
    buy_date: buy_date || existing.buy_date,
    status: status || existing.status,
    updated_at: now
  };

  db.save();
  db.logAudit(userId || 1, userName || 'Admin', 'Ubah Bahan Baku', `Mengubah data bahan: ${data.ingredients[index].name} (${data.ingredients[index].code})`);

  return res.json({ success: true, data: data.ingredients[index], message: 'Data bahan baku berhasil diperbarui!' });
});

apiRouter.delete('/ingredients/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const data = db.getData();
  const index = data.ingredients.findIndex(i => i.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Bahan baku tidak ditemukan.' });
  }

  // Check if ingredient is used in any active recipe
  const isUsedInRecipe = data.recipes.some(r => r.items.some(it => it.ingredient_id === id));
  if (isUsedInRecipe) {
    return res.status(400).json({
      success: false,
      message: 'Bahan baku ini sedang digunakan dalam Resep Produk. Hapus atau sesuaikan resep terlebih dahulu, atau ubah status bahan menjadi Nonaktif.'
    });
  }

  const ingName = data.ingredients[index].name;
  data.ingredients.splice(index, 1);
  db.save();
  db.logAudit(1, 'Admin', 'Hapus Bahan Baku', `Menghapus bahan baku: ${ingName}`);

  return res.json({ success: true, message: `Bahan baku ${ingName} berhasil dihapus!` });
});

// ==========================================
// 5. MASTER DATA: PRODUK (PRODUCTS)
// ==========================================
apiRouter.get('/products', (req: Request, res: Response) => {
  const data = db.getData();
  const enriched = data.products.map(p => {
    const category = data.categories.find(c => c.id === p.category_id);
    const recipe = data.recipes.find(r => r.product_id === p.id);
    const profitNominal = p.selling_price - p.hpp;
    const marginPct = p.hpp > 0 ? Number(((profitNominal / p.hpp) * 100).toFixed(2)) : 0;
    return {
      ...p,
      category_name: category ? category.name : '-',
      has_recipe: !!recipe,
      recipe_id: recipe ? recipe.id : null,
      profit_nominal: profitNominal,
      margin_percentage: marginPct,
      is_low_stock: p.stock <= p.minimum_stock,
      stock_value: p.stock * p.hpp
    };
  });
  res.json({ success: true, data: enriched });
});

apiRouter.post('/products', (req: Request, res: Response) => {
  const {
    code,
    name,
    category_id,
    image,
    description,
    selling_price,
    hpp = 0,
    margin_percentage = 0,
    stock = 0,
    minimum_stock = 10,
    status = 'active',
    userId,
    userName
  } = req.body;

  if (!name || !category_id || selling_price === undefined) {
    return res.status(400).json({ success: false, message: 'Nama produk, kategori, dan harga jual wajib diisi.' });
  }

  const data = db.getData();
  const finalCode = code || `PRD-${String(data.products.length + 1).padStart(3, '0')}`;
  const newId = data.products.length > 0 ? Math.max(...data.products.map(p => p.id)) + 1 : 1;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  const profitNominal = Number(selling_price) - Number(hpp);
  const calculatedMargin = Number(hpp) > 0 ? Number(((profitNominal / Number(hpp)) * 100).toFixed(2)) : Number(margin_percentage);

  const newProduct: Product = {
    id: newId,
    code: finalCode,
    name,
    category_id: Number(category_id),
    image: image || 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=80',
    description: description || '',
    selling_price: Number(selling_price),
    hpp: Number(hpp),
    margin_percentage: calculatedMargin,
    stock: Number(stock) || 0,
    minimum_stock: Number(minimum_stock) || 0,
    status,
    created_at: now,
    updated_at: now
  };

  data.products.push(newProduct);

  if (Number(stock) > 0) {
    const movementId = data.stock_movements.length > 0 ? Math.max(...data.stock_movements.map(m => m.id)) + 1 : 1;
    data.stock_movements.push({
      id: movementId,
      item_type: 'product',
      item_id: newId,
      item_name: name,
      movement_type: 'in',
      quantity: Number(stock),
      previous_stock: 0,
      current_stock: Number(stock),
      reference_type: 'manual',
      reference_id: finalCode,
      notes: 'Pencatatan stok awal produk jadi baru',
      created_at: now
    });
  }

  db.save();
  db.logAudit(userId || 1, userName || 'Admin', 'Tambah Produk', `Menambahkan produk: ${name} (${finalCode}) harga jual Rp ${Number(selling_price).toLocaleString('id-ID')}`);

  return res.json({ success: true, data: newProduct, message: `Produk ${name} berhasil ditambahkan!` });
});

apiRouter.put('/products/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const data = db.getData();
  const index = data.products.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
  }

  const existing = data.products[index];
  const {
    name,
    category_id,
    image,
    description,
    selling_price,
    hpp,
    margin_percentage,
    stock,
    minimum_stock,
    status,
    userId,
    userName
  } = req.body;

  const newSellingPrice = selling_price !== undefined ? Number(selling_price) : existing.selling_price;
  const newHpp = hpp !== undefined ? Number(hpp) : existing.hpp;
  const profitNominal = newSellingPrice - newHpp;
  const calculatedMargin = newHpp > 0 ? Number(((profitNominal / newHpp) * 100).toFixed(2)) : (margin_percentage !== undefined ? Number(margin_percentage) : existing.margin_percentage);

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  // Manual stock adjustment
  if (stock !== undefined && Number(stock) !== existing.stock) {
    const diff = Number(stock) - existing.stock;
    const movementId = data.stock_movements.length > 0 ? Math.max(...data.stock_movements.map(m => m.id)) + 1 : 1;
    data.stock_movements.push({
      id: movementId,
      item_type: 'product',
      item_id: id,
      item_name: name || existing.name,
      movement_type: diff > 0 ? 'in' : 'out',
      quantity: diff,
      previous_stock: existing.stock,
      current_stock: Number(stock),
      reference_type: 'manual',
      notes: 'Penyesuaian stok manual dari form edit produk',
      created_at: now
    });
  }

  data.products[index] = {
    ...existing,
    name: name || existing.name,
    category_id: category_id !== undefined ? Number(category_id) : existing.category_id,
    image: image !== undefined ? image : existing.image,
    description: description !== undefined ? description : existing.description,
    selling_price: newSellingPrice,
    hpp: newHpp,
    margin_percentage: calculatedMargin,
    stock: stock !== undefined ? Number(stock) : existing.stock,
    minimum_stock: minimum_stock !== undefined ? Number(minimum_stock) : existing.minimum_stock,
    status: status || existing.status,
    updated_at: now
  };

  db.save();
  db.logAudit(userId || 1, userName || 'Admin', 'Ubah Produk', `Mengubah produk: ${data.products[index].name} (${data.products[index].code})`);

  return res.json({ success: true, data: data.products[index], message: 'Produk berhasil diperbarui!' });
});

apiRouter.delete('/products/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const data = db.getData();
  const index = data.products.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
  }

  const productName = data.products[index].name;
  // Remove related recipe if exists
  const recipeIndex = data.recipes.findIndex(r => r.product_id === id);
  if (recipeIndex !== -1) {
    data.recipes.splice(recipeIndex, 1);
  }

  data.products.splice(index, 1);
  db.save();
  db.logAudit(1, 'Admin', 'Hapus Produk', `Menghapus produk: ${productName}`);

  return res.json({ success: true, message: `Produk ${productName} berhasil dihapus!` });
});

// ==========================================
// 6. RESEP PRODUK & HPP OTOMATIS
// ==========================================
apiRouter.get('/recipes', (req: Request, res: Response) => {
  const data = db.getData();
  const enriched = data.recipes.map(recipe => {
    const product = data.products.find(p => p.id === recipe.product_id);
    // Recalculate ingredient costs on the fly based on latest ingredient prices
    let totalIngredientCost = 0;
    const enrichedItems = recipe.items.map(item => {
      const ing = data.ingredients.find(i => i.id === item.ingredient_id);
      const unit = data.units.find(u => u.id === item.unit_id);
      let itemCost = item.calculated_cost;
      if (ing) {
        itemCost = calculateRecipeItemCost(ing, item.quantity, item.unit_id);
      }
      totalIngredientCost += itemCost;
      return {
        ...item,
        ingredient_name: ing ? ing.name : 'Bahan Tidak Ditemukan',
        ingredient_code: ing ? ing.code : '-',
        ingredient_price_per_unit: ing ? ing.price_per_unit : 0,
        unit_name: unit ? unit.name : '-',
        unit_symbol: unit ? unit.symbol : '-',
        calculated_cost: itemCost
      };
    });

    const totalBatchCost = totalIngredientCost +
      Number(recipe.packaging_cost || 0) +
      Number(recipe.labor_cost || 0) +
      Number(recipe.utility_cost || 0) +
      Number(recipe.other_cost || 0);

    const yieldQty = recipe.production_quantity > 0 ? recipe.production_quantity : 1;
    const hppPerUnit = Number((totalBatchCost / yieldQty).toFixed(2));

    return {
      ...recipe,
      product_name: product ? product.name : 'Produk Tidak Ditemukan',
      product_code: product ? product.code : '-',
      product_selling_price: product ? product.selling_price : 0,
      total_ingredient_cost: totalIngredientCost,
      total_batch_cost: totalBatchCost,
      hpp_per_unit: hppPerUnit,
      items: enrichedItems
    };
  });
  res.json({ success: true, data: enriched });
});

apiRouter.get('/recipes/product/:productId', (req: Request, res: Response) => {
  const productId = Number(req.params.productId);
  const data = db.getData();
  const recipe = data.recipes.find(r => r.product_id === productId);

  if (!recipe) {
    return res.json({ success: true, data: null });
  }

  const product = data.products.find(p => p.id === productId);
  let totalIngredientCost = 0;
  const enrichedItems = recipe.items.map(item => {
    const ing = data.ingredients.find(i => i.id === item.ingredient_id);
    const unit = data.units.find(u => u.id === item.unit_id);
    let itemCost = item.calculated_cost;
    if (ing) {
      itemCost = calculateRecipeItemCost(ing, item.quantity, item.unit_id);
    }
    totalIngredientCost += itemCost;
    return {
      ...item,
      ingredient_name: ing ? ing.name : '-',
      unit_symbol: unit ? unit.symbol : '-',
      calculated_cost: itemCost
    };
  });

  const totalBatchCost = totalIngredientCost +
    Number(recipe.packaging_cost || 0) +
    Number(recipe.labor_cost || 0) +
    Number(recipe.utility_cost || 0) +
    Number(recipe.other_cost || 0);

  const yieldQty = recipe.production_quantity > 0 ? recipe.production_quantity : 1;
  const hppPerUnit = Number((totalBatchCost / yieldQty).toFixed(2));

  return res.json({
    success: true,
    data: {
      ...recipe,
      product_name: product ? product.name : '-',
      total_ingredient_cost: totalIngredientCost,
      total_batch_cost: totalBatchCost,
      hpp_per_unit: hppPerUnit,
      items: enrichedItems
    }
  });
});

apiRouter.post('/recipes', (req: Request, res: Response) => {
  const {
    product_id,
    production_quantity = 1,
    packaging_cost = 0,
    labor_cost = 0,
    utility_cost = 0,
    other_cost = 0,
    notes = '',
    items = [],
    userId,
    userName
  } = req.body;

  if (!product_id || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Pilih produk dan masukkan minimal 1 bahan baku untuk resep.' });
  }

  const data = db.getData();
  const product = data.products.find(p => p.id === Number(product_id));
  if (!product) {
    return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
  }

  // Calculate items cost
  let totalIngredientCost = 0;
  let nextItemId = 1;
  data.recipes.forEach(r => r.items.forEach(it => { if (it.id >= nextItemId) nextItemId = it.id + 1; }));

  const recipeItems: RecipeItem[] = items.map((item: any) => {
    const ing = data.ingredients.find(i => i.id === Number(item.ingredient_id));
    const cost = ing ? calculateRecipeItemCost(ing, Number(item.quantity), Number(item.unit_id)) : 0;
    totalIngredientCost += cost;
    return {
      id: nextItemId++,
      recipe_id: 0,
      ingredient_id: Number(item.ingredient_id),
      quantity: Number(item.quantity),
      unit_id: Number(item.unit_id),
      calculated_cost: cost
    };
  });

  const totalBatchCost = totalIngredientCost +
    Number(packaging_cost) +
    Number(labor_cost) +
    Number(utility_cost) +
    Number(other_cost);

  const yieldQty = Number(production_quantity) > 0 ? Number(production_quantity) : 1;
  const calculatedHpp = Number((totalBatchCost / yieldQty).toFixed(2));

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  // Check if recipe already exists for this product -> update or insert
  const existingRecipeIndex = data.recipes.findIndex(r => r.product_id === Number(product_id));
  let savedRecipe: Recipe;

  if (existingRecipeIndex !== -1) {
    savedRecipe = {
      ...data.recipes[existingRecipeIndex],
      production_quantity: yieldQty,
      packaging_cost: Number(packaging_cost),
      labor_cost: Number(labor_cost),
      utility_cost: Number(utility_cost),
      other_cost: Number(other_cost),
      notes,
      items: recipeItems.map(it => ({ ...it, recipe_id: data.recipes[existingRecipeIndex].id })),
      updated_at: now
    };
    data.recipes[existingRecipeIndex] = savedRecipe;
  } else {
    const newRecipeId = data.recipes.length > 0 ? Math.max(...data.recipes.map(r => r.id)) + 1 : 1;
    savedRecipe = {
      id: newRecipeId,
      product_id: Number(product_id),
      production_quantity: yieldQty,
      packaging_cost: Number(packaging_cost),
      labor_cost: Number(labor_cost),
      utility_cost: Number(utility_cost),
      other_cost: Number(other_cost),
      notes,
      items: recipeItems.map(it => ({ ...it, recipe_id: newRecipeId })),
      updated_at: now
    };
    data.recipes.push(savedRecipe);
  }

  // Update product HPP automatically if configured
  if (data.settings.auto_update_product_hpp) {
    product.hpp = calculatedHpp;
    const profitNominal = product.selling_price - calculatedHpp;
    product.margin_percentage = calculatedHpp > 0 ? Number(((profitNominal / calculatedHpp) * 100).toFixed(2)) : 0;
    product.updated_at = now;
  }

  db.save();
  db.logAudit(userId || 1, userName || 'Admin', 'Simpan Resep & HPP', `Menyimpan resep produk ${product.name}, HPP terhitung: Rp ${calculatedHpp.toLocaleString('id-ID')}/unit`);

  return res.json({
    success: true,
    data: savedRecipe,
    hpp_per_unit: calculatedHpp,
    message: `Resep & Kalkulasi HPP ${product.name} berhasil disimpan! (HPP: Rp ${calculatedHpp.toLocaleString('id-ID')}/unit)`
  });
});

// ==========================================
// 7. PRODUKSI (RECORD PRODUCTION & DEDUCT STOCKS)
// ==========================================
apiRouter.get('/productions', (req: Request, res: Response) => {
  const data = db.getData();
  res.json({ success: true, data: data.productions });
});

apiRouter.post('/productions', (req: Request, res: Response) => {
  const {
    product_id,
    quantity,
    production_date,
    notes = '',
    custom_packaging_cost,
    custom_labor_cost,
    custom_utility_cost,
    custom_other_cost,
    userId = 1,
    userName = 'Admin'
  } = req.body;

  const targetQty = Number(quantity);
  if (!product_id || targetQty <= 0) {
    return res.status(400).json({ success: false, message: 'Pilih produk dan masukkan jumlah produksi yang valid (> 0).' });
  }

  const data = db.getData();
  const product = data.products.find(p => p.id === Number(product_id));
  if (!product) {
    return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
  }

  const recipe = data.recipes.find(r => r.product_id === Number(product_id));
  if (!recipe || recipe.items.length === 0) {
    return res.status(400).json({
      success: false,
      message: `Produk "${product.name}" belum memiliki resep. Silakan buat resep terlebih dahulu di menu Resep Produk.`
    });
  }

  // 1. Calculate required ingredients based on batch ratio
  const batchYield = recipe.production_quantity > 0 ? recipe.production_quantity : 1;
  const multiplier = targetQty / batchYield;

  const insufficientIngredients: { name: string; required: number; available: number; unit: string; shortage: number }[] = [];
  const requiredMaterials: { ingredient: Ingredient; quantityUsedBase: number; unitSymbol: string; cost: number }[] = [];

  recipe.items.forEach(item => {
    const ing = data.ingredients.find(i => i.id === item.ingredient_id);
    const unit = data.units.find(u => u.id === item.unit_id);
    const conversion = unit ? unit.conversion_value : 1;
    const requiredQtyDisplay = item.quantity * multiplier;
    const requiredQtyBase = requiredQtyDisplay * conversion;
    const unitSymbol = unit ? unit.symbol : 'g';

    if (ing) {
      if (!data.settings.enable_negative_stock && ing.stock < requiredQtyBase) {
        insufficientIngredients.push({
          name: ing.name,
          required: requiredQtyBase,
          available: ing.stock,
          unit: unitSymbol,
          shortage: requiredQtyBase - ing.stock
        });
      }

      const cost = Number((requiredQtyBase * ing.price_per_unit).toFixed(2));
      requiredMaterials.push({
        ingredient: ing,
        quantityUsedBase: requiredQtyBase,
        unitSymbol,
        cost
      });
    }
  });

  // If any ingredient stock is insufficient, BLOCK production and return clear details
  if (insufficientIngredients.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Stok bahan baku tidak mencukupi untuk melakukan produksi.',
      insufficientIngredients
    });
  }

  // 2. Compute total costs
  const totalIngredientCost = requiredMaterials.reduce((sum, m) => sum + m.cost, 0);
  const packagingCost = custom_packaging_cost !== undefined ? Number(custom_packaging_cost) : (recipe.packaging_cost * multiplier);
  const laborCost = custom_labor_cost !== undefined ? Number(custom_labor_cost) : (recipe.labor_cost * multiplier);
  const utilityCost = custom_utility_cost !== undefined ? Number(custom_utility_cost) : (recipe.utility_cost * multiplier);
  const otherCost = custom_other_cost !== undefined ? Number(custom_other_cost) : (recipe.other_cost * multiplier);

  const totalCost = totalIngredientCost + packagingCost + laborCost + utilityCost + otherCost;
  const hppPerUnit = Number((totalCost / targetQty).toFixed(2));

  const prodNumber = db.generateCode('PRD');
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const prodDate = production_date ? (production_date.includes(' ') ? production_date : `${production_date} 10:00:00`) : now;

  const newProdId = data.productions.length > 0 ? Math.max(...data.productions.map(p => p.id)) + 1 : 1;
  let nextProdItemId = 1;
  data.productions.forEach(p => p.items.forEach(it => { if (it.id >= nextProdItemId) nextProdItemId = it.id + 1; }));

  // 3. Perform atomic stock deductions & stock movements
  const productionItems: any[] = [];

  requiredMaterials.forEach(mat => {
    const prevStock = mat.ingredient.stock;
    mat.ingredient.stock -= mat.quantityUsedBase;
    mat.ingredient.updated_at = now;

    // Record ingredient stock movement
    const movementId = data.stock_movements.length > 0 ? Math.max(...data.stock_movements.map(m => m.id)) + 1 : 1;
    data.stock_movements.push({
      id: movementId,
      item_type: 'ingredient',
      item_id: mat.ingredient.id,
      item_name: mat.ingredient.name,
      movement_type: 'production',
      quantity: -mat.quantityUsedBase,
      previous_stock: prevStock,
      current_stock: mat.ingredient.stock,
      reference_type: 'production',
      reference_id: prodNumber,
      notes: `Digunakan untuk produksi ${targetQty} pcs ${product.name}`,
      created_at: now
    });

    productionItems.push({
      id: nextProdItemId++,
      production_id: newProdId,
      ingredient_id: mat.ingredient.id,
      ingredient_name: mat.ingredient.name,
      quantity_used: mat.quantityUsedBase,
      unit_symbol: mat.unitSymbol,
      cost: mat.cost
    });
  });

  // 4. Increase finished product stock
  const prevProdStock = product.stock;
  product.stock += targetQty;
  product.hpp = hppPerUnit; // update product latest production HPP
  product.updated_at = now;

  const prodMovementId = data.stock_movements.length > 0 ? Math.max(...data.stock_movements.map(m => m.id)) + 1 : 1;
  data.stock_movements.push({
    id: prodMovementId,
    item_type: 'product',
    item_id: product.id,
    item_name: product.name,
    movement_type: 'production',
    quantity: targetQty,
    previous_stock: prevProdStock,
    current_stock: product.stock,
    reference_type: 'production',
    reference_id: prodNumber,
    notes: `Hasil produksi batch ${prodNumber}`,
    created_at: now
  });

  // 5. Create production record
  const newProduction: Production = {
    id: newProdId,
    production_number: prodNumber,
    product_id: product.id,
    product_name: product.name,
    quantity: targetQty,
    ingredient_cost: totalIngredientCost,
    packaging_cost: packagingCost,
    labor_cost: laborCost,
    utility_cost: utilityCost,
    other_cost: otherCost,
    total_cost: totalCost,
    hpp_per_unit: hppPerUnit,
    production_date: prodDate,
    notes,
    created_by: Number(userId),
    created_by_name: userName,
    items: productionItems,
    created_at: now
  };

  data.productions.unshift(newProduction);

  db.save();
  db.logAudit(Number(userId), userName, 'Input Produksi', `Produksi ${targetQty} pcs ${product.name} (${prodNumber}). HPP: Rp ${hppPerUnit.toLocaleString('id-ID')}/pcs`);

  return res.json({
    success: true,
    data: newProduction,
    message: `Produksi ${targetQty} pcs ${product.name} berhasil dicatat! Stok produk bertambah & stok bahan telah dikurangi secara otomatis.`
  });
});

// ==========================================
// 8. STOK & PENYESUAIAN (INVENTORY MANAGEMENT)
// ==========================================
apiRouter.get('/stocks/movements', (req: Request, res: Response) => {
  const { item_type, item_id, limit = 100 } = req.query;
  const data = db.getData();
  let movements = data.stock_movements;

  if (item_type) {
    movements = movements.filter(m => m.item_type === item_type);
  }
  if (item_id) {
    movements = movements.filter(m => m.item_id === Number(item_id));
  }

  // Sort descending by id/created_at
  const sorted = [...movements].reverse().slice(0, Number(limit));
  res.json({ success: true, data: sorted });
});

apiRouter.post('/stocks/adjust', (req: Request, res: Response) => {
  const {
    item_type, // 'ingredient' | 'product'
    item_id,
    adjustment_type, // 'in' | 'out' | 'set'
    quantity,
    notes = '',
    userId = 1,
    userName = 'Admin'
  } = req.body;

  if (!item_type || !item_id || quantity === undefined) {
    return res.status(400).json({ success: false, message: 'Data penyesuaian stok tidak lengkap.' });
  }

  const data = db.getData();
  const numQty = Number(quantity);
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  let itemName = '';
  let prevStock = 0;
  let currentStock = 0;
  let delta = 0;

  if (item_type === 'ingredient') {
    const ing = data.ingredients.find(i => i.id === Number(item_id));
    if (!ing) return res.status(404).json({ success: false, message: 'Bahan baku tidak ditemukan.' });
    itemName = ing.name;
    prevStock = ing.stock;

    if (adjustment_type === 'in') {
      delta = Math.abs(numQty);
      currentStock = prevStock + delta;
    } else if (adjustment_type === 'out') {
      delta = -Math.abs(numQty);
      currentStock = Math.max(0, prevStock + delta);
    } else {
      currentStock = Math.max(0, numQty);
      delta = currentStock - prevStock;
    }
    ing.stock = currentStock;
    ing.updated_at = now;
  } else {
    const prod = data.products.find(p => p.id === Number(item_id));
    if (!prod) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    itemName = prod.name;
    prevStock = prod.stock;

    if (adjustment_type === 'in') {
      delta = Math.abs(numQty);
      currentStock = prevStock + delta;
    } else if (adjustment_type === 'out') {
      delta = -Math.abs(numQty);
      currentStock = Math.max(0, prevStock + delta);
    } else {
      currentStock = Math.max(0, numQty);
      delta = currentStock - prevStock;
    }
    prod.stock = currentStock;
    prod.updated_at = now;
  }

  const movementId = data.stock_movements.length > 0 ? Math.max(...data.stock_movements.map(m => m.id)) + 1 : 1;
  data.stock_movements.push({
    id: movementId,
    item_type,
    item_id: Number(item_id),
    item_name: itemName,
    movement_type: 'adjustment',
    quantity: delta,
    previous_stock: prevStock,
    current_stock: currentStock,
    reference_type: 'manual',
    notes: notes || `Penyesuaian stok manual (${adjustment_type})`,
    created_at: now
  });

  db.save();
  db.logAudit(Number(userId), userName, 'Penyesuaian Stok', `Penyesuaian stok ${itemName} (${item_type}): ${prevStock} -> ${currentStock} (Δ ${delta > 0 ? '+' : ''}${delta})`);

  return res.json({
    success: true,
    previous_stock: prevStock,
    current_stock: currentStock,
    message: `Stok ${itemName} berhasil disesuaikan menjadi ${currentStock}.`
  });
});

// ==========================================
// 9. PENJUALAN (POS / SALES & PROFIT ENGINE)
// ==========================================
apiRouter.get('/sales', (req: Request, res: Response) => {
  const data = db.getData();
  res.json({ success: true, data: data.sales });
});

apiRouter.post('/sales', (req: Request, res: Response) => {
  const {
    customer_name = 'Pelanggan Umum',
    discount = 0,
    payment_method = 'Cash',
    notes = '',
    sale_date,
    items = [],
    userId = 1,
    userName = 'Kasir'
  } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Daftar item penjualan tidak boleh kosong.' });
  }

  const data = db.getData();
  const invoiceNumber = db.generateCode('INV');
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const finalSaleDate = sale_date ? (sale_date.includes(' ') ? sale_date : `${sale_date} 12:00:00`) : now;

  let subtotal = 0;
  let totalHpp = 0;
  let totalProfit = 0;

  const saleItems: any[] = [];
  let nextSaleItemId = 1;
  data.sales.forEach(s => s.items.forEach(it => { if (it.id >= nextSaleItemId) nextSaleItemId = it.id + 1; }));

  // Check product availability
  for (const item of items) {
    const product = data.products.find(p => p.id === Number(item.product_id));
    if (!product) {
      return res.status(404).json({ success: false, message: `Produk dengan ID ${item.product_id} tidak ditemukan.` });
    }

    const qty = Number(item.quantity);
    if (qty <= 0) continue;

    if (!data.settings.enable_negative_stock && product.stock < qty) {
      return res.status(400).json({
        success: false,
        message: `Stok produk "${product.name}" tidak mencukupi (Tersedia: ${product.stock}, Diminta: ${qty}).`
      });
    }

    const price = Number(item.selling_price !== undefined ? item.selling_price : product.selling_price);
    const hpp = Number(product.hpp);
    const itemSubtotal = price * qty;
    const itemHpp = hpp * qty;
    const itemProfit = itemSubtotal - itemHpp;

    subtotal += itemSubtotal;
    totalHpp += itemHpp;
    totalProfit += itemProfit;

    // Deduct finished product stock
    const prevStock = product.stock;
    product.stock -= qty;
    product.updated_at = now;

    // Record product stock movement
    const movementId = data.stock_movements.length > 0 ? Math.max(...data.stock_movements.map(m => m.id)) + 1 : 1;
    data.stock_movements.push({
      id: movementId,
      item_type: 'product',
      item_id: product.id,
      item_name: product.name,
      movement_type: 'sale',
      quantity: -qty,
      previous_stock: prevStock,
      current_stock: product.stock,
      reference_type: 'sale',
      reference_id: invoiceNumber,
      notes: `Penjualan ${qty} pcs (${invoiceNumber})`,
      created_at: now
    });

    saleItems.push({
      id: nextSaleItemId++,
      sale_id: 0,
      product_id: product.id,
      product_name: product.name,
      quantity: qty,
      selling_price: price,
      hpp,
      subtotal: itemSubtotal,
      profit: itemProfit
    });
  }

  const discountAmount = Math.max(0, Number(discount));
  const finalTotal = Math.max(0, subtotal - discountAmount);
  // Net profit after transaction discount
  const finalProfit = totalProfit - discountAmount;

  const newSaleId = data.sales.length > 0 ? Math.max(...data.sales.map(s => s.id)) + 1 : 1;
  const newSale: Sale = {
    id: newSaleId,
    invoice_number: invoiceNumber,
    sale_date: finalSaleDate,
    customer_name,
    subtotal,
    discount: discountAmount,
    total: finalTotal,
    total_hpp: totalHpp,
    total_profit: finalProfit,
    payment_method: payment_method || 'Cash',
    notes,
    created_by: Number(userId),
    created_by_name: userName,
    items: saleItems.map(it => ({ ...it, sale_id: newSaleId })),
    created_at: now
  };

  data.sales.unshift(newSale);

  db.save();
  db.logAudit(Number(userId), userName, 'Transaksi Penjualan', `Penjualan ${invoiceNumber} total Rp ${finalTotal.toLocaleString('id-ID')} (${payment_method}) ke ${customer_name}`);

  return res.json({
    success: true,
    data: newSale,
    message: `Transaksi penjualan ${invoiceNumber} berhasil disimpan! Total: Rp ${finalTotal.toLocaleString('id-ID')}`
  });
});

// ==========================================
// 10. PENGELUARAN (EXPENSES)
// ==========================================
apiRouter.get('/expenses', (req: Request, res: Response) => {
  const data = db.getData();
  res.json({ success: true, data: data.expenses });
});

apiRouter.post('/expenses', (req: Request, res: Response) => {
  const {
    date,
    category,
    description,
    amount,
    payment_method = 'Cash',
    receipt,
    notes = '',
    userId = 1,
    userName = 'Admin'
  } = req.body;

  if (!category || !description || amount === undefined || Number(amount) <= 0) {
    return res.status(400).json({ success: false, message: 'Kategori, deskripsi, dan nominal pengeluaran wajib diisi (> 0).' });
  }

  const data = db.getData();
  const expenseNumber = db.generateCode('EXP');
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const newId = data.expenses.length > 0 ? Math.max(...data.expenses.map(e => e.id)) + 1 : 1;

  const newExpense: Expense = {
    id: newId,
    expense_number: expenseNumber,
    date: date || new Date().toISOString().split('T')[0],
    category,
    description,
    amount: Number(amount),
    payment_method,
    receipt: receipt || undefined,
    notes,
    created_by: Number(userId),
    created_by_name: userName,
    created_at: now
  };

  data.expenses.unshift(newExpense);

  db.save();
  db.logAudit(Number(userId), userName, 'Catat Pengeluaran', `Pengeluaran ${expenseNumber} [${category}]: ${description} sebesar Rp ${Number(amount).toLocaleString('id-ID')}`);

  return res.json({ success: true, data: newExpense, message: 'Biaya pengeluaran berhasil dicatat!' });
});

apiRouter.delete('/expenses/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const data = db.getData();
  const index = data.expenses.findIndex(e => e.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Data pengeluaran tidak ditemukan.' });
  }

  const exp = data.expenses[index];
  data.expenses.splice(index, 1);
  db.save();
  db.logAudit(1, 'Admin', 'Hapus Pengeluaran', `Menghapus pengeluaran: ${exp.expense_number} (${exp.category} Rp ${exp.amount})`);

  return res.json({ success: true, message: 'Data pengeluaran berhasil dihapus!' });
});

// ==========================================
// 11. LAPORAN & ANALISIS (REPORTS ENGINE)
// ==========================================
apiRouter.get('/reports/profit-loss', (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  const data = db.getData();

  const now = new Date();
  const start = startDate ? new Date(String(startDate) + 'T00:00:00') : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = endDate ? new Date(String(endDate) + 'T23:59:59') : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const filteredSales = data.sales.filter(s => {
    const d = new Date(s.sale_date);
    return d >= start && d <= end;
  });

  const filteredExpenses = data.expenses.filter(e => {
    const d = new Date(e.date + 'T12:00:00');
    return d >= start && d <= end;
  });

  const totalPenjualan = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const totalHppPenjualan = filteredSales.reduce((sum, s) => sum + s.total_hpp, 0);
  const labaKotor = totalPenjualan - totalHppPenjualan;

  // Breakdown expenses by category
  const expenseByCategory: Record<string, number> = {};
  let totalPengeluaran = 0;
  filteredExpenses.forEach(exp => {
    expenseByCategory[exp.category] = (expenseByCategory[exp.category] || 0) + exp.amount;
    totalPengeluaran += exp.amount;
  });

  const labaBersih = labaKotor - totalPengeluaran;

  res.json({
    success: true,
    data: {
      period: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      },
      pendapatan: {
        totalPenjualan,
        totalTransaksi: filteredSales.length
      },
      hargaPokok: {
        totalHppPenjualan
      },
      labaKotor,
      pengeluaran: {
        totalPengeluaran,
        byCategory: expenseByCategory,
        items: filteredExpenses
      },
      labaBersih,
      status: labaBersih >= 0 ? 'LABA' : 'RUGI'
    }
  });
});

apiRouter.get('/reports/product-analysis', (req: Request, res: Response) => {
  const data = db.getData();
  const productStats: Record<number, any> = {};

  // Initialize for all products
  data.products.forEach(p => {
    productStats[p.id] = {
      id: p.id,
      code: p.code,
      name: p.name,
      selling_price: p.selling_price,
      hpp: p.hpp,
      stock: p.stock,
      margin_percentage: p.margin_percentage,
      units_sold: 0,
      total_omzet: 0,
      total_hpp: 0,
      total_profit: 0
    };
  });

  data.sales.forEach(sale => {
    sale.items.forEach(item => {
      if (productStats[item.product_id]) {
        productStats[item.product_id].units_sold += item.quantity;
        productStats[item.product_id].total_omzet += item.subtotal;
        productStats[item.product_id].total_hpp += (item.hpp * item.quantity);
        productStats[item.product_id].total_profit += item.profit;
      }
    });
  });

  const list = Object.values(productStats);
  const bestSellers = [...list].sort((a, b) => b.units_sold - a.units_sold);
  const mostProfitable = [...list].sort((a, b) => b.total_profit - a.total_profit);
  const highestMargin = [...list].sort((a, b) => b.margin_percentage - a.margin_percentage);

  res.json({
    success: true,
    allProducts: list,
    bestSellers,
    mostProfitable,
    highestMargin
  });
});

// Forecast / Estimasi Kebutuhan Bahan Baku
apiRouter.post('/forecast/materials', (req: Request, res: Response) => {
  const { targets = [] } = req.body; // array of { product_id, quantity }
  const data = db.getData();

  const requiredMaterialsMap: Record<number, {
    ingredient_id: number;
    code: string;
    name: string;
    unit_name: string;
    unit_symbol: string;
    total_required_base: number;
    current_stock_base: number;
    shortage_base: number;
    price_per_unit: number;
    estimated_purchase_cost: number;
  }> = {};

  targets.forEach((target: any) => {
    const prodId = Number(target.product_id);
    const targetQty = Number(target.quantity);
    if (!prodId || targetQty <= 0) return;

    const recipe = data.recipes.find(r => r.product_id === prodId);
    if (!recipe) return;

    const batchYield = recipe.production_quantity > 0 ? recipe.production_quantity : 1;
    const multiplier = targetQty / batchYield;

    recipe.items.forEach(item => {
      const ing = data.ingredients.find(i => i.id === item.ingredient_id);
      const unit = data.units.find(u => u.id === item.unit_id);
      const conversion = unit ? unit.conversion_value : 1;
      const requiredQtyBase = item.quantity * multiplier * conversion;

      if (ing) {
        if (!requiredMaterialsMap[ing.id]) {
          requiredMaterialsMap[ing.id] = {
            ingredient_id: ing.id,
            code: ing.code,
            name: ing.name,
            unit_name: unit ? unit.name : 'Gram',
            unit_symbol: unit ? unit.symbol : 'g',
            total_required_base: 0,
            current_stock_base: ing.stock,
            shortage_base: 0,
            price_per_unit: ing.price_per_unit,
            estimated_purchase_cost: 0
          };
        }
        requiredMaterialsMap[ing.id].total_required_base += requiredQtyBase;
      }
    });
  });

  let totalEstimatedPurchaseCost = 0;
  const resultList = Object.values(requiredMaterialsMap).map(mat => {
    const shortage = Math.max(0, mat.total_required_base - mat.current_stock_base);
    const cost = shortage * mat.price_per_unit;
    totalEstimatedPurchaseCost += cost;
    return {
      ...mat,
      shortage_base: shortage,
      estimated_purchase_cost: cost
    };
  });

  res.json({
    success: true,
    materials: resultList,
    totalEstimatedPurchaseCost
  });
});

// ==========================================
// 12. USERS, AUDIT LOGS & SETTINGS
// ==========================================
apiRouter.get('/users', (req: Request, res: Response) => {
  const data = db.getData();
  const safeUsers = data.users.map(u => ({
    id: u.id,
    name: u.name,
    username: u.username,
    email: u.email,
    role: u.role,
    status: u.status,
    created_at: u.created_at
  }));
  res.json({ success: true, data: safeUsers });
});

apiRouter.post('/users', (req: Request, res: Response) => {
  const { name, username, email, password, role = 'admin', status = 'active' } = req.body;
  if (!name || !username || !email || !password) {
    return res.status(400).json({ success: false, message: 'Semua field wajib diisi.' });
  }

  const data = db.getData();
  const exists = data.users.some(u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ success: false, message: 'Username atau email sudah terdaftar.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);
  const newId = data.users.length > 0 ? Math.max(...data.users.map(u => u.id)) + 1 : 1;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  const newUser: User = {
    id: newId,
    name,
    username,
    email,
    password: hashedPassword,
    role,
    status,
    must_change_password: true,
    created_at: now,
    updated_at: now
  };

  data.users.push(newUser);
  db.save();
  db.logAudit(1, 'Super Admin', 'Tambah User', `Menambahkan user baru: ${name} (${username}) role: ${role}`);

  return res.json({ success: true, message: `User ${name} berhasil ditambahkan!` });
});

apiRouter.get('/audit-logs', (req: Request, res: Response) => {
  const data = db.getData();
  res.json({ success: true, data: data.audit_logs });
});

apiRouter.get('/settings', (req: Request, res: Response) => {
  res.json({ success: true, data: db.getData().settings });
});

apiRouter.put('/settings', (req: Request, res: Response) => {
  const data = db.getData();
  data.settings = {
    ...data.settings,
    ...req.body
  };
  db.save();
  db.logAudit(1, 'Admin', 'Ubah Pengaturan Toko', 'Memperbarui profil usaha dan konfigurasi sistem');
  res.json({ success: true, data: data.settings, message: 'Pengaturan toko berhasil disimpan!' });
});

// Image Upload Endpoint (Base64 storage with MIME validation)
apiRouter.post('/upload', (req: Request, res: Response) => {
  const { imageBase64, filename } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ success: false, message: 'Gambar tidak ditemukan.' });
  }

  // Validate format
  if (!imageBase64.startsWith('data:image/')) {
    return res.status(400).json({ success: false, message: 'Format file tidak didukung. Harap upload gambar JPG, PNG, atau WEBP.' });
  }

  // Return base64 URL directly for instant client-side rendering & persistence
  return res.json({
    success: true,
    url: imageBase64,
    message: 'Gambar berhasil diupload!'
  });
});

// Dashboard summary endpoint for top-level app overview
apiRouter.get('/dashboard/summary', (req: Request, res: Response) => {
  const data = db.getData();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const salesToday = data.sales.filter(s => {
    const d = new Date(s.sale_date);
    return d >= todayStart && d <= todayEnd;
  });
  const expensesToday = data.expenses.filter(e => {
    const d = new Date(e.date + 'T12:00:00');
    return d >= todayStart && d <= todayEnd;
  });

  const today_revenue = salesToday.reduce((sum, s) => sum + s.total, 0);
  const today_hpp = salesToday.reduce((sum, s) => sum + s.total_hpp, 0);
  const today_gross_profit = today_revenue - today_hpp;
  const today_expenses = expensesToday.reduce((sum, e) => sum + e.amount, 0);
  const today_net_profit = today_gross_profit - today_expenses;

  const salesMonth = data.sales.filter(s => {
    const d = new Date(s.sale_date);
    return d >= monthStart && d <= monthEnd;
  });
  const expensesMonth = data.expenses.filter(e => {
    const d = new Date(e.date + 'T12:00:00');
    return d >= monthStart && d <= monthEnd;
  });

  const month_revenue = salesMonth.reduce((sum, s) => sum + s.total, 0);
  const month_hpp = salesMonth.reduce((sum, s) => sum + s.total_hpp, 0);
  const month_gross_profit = month_revenue - month_hpp;
  const month_expenses = expensesMonth.reduce((sum, e) => sum + e.amount, 0);
  const month_net_profit = month_gross_profit - month_expenses;

  const total_ingredient_stock_value = data.ingredients.reduce((sum, ing) => sum + (ing.stock * ing.price_per_unit), 0);
  const total_product_stock_value = data.products.reduce((sum, p) => sum + (p.stock * p.hpp), 0);

  const low_stock_ingredients = data.ingredients.filter(i => i.status === 'active' && i.stock <= i.minimum_stock);
  const low_stock_products = data.products.filter(p => p.status === 'active' && p.stock <= p.minimum_stock);

  // 7 days chart
  const sales_chart = [];
  for (let i = 6; i >= 0; i--) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - i);
    const dateStr = targetDate.toISOString().split('T')[0];
    const sStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
    const sEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

    const sDay = data.sales.filter(s => {
      const d = new Date(s.sale_date);
      return d >= sStart && d <= sEnd;
    });

    const rev = sDay.reduce((sum, s) => sum + s.total, 0);
    const hpp = sDay.reduce((sum, s) => sum + s.total_hpp, 0);
    sales_chart.push({
      date: dateStr,
      revenue: rev,
      profit: rev - hpp
    });
  }

  res.json({
    success: true,
    data: {
      today_revenue,
      today_gross_profit,
      today_expenses,
      today_net_profit,
      today_sales_count: salesToday.length,
      month_revenue,
      month_gross_profit,
      month_expenses,
      month_net_profit,
      total_ingredient_stock_value,
      total_product_stock_value,
      low_stock_ingredients,
      low_stock_products,
      recent_sales: data.sales.slice(-5).reverse(),
      recent_productions: data.productions.slice(-5).reverse(),
      sales_chart
    }
  });
});

// Financial Report Endpoint
apiRouter.get('/reports/financial', (req: Request, res: Response) => {
  const { start_date, end_date } = req.query;
  const data = db.getData();

  const now = new Date();
  const start = start_date ? new Date(String(start_date) + 'T00:00:00') : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = end_date ? new Date(String(end_date) + 'T23:59:59') : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const filteredSales = data.sales.filter(s => {
    const d = new Date(s.sale_date);
    return d >= start && d <= end;
  });

  const filteredExpenses = data.expenses.filter(e => {
    const d = new Date(e.date + 'T12:00:00');
    return d >= start && d <= end;
  });

  const filteredProductions = data.productions.filter(p => {
    const d = new Date(p.production_date + 'T12:00:00');
    return d >= start && d <= end;
  });

  const gross_revenue = filteredSales.reduce((sum, s) => sum + s.subtotal, 0);
  const total_discount = filteredSales.reduce((sum, s) => sum + s.discount, 0);
  const net_revenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const total_hpp = filteredSales.reduce((sum, s) => sum + s.total_hpp, 0);
  const gross_profit = net_revenue - total_hpp;
  const gross_profit_margin = net_revenue > 0 ? (gross_profit / net_revenue) * 100 : 0;

  const expenseCategoryMap: Record<string, number> = {};
  let total_expenses = 0;
  filteredExpenses.forEach(exp => {
    expenseCategoryMap[exp.category] = (expenseCategoryMap[exp.category] || 0) + exp.amount;
    total_expenses += exp.amount;
  });

  const expenses_by_category = Object.entries(expenseCategoryMap).map(([category, total]) => ({
    category,
    total
  }));

  const net_profit = gross_profit - total_expenses;
  const net_profit_margin = net_revenue > 0 ? (net_profit / net_revenue) * 100 : 0;
  const total_production_cost = filteredProductions.reduce((sum, p) => sum + p.total_cost, 0);

  res.json({
    success: true,
    data: {
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
      gross_revenue,
      total_discount,
      net_revenue,
      total_hpp,
      gross_profit,
      gross_profit_margin,
      total_expenses,
      expenses_by_category,
      net_profit,
      net_profit_margin,
      sales_count: filteredSales.length,
      production_count: filteredProductions.length,
      total_production_cost
    }
  });
});

// Database SQL Schema Export Endpoint
apiRouter.get('/database/sql', (req: Request, res: Response) => {
  const sql = `-- Database Schema: Rumah Jajanan Lashira
-- Dialect: MySQL 5.7+ / MariaDB / PostgreSQL Compatible
-- Exported for Shared Hosting (Hostinger, cPanel, VPS)

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('superadmin', 'admin', 'cashier', 'kitchen') DEFAULT 'admin',
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('ingredient', 'product') NOT NULL
);

CREATE TABLE IF NOT EXISTS units (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  base_unit VARCHAR(20) NOT NULL,
  conversion_value DECIMAL(12,4) NOT NULL DEFAULT 1.0
);

CREATE TABLE IF NOT EXISTS suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS ingredients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  category_id INT,
  unit_id INT,
  purchase_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  purchase_quantity DECIMAL(12,2) NOT NULL DEFAULT 1,
  price_per_unit DECIMAL(15,4) NOT NULL DEFAULT 0,
  stock DECIMAL(15,2) NOT NULL DEFAULT 0,
  minimum_stock DECIMAL(15,2) NOT NULL DEFAULT 0,
  supplier_id INT,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  category_id INT,
  image TEXT,
  description TEXT,
  selling_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  hpp DECIMAL(15,2) NOT NULL DEFAULT 0,
  profit_nominal DECIMAL(15,2) NOT NULL DEFAULT 0,
  margin_percentage DECIMAL(8,2) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  minimum_stock INT NOT NULL DEFAULT 0,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS recipes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL UNIQUE,
  production_quantity INT NOT NULL DEFAULT 1,
  packaging_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
  labor_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
  utility_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
  other_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
  notes TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recipe_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipe_id INT NOT NULL,
  ingredient_id INT NOT NULL,
  quantity DECIMAL(12,4) NOT NULL,
  unit_id INT NOT NULL,
  calculated_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
  FOREIGN KEY (unit_id) REFERENCES units(id)
);

CREATE TABLE IF NOT EXISTS productions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  production_number VARCHAR(50) NOT NULL UNIQUE,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  ingredient_cost DECIMAL(15,2) NOT NULL,
  packaging_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
  labor_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
  utility_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
  other_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(15,2) NOT NULL,
  hpp_per_unit DECIMAL(15,2) NOT NULL,
  production_date DATE NOT NULL,
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  sale_date DATETIME NOT NULL,
  customer_name VARCHAR(100) DEFAULT 'Pelanggan Umum',
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  discount DECIMAL(15,2) NOT NULL DEFAULT 0,
  total DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_hpp DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_profit DECIMAL(15,2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'Cash',
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  expense_number VARCHAR(50) NOT NULL UNIQUE,
  date DATE NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(50) DEFAULT 'Cash',
  receipt TEXT,
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_type ENUM('ingredient', 'product') NOT NULL,
  item_id INT NOT NULL,
  item_name VARCHAR(150) NOT NULL,
  movement_type VARCHAR(50) NOT NULL,
  quantity DECIMAL(12,2) NOT NULL,
  previous_stock DECIMAL(12,2) NOT NULL,
  current_stock DECIMAL(12,2) NOT NULL,
  reference_type VARCHAR(50) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  user_name VARCHAR(100),
  action VARCHAR(100) NOT NULL,
  module VARCHAR(100) NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

  res.json({ success: true, sql });
});
