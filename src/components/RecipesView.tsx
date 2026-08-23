import React, { useState, useEffect } from 'react';
import {
  ScrollText,
  Plus,
  Trash2,
  Calculator,
  Save,
  Percent,
  CheckCircle,
  HelpCircle,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Recipe, Product, Ingredient, Unit } from '../types';
import { api } from '../services/api';
import { formatRupiah, formatQuantityWithUnit, formatPercent } from '../utils/formatters';

interface RecipesViewProps {
  initialProductId?: number | null;
}

export const RecipesView: React.FC<RecipesViewProps> = ({ initialProductId }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(initialProductId || null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Target Margin Simulator State
  const [targetMarginPercent, setTargetMarginPercent] = useState<number>(50);

  // Recipe Builder Form State
  const [productionQuantity, setProductionQuantity] = useState<number>(50);
  const [packagingCost, setPackagingCost] = useState<number>(30000);
  const [laborCost, setLaborCost] = useState<number>(40000);
  const [utilityCost, setUtilityCost] = useState<number>(15000);
  const [otherCost, setOtherCost] = useState<number>(5000);
  const [notes, setNotes] = useState<string>('');

  interface FormItem {
    id?: number;
    ingredient_id: number;
    quantity: number;
    unit_id: number;
  }

  const [recipeItems, setRecipeItems] = useState<FormItem[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, iRes, uRes] = await Promise.all([
        api.getProducts(),
        api.getIngredients(),
        api.getUnits()
      ]);

      if (pRes.success) {
        setProducts(pRes.data);
        if (!selectedProductId && pRes.data.length > 0) {
          setSelectedProductId(pRes.data[0].id);
        }
      }
      if (iRes.success) setIngredients(iRes.data);
      if (uRes.success) setUnits(uRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Load recipe when selectedProductId changes
  useEffect(() => {
    if (!selectedProductId) return;

    const loadRecipe = async () => {
      try {
        const res = await api.getRecipeByProduct(selectedProductId);
        if (res.success && res.data) {
          const r = res.data;
          setProductionQuantity(r.production_quantity || 1);
          setPackagingCost(r.packaging_cost || 0);
          setLaborCost(r.labor_cost || 0);
          setUtilityCost(r.utility_cost || 0);
          setOtherCost(r.other_cost || 0);
          setNotes(r.notes || '');
          setRecipeItems(
            r.items.map(item => ({
              id: item.id,
              ingredient_id: item.ingredient_id,
              quantity: item.quantity,
              unit_id: item.unit_id
            }))
          );
        } else {
          // Default empty recipe for product
          setProductionQuantity(50);
          setPackagingCost(25000);
          setLaborCost(35000);
          setUtilityCost(15000);
          setOtherCost(5000);
          setNotes('');
          if (ingredients.length > 0) {
            setRecipeItems([
              {
                ingredient_id: ingredients[0].id,
                quantity: 1000,
                unit_id: units[0]?.id || 1
              }
            ]);
          } else {
            setRecipeItems([]);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadRecipe();
  }, [selectedProductId, ingredients.length]);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  // Calculations
  const calculatedItems = recipeItems.map(item => {
    const ing = ingredients.find(i => i.id === Number(item.ingredient_id));
    const unit = units.find(u => u.id === Number(item.unit_id));
    const conv = unit?.conversion_value || 1;
    const qtyInBaseUnit = (Number(item.quantity) || 0) * conv;
    const pricePerBase = ing?.price_per_unit || 0;
    const cost = qtyInBaseUnit * pricePerBase;

    return {
      ...item,
      ingredient: ing,
      unit,
      qtyInBaseUnit,
      pricePerBase,
      cost
    };
  });

  const totalIngredientCost = calculatedItems.reduce((sum, item) => sum + item.cost, 0);
  const totalOtherCosts = Number(packagingCost || 0) + Number(laborCost || 0) + Number(utilityCost || 0) + Number(otherCost || 0);
  const totalBatchCost = totalIngredientCost + totalOtherCosts;
  const yieldQty = Math.max(Number(productionQuantity) || 1, 1);
  const hppPerUnit = totalBatchCost / yieldQty;

  const currentSellingPrice = selectedProduct?.selling_price || 0;
  const currentProfit = currentSellingPrice - hppPerUnit;
  const currentMargin = currentSellingPrice > 0 ? (currentProfit / currentSellingPrice) * 100 : 0;

  // Target Selling Price based on target margin
  // Target Margin = (Price - HPP) / Price  =>  Price = HPP / (1 - Margin/100)
  const targetMarginFactor = 1 - (targetMarginPercent / 100);
  const suggestedSellingPrice = targetMarginFactor > 0 ? hppPerUnit / targetMarginFactor : hppPerUnit * 2;

  const handleAddItem = () => {
    if (ingredients.length === 0) return;
    setRecipeItems([
      ...recipeItems,
      {
        ingredient_id: ingredients[0].id,
        quantity: 100,
        unit_id: units[0]?.id || 1
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    const updated = [...recipeItems];
    updated.splice(index, 1);
    setRecipeItems(updated);
  };

  const handleItemChange = (index: number, field: keyof FormItem, value: any) => {
    const updated = [...recipeItems];
    updated[index] = { ...updated[index], [field]: value };
    setRecipeItems(updated);
  };

  const handleSaveRecipe = async () => {
    if (!selectedProductId) {
      setErrorMessage('Pilih produk terlebih dahulu.');
      return;
    }
    if (recipeItems.length === 0) {
      setErrorMessage('Resep harus memiliki minimal 1 bahan baku.');
      return;
    }

    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const payload = {
        product_id: selectedProductId,
        production_quantity: yieldQty,
        packaging_cost: Number(packagingCost) || 0,
        labor_cost: Number(laborCost) || 0,
        utility_cost: Number(utilityCost) || 0,
        other_cost: Number(otherCost) || 0,
        notes,
        items: recipeItems.map(item => ({
          ingredient_id: Number(item.ingredient_id),
          quantity: Number(item.quantity) || 0,
          unit_id: Number(item.unit_id)
        }))
      };

      const res = await api.saveRecipe(payload);
      if (res.success) {
        setSuccessMessage(`Resep berhasil disimpan! HPP otomatis terupdate ke ${formatRupiah(res.hpp_per_unit)}/unit.`);
        loadData();
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage('Gagal menyimpan resep.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-rose-600" />
            <span>Kalkulator Resep &amp; HPP Otomatis</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Susun komposisi bahan baku, hitung biaya operasional, dan dapatkan HPP serta rekomendasi harga jual secara instan.
          </p>
        </div>

        {/* Product Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
            Pilih Menu Produk:
          </label>
          <select
            value={selectedProductId || ''}
            onChange={e => setSelectedProductId(Number(e.target.value))}
            className="px-3.5 py-2 bg-white border border-rose-300 font-bold text-xs text-rose-900 rounded-xl shadow-xs focus:ring-2 focus:ring-rose-200 outline-none"
          >
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Ingredient Composition Builder */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Ingredient Rows Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span>1. Komposisi Bahan Baku</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold">
                    {recipeItems.length} Bahan
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tentukan bahan baku dan takaran yang digunakan dalam 1 kali proses masak (batch).
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris Bahan</span>
              </button>
            </div>

            <div className="space-y-3">
              {calculatedItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Belum ada bahan baku. Klik tombol "Tambah Baris Bahan" di atas.
                </div>
              ) : (
                calculatedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                  >
                    {/* Select Ingredient */}
                    <div className="sm:col-span-5">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        Bahan Baku #{idx + 1}
                      </label>
                      <select
                        value={item.ingredient_id}
                        onChange={e => handleItemChange(idx, 'ingredient_id', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
                      >
                        {ingredients.map(ing => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} ({formatRupiah(ing.price_per_unit)}/{ing.base_unit})
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Harga: {formatRupiah(item.pricePerBase)} / {item.ingredient?.base_unit || 'gram'}
                      </p>
                    </div>

                    {/* Quantity */}
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        Jumlah Takaran
                      </label>
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        value={item.quantity}
                        onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none"
                        required
                      />
                    </div>

                    {/* Unit */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        Satuan
                      </label>
                      <select
                        value={item.unit_id}
                        onChange={e => handleItemChange(idx, 'unit_id', Number(e.target.value))}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                      >
                        {units.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.symbol}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Calculated Cost & Delete */}
                    <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-semibold">Subtotal Biaya</p>
                        <p className="text-xs font-black text-rose-700">{formatRupiah(item.cost)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Baris"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600">Total Biaya Bahan Baku (Batch):</span>
              <span className="text-sm font-extrabold text-slate-900">{formatRupiah(totalIngredientCost)}</span>
            </div>
          </div>

          {/* 2. Additional Costs & Batch Yield Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              2. Biaya Operasional &amp; Hasil Produksi (Yield)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Masukkan estimasi biaya pengemasan, tenaga kerja, gas, dan kapasitas hasil per batch masak.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hasil Produksi / Batch (pcs produk)
                </label>
                <input
                  type="number"
                  min="1"
                  value={productionQuantity}
                  onChange={e => setProductionQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-900 focus:bg-white focus:outline-none"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Contoh: Resep di atas menghasilkan 50 pouch makanan jadi.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Biaya Kemasan &amp; Stiker (Rp/batch)
                </label>
                <input
                  type="number"
                  min="0"
                  value={packagingCost}
                  onChange={e => setPackagingCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Biaya Tenaga Kerja / Tukang Masak (Rp/batch)
                </label>
                <input
                  type="number"
                  min="0"
                  value={laborCost}
                  onChange={e => setLaborCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Biaya Gas, Listrik &amp; Air (Rp/batch)
                </label>
                <input
                  type="number"
                  min="0"
                  value={utilityCost}
                  onChange={e => setUtilityCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Petunjuk Memasak / SOP Resep
              </label>
              <textarea
                placeholder="Goreng dengan api sedang selama 15 menit, campur bumbu cabai saat masih hangat..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none h-16 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live Summary & Target Margin Simulator */}
        <div className="lg:col-span-4 space-y-6">
          {/* Calculation Result Summary Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-rose-950 text-white rounded-2xl shadow-xl p-6 border border-slate-800 space-y-5">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-rose-400">
                Kalkulasi Real-time
              </span>
              <h3 className="text-base font-extrabold mt-0.5">Hasil Perhitungan HPP</h3>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Biaya Bahan Baku:</span>
                <span className="font-semibold text-white">{formatRupiah(totalIngredientCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Biaya Kemasan:</span>
                <span className="font-semibold text-white">{formatRupiah(packagingCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Biaya Tenaga Kerja:</span>
                <span className="font-semibold text-white">{formatRupiah(laborCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Biaya Listrik, Gas &amp; Lain:</span>
                <span className="font-semibold text-white">{formatRupiah(Number(utilityCost) + Number(otherCost))}</span>
              </div>
              <div className="pt-2 border-t border-slate-700 flex justify-between font-bold text-slate-200">
                <span>Total Biaya Produksi 1 Batch:</span>
                <span className="text-rose-400">{formatRupiah(totalBatchCost)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Hasil Produksi:</span>
                <span className="font-bold text-white">{yieldQty} pcs produk</span>
              </div>
            </div>

            {/* Big HPP Highlight */}
            <div className="p-4 bg-white/10 backdrop-blur rounded-xl border border-white/10 text-center">
              <span className="text-[10px] text-slate-300 uppercase tracking-wider font-bold">
                Harga Pokok Produksi (HPP) per Unit
              </span>
              <p className="text-2xl font-black text-amber-300 mt-1">
                {formatRupiah(hppPerUnit)}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                (Total Biaya Batch ÷ {yieldQty} pcs)
              </p>
            </div>

            {/* Current Selling Price Comparison */}
            <div className="p-3 bg-slate-800/80 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Harga Jual Toko:</span>
                <span className="font-bold text-white">{formatRupiah(currentSellingPrice)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Laba per Unit:</span>
                <span className={`font-bold ${currentProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatRupiah(currentProfit)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Margin Keuntungan:</span>
                <span className={`font-extrabold ${(currentMargin || 0) >= 30 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {formatPercent(currentMargin, 1)}
                </span>
              </div>
            </div>

            <button
              type="button"
              id="btn-save-recipe"
              onClick={handleSaveRecipe}
              disabled={saving}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Resep &amp; Sinkronkan HPP</span>
                </>
              )}
            </button>
          </div>

          {/* Interactive Target Margin Simulator */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-800">Simulator Harga Jual Optimal</h4>
            </div>
            <p className="text-[11px] text-slate-500">
              Geser target persentase margin keuntungan yang Anda inginkan:
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600">Target Margin:</span>
                <span className="text-rose-600 text-sm">{targetMarginPercent}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                step="5"
                value={targetMarginPercent}
                onChange={e => setTargetMarginPercent(Number(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer"
              />
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
              <p className="text-[10px] text-emerald-800 font-semibold">Rekomendasi Harga Jual:</p>
              <p className="text-lg font-black text-emerald-900 mt-0.5">
                {formatRupiah(Math.ceil(suggestedSellingPrice / 500) * 500)}
              </p>
              <p className="text-[9px] text-emerald-700 mt-0.5">
                (Dibulatkan ke kelipatan Rp 500 terdekat)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
