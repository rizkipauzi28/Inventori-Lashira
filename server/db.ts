import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { DatabaseSchema, User, Ingredient, Product, Recipe, Production, Sale, Expense, StockMovement, AuditLog, AppSettings, Unit, Category, Supplier } from './dbTypes.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Initial master units
const initialUnits: Unit[] = [
  { id: 1, name: 'Gram', symbol: 'g', base_unit: 'g', conversion_value: 1 },
  { id: 2, name: 'Kilogram', symbol: 'kg', base_unit: 'g', conversion_value: 1000 },
  { id: 3, name: 'Mililiter', symbol: 'ml', base_unit: 'ml', conversion_value: 1 },
  { id: 4, name: 'Liter', symbol: 'l', base_unit: 'ml', conversion_value: 1000 },
  { id: 5, name: 'Pieces / Buah', symbol: 'pcs', base_unit: 'pcs', conversion_value: 1 },
  { id: 6, name: 'Bungkus / Pouch', symbol: 'bks', base_unit: 'pcs', conversion_value: 1 },
  { id: 7, name: 'Butir', symbol: 'btr', base_unit: 'pcs', conversion_value: 1 },
  { id: 8, name: 'Sendok Makan', symbol: 'sdm', base_unit: 'g', conversion_value: 15 },
  { id: 9, name: 'Sachet', symbol: 'sct', base_unit: 'pcs', conversion_value: 1 }
];

// Initial categories
const initialCategories: Category[] = [
  { id: 1, name: 'Bahan Mentah / Olahan', type: 'ingredient' },
  { id: 2, name: 'Bumbu & Rempah', type: 'ingredient' },
  { id: 3, name: 'Minyak & Lemak', type: 'ingredient' },
  { id: 4, name: 'Kemasan & Plastik', type: 'ingredient' },
  { id: 5, name: 'Keripik & Basreng', type: 'product' },
  { id: 6, name: 'Cemilan Pedas', type: 'product' },
  { id: 7, name: 'Gorengan & Frozen', type: 'product' },
  { id: 8, name: 'Makaroni & Seblak', type: 'product' }
];

// Initial suppliers
const initialSuppliers: Supplier[] = [
  { id: 1, name: 'Toko Sumber Pangan Mandiri', phone: '081234567890', address: 'Pasar Induk Gedebage Blok A No. 12, Bandung', notes: 'Supplier tepung, minyak, dan bumbu dasar' },
  { id: 2, name: 'Pabrik Kerupuk & Basreng Asli', phone: '085712345678', address: 'Jl. Raya Soreang No. 88, Kab. Bandung', notes: 'Supplier basreng mentah & kerupuk seblak super' },
  { id: 3, name: 'Kemasan Nusantara Grafika', phone: '087890123456', address: 'Jl. Kopo Jaya No. 45, Bandung', notes: 'Supplier standing pouch klip, plastik zipper, & stiker logo' }
];

// Initial default settings
const initialSettings: AppSettings = {
  business_name: 'Rumah Jajanan Lashira',
  tagline: 'Sensasi Jajanan Nusantara Gurih, Renyah & Pedas Juara',
  logo: '/assets/logo.png',
  address: 'Jl. Cisaranten Kulon No. 42, Arcamanik, Kota Bandung, Jawa Barat 40293',
  whatsapp: '0821-2345-6789',
  email: 'kontak@rumahjajananlashira.com',
  receipt_footer: 'Terima kasih atas pesanan Anda di Rumah Jajanan Lashira!\nCamilan dibuat segar dan higienis setiap hari.',
  currency: 'Rp',
  enable_negative_stock: false,
  auto_update_product_hpp: true
};

