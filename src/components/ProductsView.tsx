import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Package,
  Edit2,
  Trash2,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  X,
  ScrollText,
  Upload,
  Percent,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';
import { Product, Category } from '../types';
import { api } from '../services/api';
import { formatRupiah, formatPercent, exportToExcel, exportToPDF } from '../utils/formatters';

interface ProductsViewProps {
  onNavigateToRecipe: (productId: number) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ onNavigateToRecipe }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category_id: '',
    description: '',
    image: '',
    selling_price: 15000,
    hpp: 8000,
    stock: 20,
    minimum_stock: 10,
    status: 'active'
  });

  const [formError, setFormError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        api.getProducts(),
        api.getCategories('product')
      ]);
      if (pRes.success) setProducts(pRes.data);
      if (cRes.success) setCategories(cRes.data);
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    const nextCode = `PRD-${String(products.length + 1).padStart(3, '0')}`;
    setFormData({
      code: nextCode,
      name: '',
      category_id: categories[0]?.id ? String(categories[0].id) : '4',
      description: '',
      image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=80',
      selling_price: 18000,
      hpp: 9000,
      stock: 30,
      minimum_stock: 10,
      status: 'active'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingId(p.id);
    setFormData({
      code: p.code,
      name: p.name,
      category_id: String(p.category_id),
      description: p.description || '',
      image: p.image || '',
      selling_price: p.selling_price,
      hpp: p.hpp,
      stock: p.stock,
      minimum_stock: p.minimum_stock,
      status: p.status
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const calculatedProfit = (Number(formData.selling_price) || 0) - (Number(formData.hpp) || 0);
  const calculatedMargin = formData.selling_price > 0 ? (calculatedProfit / formData.selling_price) * 100 : 0;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Nama produk wajib diisi.');
      return;
    }

    try {
      if (editingId) {
        const res = await api.updateProduct(editingId, formData);
        if (res.success) {
          setIsModalOpen(false);
          loadData();
        } else {
          setFormError(res.message);
        }
      } else {
        const res = await api.createProduct(formData);
        if (res.success) {
          setIsModalOpen(false);
          loadData();
        } else {
          setFormError(res.message);
        }
      }
    } catch (err) {
      setFormError('Gagal menyimpan produk.');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Hapus produk "${name}"?`)) {
      const res = await api.deleteProduct(id);
      if (res.success) {
        loadData();
      } else {
        alert(res.message || 'Gagal menghapus produk.');
      }
    }
  };

  const filteredProducts = products.filter(p => {
    const matchQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = categoryFilter === 'all' || String(p.category_id) === categoryFilter;
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchQuery && matchCat && matchStatus;
  });

  const handleExportExcel = () => {
    const data = filteredProducts.map(p => ({
      'Kode': p.code,
      'Nama Produk': p.name,
      'Kategori': p.category_name,
      'Harga Jual': p.selling_price,
      'HPP': p.hpp,
      'Laba Nominal': p.profit_nominal,
      'Margin (%)': formatPercent(p.margin_percentage, 1),
      'Stok (pcs)': p.stock,
      'Min Stok': p.minimum_stock,
      'Status Resep': p.has_recipe ? 'Ada Resep' : 'Belum Ada',
      'Status': p.status
    }));
    exportToExcel(data, 'Master_Produk_Lashira');
  };

  const handleExportPDF = () => {
    const headers = ['Kode', 'Nama Produk', 'Kategori', 'Harga Jual', 'HPP', 'Margin', 'Stok'];
    const rows = filteredProducts.map(p => [
      p.code,
      p.name,
      p.category_name || '-',
      formatRupiah(p.selling_price),
      formatRupiah(p.hpp),
      formatPercent(p.margin_percentage, 1),
      `${p.stock} pcs`
    ]);
    exportToPDF('Laporan Master Produk Makanan', headers, rows, 'Produk_Makanan_Lashira');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-rose-600" />
            <span>Master Produk Makanan Jadi</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola katalog produk, harga jual, keterkaitan resep HPP, keuntungan margin per produk, dan stok jadi.
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
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden md:inline">PDF</span>
          </button>
          <button
            id="btn-add-product"
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode atau nama produk..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:bg-white focus:outline-none"
          >
            <option value="all">Semua Kategori Produk</option>
            {categories.map(c => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:bg-white focus:outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Produk</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Harga Jual</th>
                <th className="py-3 px-4">HPP Satuan</th>
                <th className="py-3 px-4">Laba &amp; Margin</th>
                <th className="py-3 px-4">Stok Jadi</th>
                <th className="py-3 px-4">Resep</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Memuat data produk...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ada produk yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image || 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=100&auto=format&fit=crop&q=80'}
                          alt={p.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{p.name}</p>
                          <p className="text-[10px] font-mono text-slate-400">{p.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {p.category_name || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {formatRupiah(p.selling_price)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-600">
                      {formatRupiah(p.hpp)}
                    </td>
                    <td className="py-3 px-4">
                      <div className={`font-bold ${p.profit_nominal! >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {formatRupiah(p.profit_nominal)}
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        (p.margin_percentage || 0) >= 30
                          ? 'bg-emerald-100 text-emerald-800'
                          : (p.margin_percentage || 0) > 0
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                      }`}>
                        {formatPercent(p.margin_percentage, 1)} margin
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold ${p.is_low_stock ? 'text-rose-600' : 'text-slate-900'}`}>
                          {p.stock} pcs
                        </span>
                        {p.is_low_stock && (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" title="Stok Menipis" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">Min: {p.minimum_stock} pcs</span>
                    </td>
                    <td className="py-3 px-4">
                      {p.has_recipe ? (
                        <button
                          onClick={() => onNavigateToRecipe(p.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[11px] font-bold transition-colors"
                        >
                          <ScrollText className="w-3 h-3" />
                          <span>Lihat Resep</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onNavigateToRecipe(p.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 text-[11px] font-bold transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Buat Resep</span>
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                          title="Edit Produk"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          title="Hapus Produk"
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

      {/* Modal Add / Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">
                {editingId ? 'Edit Data Produk Makanan' : 'Tambah Produk Makanan Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kode Produk</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Produk</label>
                  <select
                    value={formData.category_id}
                    onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Produk Makanan</label>
                <input
                  type="text"
                  placeholder="Contoh: Basreng Stik Pedas Daun Jeruk (200g)"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi / Komposisi Singkat</label>
                <textarea
                  placeholder="Camilan baso goreng renyah dengan daun jeruk segar..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs h-16 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Foto Produk (URL atau Upload)</label>
                <div className="flex items-center gap-3">
                  {formData.image && (
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.selling_price}
                    onChange={e => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    HPP per Unit (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.hpp}
                    onChange={e => setFormData({ ...formData, hpp: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
                    required
                  />
                </div>
              </div>

              {/* Profit & Margin Calculator Preview */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Keuntungan / Laba Kotor per Unit:</span>
                  <span className={`font-bold ${calculatedProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {formatRupiah(calculatedProfit)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Margin Keuntungan (%):</span>
                  <span className={`font-bold ${(calculatedMargin || 0) >= 30 ? 'text-emerald-700' : 'text-slate-800'}`}>
                    {formatPercent(calculatedMargin, 1)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Stok Saat Ini (pcs)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Batas Minimum Stok (pcs)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minimum_stock}
                    onChange={e => setFormData({ ...formData, minimum_stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    required
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
                  {editingId ? 'Simpan Perubahan' : 'Tambah Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
