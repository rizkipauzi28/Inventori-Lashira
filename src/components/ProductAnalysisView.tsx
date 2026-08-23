import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Award,
  Sparkles,
  PieChart,
  ShoppingBag,
  Calculator,
  ArrowRight,
  ShieldAlert,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { Product, Recipe, Ingredient } from '../types';
import { api } from '../services/api';
import { formatRupiah, formatPercent, formatQuantityWithUnit, exportToExcel } from '../utils/formatters';

export const ProductAnalysisView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  // Forecasting State: product_id -> target quantity
  const [forecastTargets, setForecastTargets] = useState<{ [productId: number]: number }>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, rRes, iRes] = await Promise.all([
        api.getProducts(),
        api.getRecipes(),
        api.getIngredients()
      ]);
      if (pRes.success) {
        setProducts(pRes.data);
        // Initialize forecast targets with 100 pcs each for first 3 products
        const initialTargets: { [productId: number]: number } = {};
        pRes.data.forEach((p, idx) => {
          initialTargets[p.id] = idx < 3 ? 100 : 0;
        });
        setForecastTargets(initialTargets);
      }
      if (rRes.success) setRecipes(rRes.data);
      if (iRes.success) setIngredients(iRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper for margin percentage
  const getMarginVal = (p: Product) => {
    if (p.margin_percent !== undefined && p.margin_percent !== null) return p.margin_percent;
    if (p.margin_percentage !== undefined && p.margin_percentage !== null) return p.margin_percentage;
    if (p.hpp > 0 && p.selling_price > 0) return ((p.selling_price - p.hpp) / p.hpp) * 100;
    return 0;
  };

  const getProfitVal = (p: Product) => {
    if (p.profit_per_unit !== undefined && p.profit_per_unit !== null) return p.profit_per_unit;
    if (p.profit_nominal !== undefined && p.profit_nominal !== null) return p.profit_nominal;
    return (p.selling_price || 0) - (p.hpp || 0);
  };

  // Top Selling Products
  const topSelling = [...products].sort((a, b) => (b.total_sold || 0) - (a.total_sold || 0));

  // Top Margin Products
  const topMargin = [...products].sort((a, b) => getMarginVal(b) - getMarginVal(a));

  // Calculate Forecast Requirements
  const forecastMap: {
    [ingredientId: number]: {
      ingredient: Ingredient | undefined;
      totalRequiredBase: number;
      estimatedCost: number;
    };
  } = {};

  Object.entries(forecastTargets).forEach(([productIdStr, targetQty]) => {
    const pId = Number(productIdStr);
    const qty = Number(targetQty) || 0;
    if (qty <= 0) return;

    const r = recipes.find(rec => rec.product_id === pId);
    if (!r) return;

    const batchYield = r.production_quantity || 1;
    const batchMultiplier = qty / batchYield;

    r.items.forEach(it => {
      const ing = ingredients.find(i => i.id === it.ingredient_id);
      const unitConv = it.unit_symbol === 'kg' || it.unit_symbol === 'ltr' ? 1000 : 1;
      const baseRequired = it.quantity * unitConv * batchMultiplier;

      if (!forecastMap[it.ingredient_id]) {
        forecastMap[it.ingredient_id] = {
          ingredient: ing,
          totalRequiredBase: 0,
          estimatedCost: 0
        };
      }

      forecastMap[it.ingredient_id].totalRequiredBase += baseRequired;
      forecastMap[it.ingredient_id].estimatedCost += baseRequired * (ing?.price_per_unit || 0);
    });
  });

  const forecastResults = Object.values(forecastMap);
  const totalForecastBudget = forecastResults.reduce((sum, f) => sum + f.estimatedCost, 0);

  const handleExportForecast = () => {
    const data = forecastResults.map(f => ({
      'Bahan Baku': f.ingredient?.name || 'Bahan',
      'Total Kebutuhan': Math.round(f.totalRequiredBase),
      'Satuan': f.ingredient?.base_unit || 'gram',
      'Stok Gudang Saat Ini': f.ingredient?.stock || 0,
      'Perlu Belanja Tambahan': Math.max(0, Math.round(f.totalRequiredBase - (f.ingredient?.stock || 0))),
      'Estimasi Anggaran Pembelian': Math.round(f.estimatedCost)
    }));
    exportToExcel(data, 'Estimasi_Kebutuhan_Bahan_Baku');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-rose-600" />
            <span>Analisis Produk &amp; Peramalan Kebutuhan Bahan (Forecasting)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluasi profitabilitas setiap jajanan dan hitung estimasi belanja bahan baku berdasarkan target produksi masa depan.
          </p>
        </div>
      </div>

      {/* Top 2 Rankings: Terlaris & Margin Tertinggi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking 1: Terlaris */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Peringkat Produk Terlaris (Volume Penjualan)</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Top Performers</span>
          </div>

          <div className="space-y-3">
            {topSelling.slice(0, 5).map((p, idx) => (
              <div
                key={p.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                    idx === 0 ? 'bg-amber-400 text-amber-950 shadow-xs' : idx === 1 ? 'bg-slate-300 text-slate-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{p.name}</h4>
                    <p className="text-[10px] text-slate-500">
                      Harga Jual: {formatRupiah(p.selling_price)} • HPP: {formatRupiah(p.hpp)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs font-extrabold text-emerald-700">
                    {p.total_sold} pcs terjual
                  </p>
                  <p className="text-[10px] font-semibold text-slate-600">
                    Laba: {formatRupiah(p.profit_per_unit * p.total_sold)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ranking 2: Margin Tertinggi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-600" />
              <span>Peringkat Margin Keuntungan (%) Tertinggi</span>
            </h3>
            <span className="text-[10px] font-bold text-emerald-600 uppercase">Profit Leader</span>
          </div>

          <div className="space-y-3">
            {topMargin.slice(0, 5).map((p, idx) => (
              <div
                key={p.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{p.name}</h4>
                    <p className="text-[10px] text-slate-500">
                      Laba per pcs: {formatRupiah(getProfitVal(p))}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-xs font-black">
                    {formatPercent(getMarginVal(p), 1)} Margin
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Simulator Peramalan Kebutuhan Bahan Baku (Forecasting) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-rose-600" />
              <span>Kalkulator Peramalan Pembelian Bahan Baku</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Masukkan target produksi yang ingin dibuat, sistem akan otomatis menjabarkan total kg bahan yang perlu dibeli ke supplier.
            </p>
          </div>

          <button
            onClick={handleExportForecast}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Rencana Belanja</span>
          </button>
        </div>

        {/* Input Target Produksi per Produk */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            Tentukan Target Jumlah Produksi Masa Depan (pcs):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {products.map(p => (
              <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 truncate flex-1">{p.name}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={forecastTargets[p.id] || 0}
                    onChange={e => setForecastTargets({ ...forecastTargets, [p.id]: Number(e.target.value) })}
                    className="w-20 px-2 py-1 text-right bg-white border border-slate-300 rounded-lg text-xs font-black text-rose-700"
                  />
                  <span className="text-[10px] text-slate-500 font-semibold">pcs</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Forecast Output Table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-800">
              Hasil Rekomendasi Kebutuhan Belanja Bahan Mentah:
            </h4>
            <span className="text-xs font-black text-rose-700">
              Estimasi Anggaran Belanja: {formatRupiah(totalForecastBudget)}
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Bahan Baku</th>
                  <th className="py-2.5 px-3">Total Kebutuhan</th>
                  <th className="py-2.5 px-3">Stok Gudang Saat Ini</th>
                  <th className="py-2.5 px-3">Kekurangan / Perlu Dibeli</th>
                  <th className="py-2.5 px-3 text-right">Estimasi Biaya Beli</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {forecastResults.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                      Masukkan target produksi di atas untuk melihat kalkulasi kebutuhan bahan baku.
                    </td>
                  </tr>
                ) : (
                  forecastResults.map((f, idx) => {
                    const deficit = Math.max(0, f.totalRequiredBase - (f.ingredient?.stock || 0));
                    return (
                      <tr key={idx} className={deficit > 0 ? 'bg-amber-50/40' : ''}>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{f.ingredient?.name}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">
                          {formatQuantityWithUnit(f.totalRequiredBase, f.ingredient?.base_unit || 'gram')}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {formatQuantityWithUnit(f.ingredient?.stock || 0, f.ingredient?.base_unit || 'gram')}
                        </td>
                        <td className="py-2.5 px-3">
                          {deficit > 0 ? (
                            <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                              Kurang {formatQuantityWithUnit(deficit, f.ingredient?.base_unit || 'gram')}
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-semibold">Stok Aman</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-slate-900">
                          {formatRupiah(f.estimatedCost)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