// Initial ingredients
const initialIngredients: Ingredient[] = [
  {
    id: 1,
    code: 'BAHAN-001',
    name: 'Basreng Mentah Stik (Kualitas Super)',
    category_id: 1,
    unit_id: 2, // kg
    purchase_price: 25000,
    purchase_quantity: 1,
    price_per_unit: 25, // Rp 25 per gram (25000 / 1000)
    stock: 25000, // 25.000 gram (25 kg)
    minimum_stock: 5000, // 5 kg
    supplier_id: 2,
    buy_date: '2026-08-20',
    status: 'active',
    created_at: '2026-08-20 08:00:00',
    updated_at: '2026-08-20 08:00:00'
  },
  {
    id: 2,
    code: 'BAHAN-002',
    name: 'Minyak Goreng Sawit',
    category_id: 3,
    unit_id: 4, // liter
    purchase_price: 18000,
    purchase_quantity: 1,
    price_per_unit: 18, // Rp 18 per ml
    stock: 20000, // 20.000 ml (20 L)
    minimum_stock: 4000,
    supplier_id: 1,
    buy_date: '2026-08-21',
    status: 'active',
    created_at: '2026-08-21 08:00:00',
    updated_at: '2026-08-21 08:00:00'
  },
  {
    id: 3,
    code: 'BAHAN-003',
    name: 'Cabai Bubuk Halus Premium',
    category_id: 2,
    unit_id: 2, // kg
    purchase_price: 60000,
    purchase_quantity: 1,
    price_per_unit: 60, // Rp 60 per gram
    stock: 5000, // 5000 gram (5 kg)
    minimum_stock: 1000,
    supplier_id: 1,
    buy_date: '2026-08-21',
    status: 'active',
    created_at: '2026-08-21 08:00:00',
    updated_at: '2026-08-21 08:00:00'
  },
  {
    id: 4,
    code: 'BAHAN-004',
    name: 'Bumbu Penyedap Gurih & Bawang',
    category_id: 2,
    unit_id: 2, // kg
    purchase_price: 35000,
    purchase_quantity: 1,
    price_per_unit: 35, // Rp 35 per gram
    stock: 6000, // 6 kg
    minimum_stock: 1000,
    supplier_id: 1,
    buy_date: '2026-08-21',
    status: 'active',
    created_at: '2026-08-21 08:00:00',
    updated_at: '2026-08-21 08:00:00'
  },
  {
    id: 5,
    code: 'BAHAN-005',
    name: 'Daun Jeruk Segar Goreng Cincang',
    category_id: 2,
    unit_id: 2, // kg
    purchase_price: 40000,
    purchase_quantity: 1,
    price_per_unit: 40, // Rp 40 per gram
    stock: 3000, // 3 kg
    minimum_stock: 500,
    supplier_id: 1,
    buy_date: '2026-08-21',
    status: 'active',
    created_at: '2026-08-21 08:00:00',
    updated_at: '2026-08-21 08:00:00'
  },
  {
    id: 6,
    code: 'BAHAN-006',
    name: 'Standing Pouch Sablon Lashira (15x22)',
    category_id: 4,
    unit_id: 5, // pcs
    purchase_price: 600,
    purchase_quantity: 1,
    price_per_unit: 600,
    stock: 500, // 500 pcs
    minimum_stock: 100,
    supplier_id: 3,
    buy_date: '2026-08-22',
    status: 'active',
    created_at: '2026-08-22 08:00:00',
    updated_at: '2026-08-22 08:00:00'
  },
  {
    id: 7,
    code: 'BAHAN-007',
    name: 'Makaroni Pipa Mentah',
    category_id: 1,
    unit_id: 2, // kg
    purchase_price: 22000,
    purchase_quantity: 1,
    price_per_unit: 22,
    stock: 15000, // 15 kg
    minimum_stock: 3000,
    supplier_id: 1,
    buy_date: '2026-08-20',
    status: 'active',
    created_at: '2026-08-20 08:00:00',
    updated_at: '2026-08-20 08:00:00'
  },
  {
    id: 8,
    code: 'BAHAN-008',
    name: 'Tepung Tapioka / Aci Gunung',
    category_id: 1,
    unit_id: 2, // kg
    purchase_price: 15000,
    purchase_quantity: 1,
    price_per_unit: 15,
    stock: 20000, // 20 kg
    minimum_stock: 4000,
    supplier_id: 1,
    buy_date: '2026-08-20',
    status: 'active',
    created_at: '2026-08-20 08:00:00',
    updated_at: '2026-08-20 08:00:00'
  }
];

