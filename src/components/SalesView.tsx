import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Receipt,
  Printer,
  CreditCard,
  Banknote,
  QrCode,
  Search,
  CheckCircle,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  User as UserIcon,
  X,
  Sparkles
} from 'lucide-react';
import { Product, Sale, User, AppSettings } from '../types';
import { api } from '../services/api';
import { formatRupiah, formatDateIndo, exportToExcel, exportToPDF } from '../utils/formatters';
import { ReceiptModal } from './ReceiptModal';

interface SalesViewProps {
  currentUser: User | null;
  settings: AppSettings | null;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export const SalesView: React.FC<SalesViewProps> = ({ currentUser, settings }) => {
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');
  const [products, setProducts] = useState<Product[]>([]);
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  // POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('Pelanggan Umum');
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Transfer' | 'QRIS' | 'E-wallet' | 'Lainnya'>('Cash');
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [posSearch, setPosSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Receipt Modal
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        api.getProducts(),
        api.getSales()
      ]);
      if (pRes.success) setProducts(pRes.data);
      if (sRes.success) setSalesHistory(sRes.data);
    } catch (err) {
      console.error('Error loading sales data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert(`Stok untuk produk ${product.name} telah habis.`);
      return;
    }

    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty >= product.stock) {
        alert(`Jumlah pesanan mencapai batas stok yang tersedia (${product.stock} pcs).`);
        return;
      }
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: number, newQty: number) => {
    const p = products.find(prod => prod.id === productId);
    if (!p) return;

    if (newQty <= 0) {
      setCart(cart.filter(item => item.product.id !== productId));
      return;
    }

    if (newQty > p.stock) {
      alert(`Maksimal stok tersedia adalah ${p.stock} pcs.`);
      return;
    }

    setCart(cart.map(item => item.product.id === productId ? { ...item, quantity: newQty } : item));
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setCashGiven(0);
    setNotes('');
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.product.selling_price * item.quantity), 0);
  const totalAmount = Math.max(subtotal - Number(discount || 0), 0);
  const changeDue = paymentMethod === 'Cash' && cashGiven >= totalAmount ? cashGiven - totalAmount : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setErrorMsg('Keranjang pesanan masih kosong.');
      return;
    }
    if (paymentMethod === 'Cash' && cashGiven > 0 && cashGiven < totalAmount) {
      setErrorMsg('Uang tunai yang diterima kurang dari total pembayaran.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        sale_date: new Date().toISOString(),
        customer_name: customerName || 'Pelanggan Umum',
        discount: Number(discount) || 0,
        payment_method: paymentMethod,
        notes,
        created_by: currentUser?.id || 1,
        created_by_name: currentUser?.name || 'Kasir',
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity
        }))
      };

      const res = await api.createSale(payload);
      if (res.success && res.data) {
        setReceiptSale(res.data);
        clearCart();
        loadData();
      } else {
        setErrorMsg(res.message || 'Gagal memproses transaksi.');
      }
    } catch (err: any) {
      setErrorMsg('Terjadi kesalahan pada server saat checkout.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCatalog = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(posSearch.toLowerCase()) || p.code.toLowerCase().includes(posSearch.toLowerCase());
    const matchCat = selectedCategory === 'all' || String(p.category_id) === selectedCategory;
    return matchSearch && matchCat && p.status === 'active';
  });

  const categories = products.reduce<{ id: number; name: string }[]>((acc, p) => {
    if (!acc.some(c => c.id === p.category_id)) {
      acc.push({ id: p.category_id, name: p.category_name || 'Kategori' });
    }
    return acc;
  }, []);

  const handleExportExcelHistory = () => {
    const data = salesHistory.map(s => ({
      'No. Nota': s.invoice_number,
      'Tanggal': s.sale_date,
      'Pelanggan': s.customer_name,
      'Subtotal': s.subtotal,
      'Diskon': s.discount,
      'Total Bayar': s.total,
      'Total HPP': s.total_hpp,
      'Laba Kotor': s.total_profit,
      'Metode Bayar': s.payment_method,
      'Kasir': s.created_by_name
    }));
    exportToExcel(data, 'Riwayat_Penjualan_Lashira');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-rose-600" />
            <span>Kasir Penjualan Makanan (POS)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan transaksi kasir, kalkulasi otomatis laba kotor &amp; HPP per struk, serta pemotongan stok jadi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              onClick={() => setActiveTab('pos')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'pos' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Mesin Kasir
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'history' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Riwayat Transaksi ({salesHistory.length})
            </button>
          </div>
        </div>
      </div>

      {/* 1. POS Mode View */}
      {activeTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Product Selection Grid */}
          <div className="lg:col-span-7 space-y-4">
            {/* Search & Category Filter */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari jajanan untuk kasir..."
                  value={posSearch}
                  onChange={e => setPosSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full sm:w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
              >
                <option value="all">Semua Kategori</option>
                {categories.map(c => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[620px] overflow-y-auto pr-1">
              {filteredCatalog.map(p => {
                const inCart = cart.find(c => c.product.id === p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className={`p-3 bg-white rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between group hover:shadow-md ${
                      inCart ? 'border-rose-500 ring-2 ring-rose-200' : 'border-slate-200/90 hover:border-rose-300'
                    } ${p.stock <= 0 ? 'opacity-60 pointer-events-none' : ''}`}
                  >
                    <div>
                      <div className="relative h-24 rounded-xl overflow-hidden bg-slate-100 mb-2">
                        <img
                          src={p.image || 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=300&auto=format&fit=crop&q=80'}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className={`absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold shadow-xs ${
                          p.stock > 0 ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                        }`}>
                          Stok: {p.stock}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight">
                        {p.name}
                      </h4>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <p className="text-xs font-extrabold text-rose-700">
                        {formatRupiah(p.selling_price)}
                      </p>
                      {inCart && (
                        <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                          {inCart.quantity}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Checkout Cart & Payment */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-rose-600" />
                  <h3 className="text-sm font-bold text-slate-800">Keranjang Belanja</h3>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700"
                  >
                    Kosongkan
                  </button>
                )}
              </div>

              {errorMsg && (
                <div className="my-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              {/* Customer Name Input */}
              <div className="mt-3">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Nama Pelanggan
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Pelanggan Umum"
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Cart Items List */}
              <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                    Keranjang masih kosong.<br />Klik menu jajanan di sebelah kiri untuk menambahkan.
                  </div>
                ) : (
                  cart.map(item => (
                    <div
                      key={item.product.id}
                      className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-2"
                    >
                      <div className="truncate flex-1">
                        <p className="text-xs font-bold text-slate-800 truncate">{item.product.name}</p>
                        <p className="text-[10px] text-slate-500">
                          {formatRupiah(item.product.selling_price)} x {item.quantity}
                        </p>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold hover:bg-slate-100 text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold hover:bg-slate-100 text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-slate-900">
                          {formatRupiah(item.product.selling_price * item.quantity)}
                        </p>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-[10px] text-rose-500 hover:text-rose-700"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Payment & Calculation Box */}
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-900">{formatRupiah(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between gap-3 text-slate-600">
                  <span>Potongan / Diskon (Rp):</span>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={e => setDiscount(Number(e.target.value))}
                    className="w-28 px-2 py-1 text-right bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-rose-700"
                  />
                </div>

                <div className="flex justify-between text-sm font-black text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>TOTAL AKHIR:</span>
                  <span className="text-base text-rose-600">{formatRupiah(totalAmount)}</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['Cash', 'Transfer', 'QRIS', 'E-wallet'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all ${
                        paymentMethod === m
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash Given & Change Calculator */}
              {paymentMethod === 'Cash' && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Uang Diterima (Rp):</span>
                    <input
                      type="number"
                      min="0"
                      value={cashGiven}
                      onChange={e => setCashGiven(Number(e.target.value))}
                      className="w-32 px-2 py-1 text-right bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    />
                  </div>

                  {/* Quick Cash Presets */}
                  <div className="flex items-center gap-1.5">
                    {[totalAmount, 20000, 50000, 100000].map((val, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCashGiven(val)}
                        className="flex-1 py-1 text-[10px] font-bold rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700"
                      >
                        {formatRupiah(val)}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-between text-xs font-extrabold pt-1 border-t border-slate-200">
                    <span className="text-slate-600">Kembalian:</span>
                    <span className="text-emerald-700 text-sm">{formatRupiah(changeDue)}</span>
                  </div>
                </div>
              )}

              {/* Checkout Action Button */}
              <button
                type="button"
                id="btn-process-checkout"
                disabled={submitting || cart.length === 0}
                onClick={handleCheckout}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>BAYAR &amp; CETAK STRUK ({formatRupiah(totalAmount)})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Sales History View */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Riwayat Seluruh Transaksi Penjualan</h3>
            <button
              onClick={handleExportExcelHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Download Excel</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">No. Nota</th>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Pelanggan</th>
                  <th className="py-3 px-4">Total Belanja</th>
                  <th className="py-3 px-4">HPP Transaksi</th>
                  <th className="py-3 px-4">Laba Kotor</th>
                  <th className="py-3 px-4">Metode Bayar</th>
                  <th className="py-3 px-4">Kasir</th>
                  <th className="py-3 px-4 text-right">Struk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salesHistory.map(sale => (
                  <tr key={sale.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-rose-700">{sale.invoice_number}</td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{formatDateIndo(sale.sale_date, true)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{sale.customer_name}</td>
                    <td className="py-3 px-4 font-extrabold text-slate-900">{formatRupiah(sale.total)}</td>
                    <td className="py-3 px-4 text-slate-600">{formatRupiah(sale.total_hpp)}</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">{formatRupiah(sale.total_profit)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {sale.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{sale.created_by_name}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setReceiptSale(sale)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      <ReceiptModal
        sale={receiptSale}
        settings={settings}
        onClose={() => setReceiptSale(null)}
      />
    </div>
  );
};
