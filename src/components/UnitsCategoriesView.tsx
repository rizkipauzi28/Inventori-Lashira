import React, { useState, useEffect } from 'react';
import { Plus, Boxes, Layers, Truck, Trash2, CheckCircle, X } from 'lucide-react';
import { Unit, Category, Supplier } from '../types';
import { api } from '../services/api';

export const UnitsCategoriesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'units' | 'categories' | 'suppliers'>('units');
  const [units, setUnits] = useState<Unit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // New Unit Form
  const [newUnit, setNewUnit] = useState({ name: '', symbol: '', base_unit: 'gram', conversion_value: 1000 });
  // New Category Form
  const [newCategory, setNewCategory] = useState({ name: '', type: 'ingredient' as 'ingredient' | 'product' });
  // New Supplier Form
  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', address: '', notes: '' });

  const [message, setMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [uRes, cRes, sRes] = await Promise.all([
        api.getUnits(),
        api.getCategories(),
        api.getSuppliers()
      ]);
      if (uRes.success) setUnits(uRes.data);
      if (cRes.success) setCategories(cRes.data);
      if (sRes.success) setSuppliers(sRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnit.name || !newUnit.symbol) return;
    const res = await api.createUnit(newUnit);
    if (res.success) {
      setMessage('Satuan berhasil ditambahkan!');
      setNewUnit({ name: '', symbol: '', base_unit: 'gram', conversion_value: 1000 });
      loadData();
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name) return;
    const res = await api.createCategory(newCategory);
    if (res.success) {
      setMessage('Kategori berhasil ditambahkan!');
      setNewCategory({ name: '', type: 'ingredient' });
      loadData();
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name) return;
    const res = await api.createSupplier(newSupplier);
    if (res.success) {
      setMessage('Supplier berhasil ditambahkan!');
      setNewSupplier({ name: '', phone: '', address: '', notes: '' });
      loadData();
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Boxes className="w-5 h-5 text-rose-600" />
          <span>Master Satuan, Kategori &amp; Supplier</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Kelola master satuan konversi (kg, gram, liter, ml, pcs), kategori bahan/produk, dan kontak supplier bahan.
        </p>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('units')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'units'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Master Satuan ({units.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'categories'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Master Kategori ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'suppliers'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Master Supplier ({suppliers.length})
        </button>
      </div>

      {/* 1. Master Satuan Tab */}
      {activeTab === 'units' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs h-fit">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Tambah Satuan Baru</h3>
            <form onSubmit={handleAddUnit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Satuan</label>
                <input
                  type="text"
                  placeholder="Contoh: Kilogram, Pack, Liter"
                  value={newUnit.name}
                  onChange={e => setNewUnit({ ...newUnit, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Simbol / Singkatan</label>
                <input
                  type="text"
                  placeholder="Contoh: kg, ltr, pck, bal"
                  value={newUnit.symbol}
                  onChange={e => setNewUnit({ ...newUnit, symbol: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Satuan Dasar Turunan</label>
                <select
                  value={newUnit.base_unit}
                  onChange={e => setNewUnit({ ...newUnit, base_unit: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                >
                  <option value="gram">gram (g)</option>
                  <option value="ml">mililiter (ml)</option>
                  <option value="pcs">pieces (pcs)</option>
                  <option value="lembar">lembar</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nilai Konversi ke Satuan Dasar
                </label>
                <input
                  type="number"
                  min="1"
                  value={newUnit.conversion_value}
                  onChange={e => setNewUnit({ ...newUnit, conversion_value: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  1 {newUnit.symbol || 'satuan'} = {newUnit.conversion_value} {newUnit.base_unit}
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Simpan Satuan
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Daftar Satuan Aktif</h3>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Nama Satuan</th>
                  <th className="py-3 px-4">Simbol</th>
                  <th className="py-3 px-4">Satuan Dasar</th>
                  <th className="py-3 px-4">Nilai Konversi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {units.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3 px-4 font-mono text-rose-600 font-bold">{u.symbol}</td>
                    <td className="py-3 px-4">{u.base_unit}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      1 {u.symbol} = {u.conversion_value.toLocaleString('id-ID')} {u.base_unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Master Kategori Tab */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs h-fit">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Tambah Kategori Baru</h3>
            <form onSubmit={handleAddCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kategori</label>
                <input
                  type="text"
                  placeholder="Contoh: Bumbu & Rempah, Baso Goreng"
                  value={newCategory.name}
                  onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Kategori</label>
                <select
                  value={newCategory.type}
                  onChange={e => setNewCategory({ ...newCategory, type: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                >
                  <option value="ingredient">Kategori Bahan Baku</option>
                  <option value="product">Kategori Produk Makanan Jadi</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Simpan Kategori
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Daftar Kategori</h3>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Nama Kategori</th>
                  <th className="py-3 px-4">Tipe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.type === 'ingredient'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {c.type === 'ingredient' ? 'Bahan Baku' : 'Produk Jadi'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Master Supplier Tab */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs h-fit">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Tambah Supplier Baru</h3>
            <form onSubmit={handleAddSupplier} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Supplier / Toko</label>
                <input
                  type="text"
                  placeholder="Contoh: Toko Rempah Nusantara"
                  value={newSupplier.name}
                  onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">No. Telepon / WhatsApp</label>
                <input
                  type="text"
                  placeholder="0812-xxxx-xxxx"
                  value={newSupplier.phone}
                  onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Supplier</label>
                <textarea
                  placeholder="Pasar Induk Gedebage, Bandung"
                  value={newSupplier.address}
                  onChange={e => setNewSupplier({ ...newSupplier, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none h-16 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Simpan Supplier
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Daftar Supplier</h3>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Nama Supplier</th>
                  <th className="py-3 px-4">Kontak / Telepon</th>
                  <th className="py-3 px-4">Alamat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                    <td className="py-3 px-4 text-slate-600">{s.phone || '-'}</td>
                    <td className="py-3 px-4 text-slate-500">{s.address || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