// Initial products
const initialProducts: Product[] = [
  {
    id: 1,
    code: 'PRD-001',
    name: 'Basreng Pedas Daun Jeruk (200g)',
    category_id: 5,
    image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=80',
    description: 'Baso goreng renyah bumbu cabai rawit melimpah dipadu aroma wangi daun jeruk asli khas Bandung.',
    selling_price: 18000,
    hpp: 8400,
    margin_percentage: 114.29,
    stock: 45,
    minimum_stock: 15,
    status: 'active',
    created_at: '2026-08-20 09:00:00',
    updated_at: '2026-08-20 09:00:00'
  },
  {
    id: 2,
    code: 'PRD-002',
    name: 'Makaroni Kriuk Pedas Level 5 (150g)',
    category_id: 8,
    image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=500&auto=format&fit=crop&q=80',
    description: 'Makaroni renyah gurih dibalut bumbu balado pedas nampol level 5 dengan taburan daun jeruk.',
    selling_price: 12000,
    hpp: 5200,
    margin_percentage: 130.77,
    stock: 60,
    minimum_stock: 20,
    status: 'active',
    created_at: '2026-08-20 09:00:00',
    updated_at: '2026-08-20 09:00:00'
  },
  {
    id: 3,
    code: 'PRD-003',
    name: 'Cireng Krispi Bumbu Rujak (Isi 10)',
    category_id: 7,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=80',
    description: 'Cireng renyah di luar kenyal lembut di dalam, lengkap dengan cocolan sambal rujak gula aren kental pedas manis.',
    selling_price: 16000,
    hpp: 7100,
    margin_percentage: 125.35,
    stock: 35,
    minimum_stock: 10,
    status: 'active',
    created_at: '2026-08-20 09:00:00',
    updated_at: '2026-08-20 09:00:00'
  },
  {
    id: 4,
    code: 'PRD-004',
    name: 'Keripik Kaca Ekstra Pedas (100g)',
    category_id: 5,
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop&q=80',
    description: 'Keripik kaca super tipis transparan dan kriuk dengan lumuran minyak cabai daun jeruk khas.',
    selling_price: 10000,
    hpp: 4300,
    margin_percentage: 132.56,
    stock: 50,
    minimum_stock: 15,
    status: 'active',
    created_at: '2026-08-20 09:00:00',
    updated_at: '2026-08-20 09:00:00'
  }
];

