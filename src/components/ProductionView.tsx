import React, { useState, useEffect } from 'react';
import {
  Factory,
  Plus,
  Search,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  Eye,
  X,
  Layers,
  ArrowRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { Production, Product, Recipe, Ingredient, User } from '../types';
import { api } from '../services/api';
import { formatRupiah, formatQuantityWithUnit, formatDateIndo, exportToExcel, exportToPDF } from '../utils/formatters';

interface ProductionViewProps {
  currentUser: User | null;
}

export const ProductionView: React.FC<ProductionViewProps> = ({ currentUser }) => {
  const [productions, setProductions] = useState<Production[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  // New Production Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [quantityToProduce, setQuantityToProduce] = useState<number>(50);
  const [productionDate, setProductionDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form Warning / Insufficient Stock
  const [insufficientStockList, setInsufficientStockList] = useState<any[]>([]);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Detail Modal
  const [selectedProduction, setSelectedProduction] = useState<Production | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, pRes, iRes, rRes] = await Promise.all([
        api.getProductions(),
        api.getProducts(),
        api.getIngredients(),
        api.getRecipes()
      ]);

      if (prodRes.success) setProductions(prodRes.data);
      if (pRes.success) {
        setProducts(pRes.data);
        if (pRes.data.length > 0 && !selectedProductId) {
          setSelectedProductId(pRes.data[0].id);
        }
      }
      if (iRes.success) setIngredients(iRes.data);
      if (rRes.success) setRecipes(rRes.data);
    } catch (err) {
      console.error('Error loading production data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentRecipe = recipes.find(r => r.product_id === Number(selectedProductId));
  const currentProduct = products.find(p => p.id === Number(selectedProductId));

  // Compute live ingredient requirement based on quantityToProduce
  const batchYield = currentRecipe?.production_quantity || 1;
  const multiplier = (Number(quantityToProduce) || 0) / batchYield;

  const requiredIngredients = currentRecipe?.items.map(item => {
    const ing = ingredients.find(i => i.id === item.ingredient_id);
    const unitConv = item.unit_symbol === 'kg' || item.unit_symbol === 'ltr' ? 1000 : 1;
    const requiredInBase = item.quantity * unitConv * multiplier;
    const currentStock = ing?.stock || 0;
    const isSufficient = currentStock >= requiredInBase;

    return {
      ingredient_id: item.ingredient_id,
      name: ing?.name || item.ingredient_name || 'Bahan',
      requiredInBase,
      currentStock,
      isSufficient,
      baseUnit: ing?.base_unit || 'gram',
      cost: requiredInBase * (ing?.price_per_unit || 0)
    };
  }) || [];

  const allIngredientsSufficient = requiredIngredients.every(i => i.isSufficient);

  // Live costs
  const totalIngredientCost = requiredIngredients.reduce((sum, i) => sum + i.cost, 0);
  const packagingCost = (currentRecipe?.packaging_cost || 0) * multiplier;
  const laborCost = (currentRecipe?.labor_cost || 0) * multiplier;
  const utilityCost = (currentRecipe?.utility_cost || 0) * multiplier;
  const otherCost = (currentRecipe?.other_cost || 0) * multiplier;
  const totalProductionCost = totalIngredientCost + packagingCost + laborCost + utilityCost + otherCost;
  const hppPerUnit = (Number(quantityToProduce) || 1) > 0 ? totalProductionCost / Number(quantityToProduce) : 0;

  const openNewProductionModal = () => {
    setQuantityToProduce(currentRecipe?.production_quantity || 50);
    setProductionDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setFormError('');
    setInsufficientStockList([]);
    setIsModalOpen(true);
  };

  const handleCreateProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      setFormError('Pilih produk makanan.');
      return;
    }
    if (!currentRecipe) {
      setFormError('Produk ini belum memiliki resep. Silakan buat resep terlebih dahulu.');
      return;
    }
    if (!allIngredientsSufficient) {
      setFormError('Stok bahan baku tidak mencukupi untuk jumlah produksi ini.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const res = await api.createProduction({
        product_id: Number(selectedProductId),
        quantity: Number(quantityToProduce),
        production_date: productionDate,
        notes,
        created_by: currentUser?.id || 1,
        created_by_name: currentUser?.name || 'Admin'
      });

      if (res.success) {
        setIsModalOpen(false);
        setSuccessMessage(`Produksi ${quantityToProduce} pcs ${currentProduct?.name} berhasil disimpan! Stok bahan telah dikurangi dan stok makanan jadi telah bertambah.`);
        loadData();
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setFormError(res.message);
        if (res.insufficientIngredients) {
          setInsufficientStockList(res.insufficientIngredients);
        }
      }
    } catch (err: any) {
      setFormError('Gagal mencatat produksi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportExcel = () => {
    const data = productions.map(p => ({
      'No. Produksi': p.production_number,
      'Tanggal': p.production_date,
      'Produk': p.product_name,
      'Jumlah (pcs)': p.quantity,
      'Biaya Bahan': p.ingredient_cost,
      'Biaya Kemasan': p.packaging_cost,
      'Biaya Tenaga': p.labor_cost,
      'Total Biaya': p.total_cost,
      'HPP Aktual / Unit': Math.round(p.hpp_per_unit),
      'Petugas': p.created_by_name
    }));
    exportToExcel(data, 'Riwayat_Produksi_Lashira');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Factory className="w-5 h-5 text-rose-600" />
            <span>Pencatatan Produksi Makanan Jadi</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Catat hasil olahan dapur, kurangi stok bahan baku secara otomatis, dan tambahkan stok makanan jadi.
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
            id="btn-create-production"
            onClick={openNewProductionModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Produksi Baru</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Production History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Riwayat Produksi Makanan</h3>
          <span className="text-xs text-slate-400 font-semibold">{productions.length} Catatan</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">No. Produksi</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Produk Makanan</th>
                <th className="py-3 px-4">Jumlah Hasil</th>
                <th className="py-3 px-4">Biaya Bahan</th>
                <th className="py-3 px-4">Total Biaya</th>
                <th className="py-3 px-4">HPP per Unit</th>
                <th className="py-3 px-4">Petugas</th>
                <th className="py-3 px-4 text-right">Rincian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Memuat data produksi...
                  </td>
                </tr>
              ) : productions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Belum ada riwayat produksi makanan tercatat.
                  </td>
                </tr>
              ) : (
                productions.map(prod => (
                  <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-rose-700">
                      {prod.production_number}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {formatDateIndo(prod.production_date)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {prod.product_name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        +{prod.quantity} pcs
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-semibold">
                      {formatRupiah(prod.ingredient_cost)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {formatRupiah(prod.total_cost)}
                    </td>
                    <td className="py-3 px-4 font-bold text-rose-700">
                      {formatRupiah(prod.hpp_per_unit)}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {prod.created_by_name}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedProduction(prod)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedProduction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Rincian Produksi: {selectedProduction.production_number}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {formatDateIndo(selectedProduction.production_date)} • Oleh {selectedProduction.created_by_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedProduction(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500">Produk Dibuat:</span>
                  <p className="font-bold text-slate-900">{selectedProduction.product_name}</p>
                </div>
                <div>
                  <span className="text-slate-500">Jumlah Jadi:</span>
                  <p className="font-bold text-emerald-700">+{selectedProduction.quantity} pcs</p>
                </div>
                <div>
                  <span className="text-slate-500">Total Biaya Batch:</span>
                  <p className="font-bold text-slate-900">{formatRupiah(selectedProduction.total_cost)}</p>
                </div>
                <div>
                  <span className="text-slate-500">HPP per Unit:</span>
                  <p className="font-bold text-rose-700">{formatRupiah(selectedProduction.hpp_per_unit)}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2">Bahan Baku yang Digunakan &amp; Dikurangi:</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2 px-3">Bahan Baku</th>
                        <th className="py-2 px-3 text-right">Kuantitas Terpakai</th>
                        <th className="py-2 px-3 text-right">Subtotal Biaya</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedProduction.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-semibold text-slate-800">{it.ingredient_name}</td>
                          <td className="py-2 px-3 text-right text-rose-700 font-bold">
                            -{it.quantity_used.toLocaleString('id-ID')} {it.unit_symbol}
                          </td>
                          <td className="py-2 px-3 text-right font-medium">{formatRupiah(it.cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedProduction.notes && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                  <span className="font-bold">Catatan: </span>
                  <span>{selectedProduction.notes}</span>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedProduction(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Production Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Catat Produksi Dapur Baru</h3>
                <p className="text-[11px] text-slate-500">
                  Sistem akan memvalidasi kecukupan stok bahan dan memotong inventaris otomatis.
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduction} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pilih Produk yang Dimasak
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                    required
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.has_recipe ? 'Ada Resep' : 'Belum Ada Resep'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Produksi
                  </label>
                  <input
                    type="date"
                    value={productionDate}
                    onChange={e => setProductionDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jumlah yang Diproduksi (pcs makanan jadi)
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantityToProduce}
                  onChange={e => setQuantityToProduce(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-rose-200 rounded-xl text-xs font-black text-rose-900 focus:bg-white focus:outline-none text-base"
                  required
                />
              </div>

              {/* Required Ingredients Validation Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-rose-600" />
                    <span>Kebutuhan Bahan Baku &amp; Validasi Stok:</span>
                  </label>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    allIngredientsSufficient ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {allIngredientsSufficient ? '✅ Stok Bahan Mencukupi' : '❌ Ada Bahan Kurang'}
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2 px-3">Bahan Baku</th>
                        <th className="py-2 px-3">Dibutuhkan</th>
                        <th className="py-2 px-3">Stok Gudang</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {requiredIngredients.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-slate-400 text-xs">
                            Produk ini belum memiliki resep. Harap buat resep terlebih dahulu.
                          </td>
                        </tr>
                      ) : (
                        requiredIngredients.map((item, idx) => (
                          <tr key={idx} className={item.isSufficient ? '' : 'bg-rose-50/70'}>
                            <td className="py-2 px-3 font-semibold text-slate-800">{item.name}</td>
                            <td className="py-2 px-3 font-bold text-slate-900">
                              {item.requiredInBase.toLocaleString('id-ID')} {item.baseUnit}
                            </td>
                            <td className="py-2 px-3 text-slate-600">
                              {item.currentStock.toLocaleString('id-ID')} {item.baseUnit}
                            </td>
                            <td className="py-2 px-3">
                              {item.isSufficient ? (
                                <span className="text-emerald-700 font-bold text-[10px]">Cukup</span>
                              ) : (
                                <span className="text-rose-700 font-bold text-[10px]">
                                  Kurang {(item.requiredInBase - item.currentStock).toLocaleString('id-ID')} {item.baseUnit}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cost Summary */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Biaya Bahan Baku:</span>
                  <span className="font-semibold">{formatRupiah(totalIngredientCost)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Biaya Kemasan &amp; Operasional:</span>
                  <span className="font-semibold">{formatRupiah(packagingCost + laborCost + utilityCost + otherCost)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Total Biaya Produksi:</span>
                  <span className="text-rose-700">{formatRupiah(totalProductionCost)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900">
                  <span>HPP Aktual per Unit:</span>
                  <span className="text-emerald-700">{formatRupiah(hppPerUnit)} / pcs</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Batch / Shift
                </label>
                <textarea
                  placeholder="Keterangan produksi (misal: Batch pagi, tingkat kerenyahan maksimal)..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none h-14 resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || !allIngredientsSufficient || requiredIngredients.length === 0}
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan & Potong Stok Bahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
