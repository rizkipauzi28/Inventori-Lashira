import React from 'react';
import { AlertTriangle, AlertCircle, TrendingDown, ArrowRight } from 'lucide-react';
import { Ingredient, Product } from '../types';
import { formatQuantityWithUnit } from '../utils/formatters';

interface AlertBannerProps {
  lowIngredients?: Ingredient[];
  lowProducts?: Product[];
  lossMakingProducts?: Product[];
  lowStockIngredients?: Ingredient[];
  lowStockProducts?: Product[];
  onNavigate: (view: string) => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  lowIngredients = [],
  lowProducts = [],
  lossMakingProducts = [],
  lowStockIngredients,
  lowStockProducts,
  onNavigate
}) => {
  const ingredients = lowStockIngredients || lowIngredients;
  const products = lowStockProducts || lowProducts;

  if (ingredients.length === 0 && products.length === 0 && lossMakingProducts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      {/* Low Ingredients Alert */}
      {ingredients.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border-l-4 border-amber-500 text-amber-900 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950">
                Peringatan: {ingredients.length} Bahan Baku Menipis / Kritis!
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Bahan berikut berada di bawah stok minimum:{' '}
                <span className="font-semibold">
                  {ingredients.slice(0, 3).map(i => `${i.name} (${formatQuantityWithUnit(i.stock, i.unit_symbol)})`).join(', ')}
                  {ingredients.length > 3 ? ` dan ${ingredients.length - 3} lainnya.` : '.'}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('ingredients')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors shrink-0 self-start md:self-auto cursor-pointer"
          >
            <span>Restock Bahan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Low Product Stocks Alert */}
      {products.length > 0 && (
        <div className="p-4 rounded-xl bg-red-50 border-l-4 border-red-500 text-red-900 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-red-100 text-red-700 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-red-950">
                Peringatan: {products.length} Produk Jadi Stok Menipis!
              </h4>
              <p className="text-xs text-red-800 mt-0.5">
                Stok produk makanan berikut hampir habis:{' '}
                <span className="font-semibold">
                  {products.slice(0, 3).map(p => `${p.name} (Sisa: ${p.stock} pcs)`).join(', ')}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('production')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors shrink-0 self-start md:self-auto cursor-pointer"
          >
            <span>Buat Produksi Baru</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Loss Making Products Alert */}
      {lossMakingProducts.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-50 border-l-4 border-rose-500 text-rose-900 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-950">
                Peringatan: {lossMakingProducts.length} Produk Mengalami Kerugian (Harga Jual &lt; HPP)!
              </h4>
              <p className="text-xs text-rose-800 mt-0.5">
                Produk <span className="font-semibold">{lossMakingProducts.map(p => p.name).join(', ')}</span> memiliki harga jual di bawah biaya pokok produksi.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('recipes')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors shrink-0 self-start md:self-auto cursor-pointer"
          >
            <span>Sesuaikan HPP / Harga</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

