import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  X,
  Layers,
  ArrowUpDown,
  CheckCircle2
} from 'lucide-react';
import { Ingredient, Category, Unit, Supplier } from '../types';
import { api } from '../services/api';
import { formatRupiah, formatQuantityWithUnit, formatDateIndo, exportToExcel, exportToPDF, printElement } from '../utils/formatters';

export const IngredientsView: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all'); // all, low, normal

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category_id: '',
    unit_id: '',
    purchase_price: 0,
    purchase_quantity: 1,
    stock: 0,
    minimum_stock: 500,
    supplier_id: '',
    buy_date: new Date().toISOString().split('T')[0],
    status: 'active'
  });

  const [formError, setFormError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [ingRes, catRes, unitRes, supRes] = await Promise.all([
        api.getIngredients(),
        api.getCategories('ingredient'),
        api.getUnits(),
        api.getSuppliers()
      ]);

      if (ingRes.success) setIngredients(ingRes.data);
      if (catRes.success) setCategories(catRes.data);
      if (unitRes.success) setUnits(unitRes.data);
      if (supRes.success) setSuppliers(supRes.data);
    } catch (err) {
      console.error('Error loading ingredients data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    const nextCode = `BHN-${String(ingredients.length + 1).padStart(3, '0')}`;
    setFormData({
      code: nextCode,
      name: '',
      category_id: categories[0]?.id ? String(categories[0].id) : '1',
      unit_id: units[0]?.id ? String(units[0].id) : '1',
      purchase_price: 10000,
      purchase_quantity: 1,
      stock: 1000,
      minimum_stock: 500,
      supplier_id: suppliers[0]?.id ? String(suppliers[0].id) : '',
      buy_date: new Date().toISOString().split('T')[0],
      status: 'active'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (ing: Ingredient) => {
    setEditingId(ing.id);
    setFormData({
      code: ing.code,
      name: ing.name,
      category_id: String(ing.category_id),
      unit_id: String(ing.unit_id),
      purchase_price: ing.purchase_price,
      purchase_quantity: ing.purchase_quantity,
      stock: ing.stock,
      minimum_stock: ing.minimum_stock,
      supplier_id: ing.supplier_id ? String(ing.supplier_id) : '',
      buy_date: ing.buy_date || new Date().toISOString().split('T')[0],
      status: ing.status
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const selectedUnit = units.find(u => u.id === Number(formData.unit_id));
  const conversionVal = selectedUnit?.conversion_value || 1000;
  const baseUnitName = selectedUnit?.base_unit || 'gram';
  const totalBaseQty = (Number(formData.purchase_quantity) || 1) * conversionVal;
  const calculatedPricePerBase = totalBaseQty > 0 ? (Number(formData.purchase_price) || 0) / totalBaseQty : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Nama bahan baku wajib diisi.');
      return;
    }
    if (!formData.unit_id) {
      setFormError('Pilih satuan bahan.');
      return;
    }

    try {
      if (editingId) {
        const res = await api.updateIngredient(editingId, formData);
        if (res.success) {
          setIsModalOpen(false);
          loadData();
        } else {
          setFormError(res.message);
        }
      } else {
        const res = await api.createIngredient(formData);
        if (res.success) {
          setIsModalOpen(false);
          loadData();
        } else {
          setFormError(res.message);
        }
      }
    } catch (err: any) {
      setFormError('Gagal menyimpan data bahan.');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus bahan baku "${name}"?`)) {
      const res = await api.deleteIngredient(id);
      if (res.success) {
        loadData();
      } else {
        alert(res.message || 'Gagal menghapus bahan.');
      }
    }
  };

  const filteredIngredients = ingredients.filter(ing => {
    const matchQuery = ing.name.toLowerCase().includes(searchQuery.toLowerCase()) || ing.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = categoryFilter === 'all' || String(ing.category_id) === categoryFilter;
    const matchStock = stockFilter === 'all' 
      ? true 
      : stockFilter === 'low' 
        ? ing.is_low_stock 
        : !ing.is_low_stock;
    return matchQuery && matchCat && matchStock;
  });

  const handleExportExcel = () => {
    const data = filteredIngredients.map(ing => ({
      'Kode': ing.code,
      'Nama Bahan': ing.name,
      'Kategori': ing.category_name,
      'Satuan Beli': ing.unit_name,
      'Harga Beli': ing.purchase_price,
      'Harga per Satuan Dasar': Math.round(ing.price_per_unit),
      'Stok Saat Ini': ing.stock,
      'Satuan Dasar': ing.base_unit,
      'Stok Minimum': ing.minimum_stock,
      'Status Stok': ing.is_low_stock ? 'MENIPIS' : 'AMAN',
      'Supplier': ing.supplier_name || '-',
      'Tanggal Beli': ing.buy_date || '-'
    }));
    exportToExcel(data, 'Data_Bahan_Baku_Lashira');
  };

  const handleExportPDF = () => {
    const headers = ['Kode', 'Nama Bahan', 'Kategori', 'Harga Beli', 'Harga / Satuan', 'Stok', 'Status'];
    const rows = filteredIngredients.map(ing => [
      ing.code,
      ing.name,
      ing.category_name || '-',
      formatRupiah(ing.purchase_price),
      `${formatRupiah(ing.price_per_unit)} / ${ing.base_unit}`,
      `${ing.stock.toLocaleString('id-ID')} ${ing.base_unit}`,
      ing.is_low_stock ? 'MENIPIS' : 'AMAN'
    ]);
    exportToPDF('Laporan Master Bahan Baku', headers, rows, 'Bahan_Baku_Lashira');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-rose-600" />
            <span>Master Data Bahan Baku</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola inventaris bahan mentah, harga beli, konversi otomatis per gram/ml, dan batas stok minimum.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
            title="Download Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Excel</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
            title="Download PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden md:inline">PDF</span>
          </button>
          <button
            id="btn-add-ingredient"
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Bahan</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode atau nama bahan..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:bg-white focus:outline-none"
          >
            <option value="all">Semua Kategori Bahan</option>
            {categories.map(cat => (
              <option key={cat.id} value={String(cat.id)}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Stock Condition Filter */}
          <select
            value={stockFilter}
            onChange={e => setStockFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:bg-white focus:outline-none"
          >
            <option value="all">Semua Kondisi Stok</option>
            <option value="low">⚠️ Stok Menipis</option>
            <option value="normal">✅ Stok Aman</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden" id="printable-ingredients-table">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Kode &amp; Bahan</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Harga Beli</th>
                <th className="py-3 px-4">Harga / Satuan Dasar</th>
                <th className="py-3 px-4">Stok Saat Ini</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Memuat data bahan baku...
                  </td>
                </tr>
              ) : filteredIngredients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ada bahan baku yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredIngredients.map(ing => (
                  <tr key={ing.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{ing.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">{ing.code}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {ing.category_name || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {formatRupiah(ing.purchase_price)}
                      <span className="text-[10px] text-slate-400 font-normal ml-1">
                        / {ing.purchase_quantity} {ing.unit_symbol}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-rose-700">
                      {formatRupiah(ing.price_per_unit)}
                      <span className="text-[10px] text-slate-400 font-normal"> / {ing.base_unit}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {ing.stock.toLocaleString('id-ID')} {ing.base_unit}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Min: {ing.minimum_stock.toLocaleString('id-ID')} {ing.base_unit}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {ing.is_low_stock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                          <AlertTriangle className="w-3 h-3" />
                          Menipis
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          Aman
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {ing.supplier_name || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(ing)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                          title="Edit Bahan"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(ing.id, ing.name)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          title="Hapus Bahan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">
                {editingId ? 'Edit Data Bahan Baku' : 'Tambah Bahan Baku Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kode Bahan</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Bahan</label>
                  <select
                    value={formData.category_id}
                    onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Bahan Baku</label>
                <input
                  type="text"
                  placeholder="Contoh: Cabai Kering Giling A1, Minyak Goreng Sawit"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Satuan Beli</label>
                  <select
                    value={formData.unit_id}
                    onChange={e => setFormData({ ...formData, unit_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                  >
                    {units.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.symbol})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Kemasan Beli</label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={formData.purchase_quantity}
                    onChange={e => setFormData({ ...formData, purchase_quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Harga Beli (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.purchase_price}
                    onChange={e => setFormData({ ...formData, purchase_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Automatic Calculation Preview Box */}
              <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Faktor Konversi:</span>
                  <span className="font-semibold">{selectedUnit?.conversion_value || 1000} {baseUnitName} per {selectedUnit?.symbol}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Kuantitas Dasar Beli:</span>
                  <span className="font-semibold">{totalBaseQty.toLocaleString('id-ID')} {baseUnitName}</span>
                </div>
                <div className="flex justify-between font-bold text-rose-800 pt-1 border-t border-rose-200">
                  <span>Harga Otomatis per {baseUnitName}:</span>
                  <span className="text-sm">{formatRupiah(calculatedPricePerBase)} / {baseUnitName}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Stok Saat Ini (dalam {baseUnitName})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Batas Minimum Stok ({baseUnitName})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.minimum_stock}
                    onChange={e => setFormData({ ...formData, minimum_stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Supplier</label>
                  <select
                    value={formData.supplier_id}
                    onChange={e => setFormData({ ...formData, supplier_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                  >
                    <option value="">-- Tanpa Supplier --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Pembelian</label>
                  <input
                    type="date"
                    value={formData.buy_date}
                    onChange={e => setFormData({ ...formData, buy_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
                >
                  {editingId ? 'Simpan Perubahan' : 'Tambah Bahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