// Initial recipes
const initialRecipes: Recipe[] = [
  {
    id: 1,
    product_id: 1, // Basreng Pedas Daun Jeruk (200g)
    production_quantity: 10, // Yields 10 pouches
    packaging_cost: 6000, // 10 pouches @ Rp 600
    labor_cost: 10000, // Tenaga kerja Rp 1.000 / pouch
    utility_cost: 5000, // Gas & listrik Rp 500 / pouch
    other_cost: 3000,
    notes: 'Resep standar batch 10 pouch basreng 200g (2kg total bahan matang)',
    items: [
      { id: 1, recipe_id: 1, ingredient_id: 1, quantity: 2000, unit_id: 1, calculated_cost: 50000 }, // 2000g basreng = Rp 50.000
      { id: 2, recipe_id: 1, ingredient_id: 2, quantity: 300, unit_id: 3, calculated_cost: 5400 }, // 300ml minyak = Rp 5.400
      { id: 3, recipe_id: 1, ingredient_id: 3, quantity: 50, unit_id: 1, calculated_cost: 3000 }, // 50g cabai bubuk = Rp 3.000
      { id: 4, recipe_id: 1, ingredient_id: 4, quantity: 40, unit_id: 1, calculated_cost: 1400 }, // 40g penyedap = Rp 1.400
      { id: 5, recipe_id: 1, ingredient_id: 5, quantity: 20, unit_id: 1, calculated_cost: 800 }, // 20g daun jeruk = Rp 800
      { id: 6, recipe_id: 1, ingredient_id: 6, quantity: 10, unit_id: 5, calculated_cost: 6000 } // 10 kemasan = Rp 6.000
    ],
    updated_at: '2026-08-20 10:00:00'
  },
  {
    id: 2,
    product_id: 2, // Makaroni Kriuk
    production_quantity: 10,
    packaging_cost: 6000,
    labor_cost: 8000,
    utility_cost: 4000,
    other_cost: 2000,
    notes: 'Resep batch 10 pouch Makaroni Pedas 150g',
    items: [
      { id: 7, recipe_id: 2, ingredient_id: 7, quantity: 1500, unit_id: 1, calculated_cost: 33000 }, // 1.5kg makaroni
      { id: 8, recipe_id: 2, ingredient_id: 2, quantity: 250, unit_id: 3, calculated_cost: 4500 }, // 250ml minyak
      { id: 9, recipe_id: 2, ingredient_id: 3, quantity: 40, unit_id: 1, calculated_cost: 2400 }, // 40g cabai
      { id: 10, recipe_id: 2, ingredient_id: 4, quantity: 30, unit_id: 1, calculated_cost: 1050 }, // 30g bumbu
      { id: 11, recipe_id: 2, ingredient_id: 5, quantity: 15, unit_id: 1, calculated_cost: 600 } // 15g daun jeruk
    ],
    updated_at: '2026-08-20 10:00:00'
  }
];

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Error loading database JSON, re-seeding...', err);
      }
    }
    return this.createSeedData();
  }

  private createSeedData(): DatabaseSchema {
    // Generate bcrypt hash for default passwords
    const salt = bcrypt.genSaltSync(10);
    const superAdminPassword = bcrypt.hashSync('lashira2026!', salt);
    const adminPassword = bcrypt.hashSync('admin123', salt);

    const defaultUsers: User[] = [
      {
        id: 1,
        name: 'Hj. Siti Lashira (Owner)',
        username: 'superadmin',
        email: 'owner@rumahjajananlashira.com',
        password: superAdminPassword,
        role: 'superadmin',
        status: 'active',
        created_at: '2026-08-01 08:00:00',
        updated_at: '2026-08-01 08:00:00'
      },
      {
        id: 2,
        name: 'Budi Santoso (Admin Kasir & Produksi)',
        username: 'admin',
        email: 'admin@rumahjajananlashira.com',
        password: adminPassword,
        role: 'admin',
        status: 'active',
        must_change_password: true,
        created_at: '2026-08-01 08:00:00',
        updated_at: '2026-08-01 08:00:00'
      }
    ];

    // Initial production record
    const initialProductions: Production[] = [
      {
        id: 1,
        production_number: 'PRD-20260822-0001',
        product_id: 1,
        product_name: 'Basreng Pedas Daun Jeruk (200g)',
        quantity: 50, // 5 batches
        ingredient_cost: 333000,
        packaging_cost: 30000,
        labor_cost: 50000,
        utility_cost: 25000,
        other_cost: 15000,
        total_cost: 453000,
        hpp_per_unit: 9060,
        production_date: '2026-08-22 09:30:00',
        notes: 'Produksi batch pagi untuk stok akhir pekan',
        created_by: 1,
        created_by_name: 'Hj. Siti Lashira (Owner)',
        items: [
          { id: 1, production_id: 1, ingredient_id: 1, ingredient_name: 'Basreng Mentah Stik', quantity_used: 10000, unit_symbol: 'g', cost: 250000 },
          { id: 2, production_id: 1, ingredient_id: 2, ingredient_name: 'Minyak Goreng Sawit', quantity_used: 1500, unit_symbol: 'ml', cost: 27000 },
          { id: 3, production_id: 1, ingredient_id: 3, ingredient_name: 'Cabai Bubuk Halus Premium', quantity_used: 250, unit_symbol: 'g', cost: 15000 },
          { id: 4, production_id: 1, ingredient_id: 4, ingredient_name: 'Bumbu Penyedap Gurih & Bawang', quantity_used: 200, unit_symbol: 'g', cost: 7000 },
          { id: 5, production_id: 1, ingredient_id: 5, ingredient_name: 'Daun Jeruk Segar Goreng Cincang', quantity_used: 100, unit_symbol: 'g', cost: 4000 },
          { id: 6, production_id: 1, ingredient_id: 6, ingredient_name: 'Standing Pouch Sablon Lashira', quantity_used: 50, unit_symbol: 'pcs', cost: 30000 }
        ],
        created_at: '2026-08-22 09:30:00'
      }
    ];

    // Initial sales records
    const initialSales: Sale[] = [
      {
        id: 1,
        invoice_number: 'INV-20260822-0001',
        sale_date: '2026-08-22 14:15:00',
        customer_name: 'Rina Marlina (Reseller Bandung)',
        subtotal: 180000,
        discount: 10000,
        total: 170000,
        total_hpp: 84000,
        total_profit: 86000,
        payment_method: 'QRIS',
        notes: 'Ambil di gerai langsung',
        created_by: 2,
        created_by_name: 'Budi Santoso',
        items: [
          { id: 1, sale_id: 1, product_id: 1, product_name: 'Basreng Pedas Daun Jeruk (200g)', quantity: 10, selling_price: 18000, hpp: 8400, subtotal: 180000, profit: 96000 }
        ],
        created_at: '2026-08-22 14:15:00'
      },
      {
        id: 2,
        invoice_number: 'INV-20260823-0001',
        sale_date: '2026-08-23 10:30:00',
        customer_name: 'Kak Dinda (Pelanggan Setia)',
        subtotal: 76000,
        discount: 0,
        total: 76000,
        total_hpp: 33600,
        total_profit: 42400,
        payment_method: 'Cash',
        notes: 'Pesanan untuk oleh-oleh',
        created_by: 2,
        created_by_name: 'Budi Santoso',
        items: [
          { id: 2, sale_id: 2, product_id: 1, product_name: 'Basreng Pedas Daun Jeruk (200g)', quantity: 2, selling_price: 18000, hpp: 8400, subtotal: 36000, profit: 19200 },
          { id: 3, sale_id: 2, product_id: 2, product_name: 'Makaroni Kriuk Pedas Level 5 (150g)', quantity: 2, selling_price: 12000, hpp: 5200, subtotal: 24000, profit: 13600 },
          { id: 4, sale_id: 2, product_id: 3, product_name: 'Cireng Krispi Bumbu Rujak (Isi 10)', quantity: 1, selling_price: 16000, hpp: 7100, subtotal: 16000, profit: 8900 }
        ],
        created_at: '2026-08-23 10:30:00'
      }
    ];

    // Initial expenses
    const initialExpenses: Expense[] = [
      {
        id: 1,
        expense_number: 'EXP-20260821-0001',
        date: '2026-08-21',
        category: 'Gas',
        description: 'Isi ulang tabung gas LPG 3kg x 3 tabung',
        amount: 66000,
        payment_method: 'Cash',
        notes: 'Pangkalan Gas Barokah',
        created_by: 1,
        created_by_name: 'Hj. Siti Lashira',
        created_at: '2026-08-21 11:00:00'
      },
      {
        id: 2,
        expense_number: 'EXP-20260822-0001',
        date: '2026-08-22',
        category: 'Marketing',
        description: 'Iklan Instagram Ads & TikTok Shop Promo Weekend',
        amount: 50000,
        payment_method: 'Transfer',
        notes: 'Campaign akhir pekan promo Basreng',
        created_by: 1,
        created_by_name: 'Hj. Siti Lashira',
        created_at: '2026-08-22 15:00:00'
      }
    ];

    // Initial stock movements
    const initialStockMovements: StockMovement[] = [
      {
        id: 1,
        item_type: 'ingredient',
        item_id: 1,
        item_name: 'Basreng Mentah Stik (Kualitas Super)',
        movement_type: 'in',
        quantity: 35000,
        previous_stock: 0,
        current_stock: 35000,
        reference_type: 'purchase',
        reference_id: 'PO-001',
        notes: 'Pembelian stok awal dari supplier',
        created_at: '2026-08-20 08:00:00'
      },
      {
        id: 2,
        item_type: 'ingredient',
        item_id: 1,
        item_name: 'Basreng Mentah Stik (Kualitas Super)',
        movement_type: 'production',
        quantity: -10000,
        previous_stock: 35000,
        current_stock: 25000,
        reference_type: 'production',
        reference_id: 'PRD-20260822-0001',
        notes: 'Digunakan untuk produksi Basreng Pedas Daun Jeruk 50 pcs',
        created_at: '2026-08-22 09:30:00'
      },
      {
        id: 3,
        item_type: 'product',
        item_id: 1,
        item_name: 'Basreng Pedas Daun Jeruk (200g)',
        movement_type: 'production',
        quantity: 50,
        previous_stock: 7,
        current_stock: 57,
        reference_type: 'production',
        reference_id: 'PRD-20260822-0001',
        notes: 'Hasil produksi batch PRD-20260822-0001',
        created_at: '2026-08-22 09:30:00'
      },
      {
        id: 4,
        item_type: 'product',
        item_id: 1,
        item_name: 'Basreng Pedas Daun Jeruk (200g)',
        movement_type: 'sale',
        quantity: -12,
        previous_stock: 57,
        current_stock: 45,
        reference_type: 'sale',
        reference_id: 'INV-20260822-0001 / INV-20260823-0001',
        notes: 'Penjualan ke pelanggan',
        created_at: '2026-08-23 10:30:00'
      }
    ];

    // Initial audit logs
    const initialAuditLogs: AuditLog[] = [
      {
        id: 1,
        user_id: 1,
        user_name: 'Hj. Siti Lashira',
        activity: 'Inisialisasi Sistem',
        details: 'Sistem Rumah Jajanan Lashira berhasil dikonfigurasi dan diinisialisasi.',
        ip_address: '127.0.0.1',
        created_at: '2026-08-20 08:00:00'
      },
      {
        id: 2,
        user_id: 1,
        user_name: 'Hj. Siti Lashira',
        activity: 'Input Resep & HPP',
        details: 'Membuat resep dan kalkulasi HPP otomatis untuk Basreng Pedas Daun Jeruk.',
        ip_address: '127.0.0.1',
        created_at: '2026-08-20 10:00:00'
      }
    ];

    const initialDb: DatabaseSchema = {
      users: defaultUsers,
      categories: initialCategories,
      units: initialUnits,
      suppliers: initialSuppliers,
      ingredients: initialIngredients,
      products: initialProducts,
      recipes: initialRecipes,
      productions: initialProductions,
      sales: initialSales,
      expenses: initialExpenses,
      stock_movements: initialStockMovements,
      audit_logs: initialAuditLogs,
      settings: initialSettings
    };

    this.saveData(initialDb);
    return initialDb;
  }

  public save(): void {
    this.saveData(this.data);
  }

  private saveData(data: DatabaseSchema): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving data to db.json:', err);
    }
  }

  public getData(): DatabaseSchema {
    return this.data;
  }

  // Generate unique auto-increment codes
  public generateCode(prefix: 'PRD' | 'INV' | 'EXP' | 'BAHAN', date = new Date()): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;

    let count = 1;
    if (prefix === 'PRD') {
      const todayProductions = this.data.productions.filter(p => p.production_number.startsWith(`PRD-${dateStr}`));
      count = todayProductions.length + 1;
      return `PRD-${dateStr}-${String(count).padStart(4, '0')}`;
    } else if (prefix === 'INV') {
      const todaySales = this.data.sales.filter(s => s.invoice_number.startsWith(`INV-${dateStr}`));
      count = todaySales.length + 1;
      return `INV-${dateStr}-${String(count).padStart(4, '0')}`;
    } else if (prefix === 'EXP') {
      const todayExpenses = this.data.expenses.filter(e => e.expense_number?.startsWith(`EXP-${dateStr}`));
      count = todayExpenses.length + 1;
      return `EXP-${dateStr}-${String(count).padStart(4, '0')}`;
    } else {
      const allIngr = this.data.ingredients;
      count = allIngr.length + 1;
      return `BAHAN-${String(count).padStart(3, '0')}`;
    }
  }

  // Audit Logger
  public logAudit(userId: number, userName: string, activity: string, details?: string, ipAddress?: string): void {
    const newLog: AuditLog = {
      id: this.data.audit_logs.length > 0 ? Math.max(...this.data.audit_logs.map(l => l.id)) + 1 : 1,
      user_id: userId,
      user_name: userName,
      activity,
      details,
      ip_address: ipAddress || '127.0.0.1',
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    this.data.audit_logs.unshift(newLog);
    // Keep max 500 audit logs to prevent infinite expansion
    if (this.data.audit_logs.length > 500) {
      this.data.audit_logs = this.data.audit_logs.slice(0, 500);
    }
    this.save();
  }
}

export const db = new Database();
