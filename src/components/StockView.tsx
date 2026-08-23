import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  History,
  SlidersHorizontal,
  Package,
  Layers2,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  X,
  RefreshCw
} from 'lucide-react';
import { Ingredient, Product, StockMovement } from '../types';
import { api } from '../services/api';
import { formatRupiah, formatQuantityWithUnit, formatDateIndo, exportToExcel, exportToPDF } from '../utils/formatters';

export const StockView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ingredients' | 'products' | 'movements'>('ingredients');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCondition, setFilterCondition] = useState<'all' | 'low' | 'safe'>('all');

  // Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustItemType, setAdjustItemType] = useState<'ingredient' | 'product'>('ingredient');
  const [adjustItemId, setAdjustItemId] = useState<number | ''>('');
  const [adjustType, setAdjustType] = useState<'in' | 'out' | 'set'>('in');
  const [adjustQuantity, setAdjustQuantity] = useState<number>(100);
  const [adjustNotes, setAdjustNotes] = useState('');
  const [submittingAdjust, setSubmittingAdjust] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [iRes, pRes, mRes] = await Promise.all([
        api.getIngredients(),
        api.getProducts(),
        api.getStockMovements()
      ]);

      if (iRes.success) setIngredients(iRes.data);
      if (pRes.success) setProducts(pRes.data);
      if (mRes.success) setMovements(mRes.data);
    } catch (err) {
      console.error('Error loading stocks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAdjustModal = (type: 'ingredient' | 'product', id?: number) => {
    setAdjustItemType(type);
    if (id) {
      setAdjustItemId(id);
    } else {
      setAdjustItemId(type === 'ingredient' ? (ingredients[0]?.id || '') : (products[0]?.id || ''));
    }
    setAdjustType('in');
    setAdjustQuantity(type === 'ingredient' ? 500 : 10);
    setAdjustNotes('Stok Opname / Penyesuaian');
    setErrorMessage('');
    setIsAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItemId) {
      setErrorMessage('Pilih item yang ingin disesuaikan.');
      return;
    }

    setSubmittingAdjust(true);
    setErrorMessage('');

    try {
      const res = await api.adjustStock({
        item_type: adjustItemType,
        item_id: Number(adjustItemId),
        adjustment_type: adjustType,
        quantity: Number(adjustQuantity),
        notes: adjustNotes
      });

      if (res.success) {
        setIsAdjustModalOpen(false);
        setSuccessMessage(`Stok berhasil disesuaikan! Stok baru: ${res.current_stock.toLocaleString('id-ID')}`);
        loadData();
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage('Gagal menyesuaikan stok.');
    } finally {
      setSubmittingAdjust(false);
    }
  };

  // Filter lists
  const filteredIngredients = ingredients.filter(i => {
    const matchQuery = i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCond = filterCondition === 'all' || (filterCondition === 'low' ? i.is_low_stock : !i.is_low_stock);
    return matchQuery && matchCond;
  });

  const filteredProducts = products.filter(p => {
    const matchQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCond = filterCondition === 'all' || (filterCondition === 'low' ? p.is_low_stock : !p.is_low_stock);
    return matchQuery && matchCond;
  });

  const filteredMovements = movements.filter(m => {
    return m.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.notes && m.notes.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  // Total Stock Values
  const totalIngredientValue = ingredients.reduce((sum, i) => sum + (i.stock * i.price_per_unit), 0);
  const totalProductValue = products.reduce((sum, p) => sum + (p.stock * p.hpp), 0);

  const handleExportExcel = () => {
    if (activeTab === 'ingredients') {
      const data = filteredIngredients.map(i => ({
        'Kode': i.code,
        'Nama Bahan': i.name,
        'Stok Saat Ini': i.stock,
        'Satuan': i.base_unit,
        'Stok Minimum': i.minimum_stock,
        'Harga / Satuan': Math.round(i.price_per_unit),
        'Nilai Total Stok': Math.round(i.stock * i.price_per_unit),
        'Status': i.is_low_stock ? 'MENIPIS' : 'AMAN'
      }));
      exportToExcel(data, 'Stok_Bahan_Baku');
    } else if (activeTab === 'products') {
      const data = filteredProducts.map(p => ({
        'Kode': p.code,
        'Nama Produk': p.name,
        'Stok (pcs)': p.stock,
        'Min Stok': p.minimum_stock,
        'HPP': p.hpp,
        'Harga Jual': p.selling_price,
        'Nilai Stok (HPP)': p.stock * p.hpp,
        'Status': p.is_low_stock ? 'MENIPIS' : 'AMAN'
      }));
      exportToExcel(data, 'Stok_Produk_Jadi');
    } else {
      const data = filteredMovements.map(m => ({
        'Tanggal': m.created_at,
        'Tipe Item': m.item_type === 'ingredient' ? 'Bahan Baku' : 'Produk Jadi',
        'Nama Item': m.item_name,
        'Mutasi': m.quantity > 0 ? `+${m.quantity}` : `${m.quantity}`,
        'Stok Sebelum': m.previous_stock,
        'Stok Sesudah': m.current_stock,
        'Referensi': m.reference_type,
        'Keterangan': m.notes || '-'
      }));
      exportToExcel(data, 'Kartu_Mutasi_Stok');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-rose-600" />
            <span>Manajemen Stok &amp; Inventaris Real-time</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau saldo persediaan bahan mentah, produk jadi, kartu mutasi stok, dan penyesuaian stok opname.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Excel</span>
          </button>
          <button
            id="btn-stock-adjust"
            onClick={() => openAdjustModal('ingredient')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-all"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Penyesuaian Stok (Opname)</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Summary Valuation KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Nilai Total Stok Bahan</span>
            <Layers2 className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-black text-indigo-700 mt-1">{formatRupiah(totalIngredientValue)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{ingredients.length} item bahan baku di gudang</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Nilai Total Stok Makanan Jadi</span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-emerald-700 mt-1">{formatRupiah(totalProductValue)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{products.reduce((s, p) => s + p.stock, 0)} pcs makanan siap jual</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Persediaan Keseluruhan</span>
            <span className="text-xs font-bold text-rose-600">Gudang + Dapur</span>
          </div>
          <p className="text-xl font-black text-slate-900 mt-1">{formatRupiah(totalIngredientValue + totalProductValue)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Valuasi aset persediaan aktif</p>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('ingredients')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                activeTab === 'ingredients'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Stok Bahan Baku ({ingredients.length})
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                activeTab === 'products'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Stok Produk Jadi ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                activeTab === 'movements'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Kartu Mutasi Stok ({movements.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama item..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
              />
            </div>

            {activeTab !== 'movements' && (
              <select
                value={filterCondition}
                onChange={e => setFilterCondition(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
              >
                <option value="all">Semua Status</option>
                <option value="low">⚠️ Stok Menipis</option>
                <option value="safe">✅ Stok Aman</option>
              </select>
            )}
          </div>
        </div>

        {/* Tab 1: Stok Bahan Baku */}
        {activeTab === 'ingredients' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                  <th className="py-3 px-4">Bahan Baku</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Stok Saat Ini</th>
                  <th className="py-3 px-4">Batas Minimum</th>
                  <th className="py-3 px-4">Harga / Satuan</th>
                  <th className="py-3 px-4">Nilai Total Stok</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIngredients.map(ing => (
                  <tr key={ing.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{ing.name}</p>
                      <p className="text-[10px] font-mono text-slate-400">{ing.code}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{ing.category_name || '-'}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {formatQuantityWithUnit(ing.stock, ing.base_unit)}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {formatQuantityWithUnit(ing.minimum_stock, ing.base_unit)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-semibold">
                      {formatRupiah(ing.price_per_unit)} / {ing.base_unit}
                    </td>
                    <td className="py-3 px-4 font-bold text-indigo-700">
                      {formatRupiah(ing.stock * ing.price_per_unit)}
                    </td>
                    <td className="py-3 px-4">
                      {ing.is_low_stock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                          <AlertTriangle className="w-3 h-3" />
                          Menipis
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                          Aman
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openAdjustModal('ingredient', ing.id)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        Sesuaikan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Stok Produk Makanan Jadi */}
        {activeTab === 'products' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                  <th className="py-3 px-4">Produk Makanan</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Stok Jadi</th>
                  <th className="py-3 px-4">Batas Minimum</th>
                  <th className="py-3 px-4">HPP Satuan</th>
                  <th className="py-3 px-4">Harga Jual</th>
                  <th className="py-3 px-4">Nilai Stok (HPP)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{p.name}</p>
                      <p className="text-[10px] font-mono text-slate-400">{p.code}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{p.category_name || '-'}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{p.stock} pcs</td>
                    <td className="py-3 px-4 text-slate-500">{p.minimum_stock} pcs</td>
                    <td className="py-3 px-4 font-semibold text-slate-600">{formatRupiah(p.hpp)}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{formatRupiah(p.selling_price)}</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">{formatRupiah(p.stock * p.hpp)}</td>
                    <td className="py-3 px-4">
                      {p.is_low_stock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                          <AlertTriangle className="w-3 h-3" />
                          Menipis
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                          Aman
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openAdjustModal('product', p.id)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        Sesuaikan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Kartu Mutasi Stok Audit Log */}
        {activeTab === 'movements' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Tipe Item</th>
                  <th className="py-3 px-4">Nama Item</th>
                  <th className="py-3 px-4">Perubahan Stok</th>
                  <th className="py-3 px-4">Stok Sebelum</th>
                  <th className="py-3 px-4">Stok Akhir</th>
                  <th className="py-3 px-4">Keterangan / Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMovements.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatDateIndo(m.created_at, true)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        m.item_type === 'ingredient'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {m.item_type === 'ingredient' ? 'Bahan Baku' : 'Produk Jadi'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{m.item_name}</td>
                    <td className="py-3 px-4">
                      <span className={`font-black ${m.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {m.quantity > 0 ? `+${m.quantity.toLocaleString('id-ID')}` : m.quantity.toLocaleString('id-ID')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{m.previous_stock.toLocaleString('id-ID')}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{m.current_stock.toLocaleString('id-ID')}</td>
                    <td className="py-3 px-4 text-slate-600">{m.notes || m.reference_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">Penyesuaian Stok (Stock Opname)</h3>
              <button onClick={() => setIsAdjustModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Item</label>
                  <select
                    value={adjustItemType}
                    onChange={e => {
                      const type = e.target.value as any;
                      setAdjustItemType(type);
                      setAdjustItemId(type === 'ingredient' ? (ingredients[0]?.id || '') : (products[0]?.id || ''));
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="ingredient">Bahan Baku</option>
                    <option value="product">Produk Jadi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Aksi</label>
                  <select
                    value={adjustType}
                    onChange={e => setAdjustType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="in">+ Tambah Stok Masuk</option>
                    <option value="out">- Kurang Stok Keluar</option>
                    <option value="set">= Set Nilai Aktual (Opname)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Item</label>
                <select
                  value={adjustItemId}
                  onChange={e => setAdjustItemId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  {adjustItemType === 'ingredient'
                    ? ingredients.map(i => (
                        <option key={i.id} value={i.id}>
                          {i.name} (Stok saat ini: {i.stock} {i.base_unit})
                        </option>
                      ))
                    : products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stok saat ini: {p.stock} pcs)
                        </option>
                      ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jumlah Penyesuaian
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={adjustQuantity}
                  onChange={e => setAdjustQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alasan / Keterangan Penyesuaian
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Stok opname akhir bulan, kemasan bocor, sample tester"
                  value={adjustNotes}
                  onChange={e => setAdjustNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingAdjust}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors"
                >
                  {submittingAdjust ? 'Menyimpan...' : 'Simpan Penyesuaian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
