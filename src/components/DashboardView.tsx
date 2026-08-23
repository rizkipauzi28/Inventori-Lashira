import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Layers,
  Package,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Flame,
  PlusCircle,
  Receipt,
  ShoppingCart,
  Factory,
  RefreshCw,
  Clock,
  Sparkles,
  ArrowRight,
  Boxes,
  ChefHat,
  CheckCircle2
} from 'lucide-react';
import { DashboardStats, DashboardCharts, Ingredient, Product, User } from '../types';
import { api } from '../services/api';
import { formatRupiah, formatRupiahCompact, formatQuantityWithUnit } from '../utils/formatters';
import { AlertBanner } from './AlertBanner';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
  currentUser?: User | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [recentProductions, setRecentProductions] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, chartsRes, prodRes] = await Promise.all([
        api.getDashboardStats(period, startDate, endDate),
        api.getDashboardCharts(),
        api.getProductions().catch(() => ({ success: false, data: [] }))
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (chartsRes.success) setCharts(chartsRes);
      if (prodRes && prodRes.success && prodRes.data) {
        setRecentProductions(prodRes.data.slice(0, 5));
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const max7DayOmzet = charts ? Math.max(...charts.last7Days.map(d => d.omzet), 1) : 1;
  const maxMonthlyOmzet = charts ? Math.max(...charts.monthlyTrend.map(d => Math.max(d.omzet, d.pengeluaran)), 1) : 1;

  const daysLabelMap: Record<string, string> = {
    'Sen': 'Sen', 'Sel': 'Sel', 'Rab': 'Rab', 'Kam': 'Kam', 'Jum': 'Jum', 'Sab': 'Sab', 'Min': 'Min'
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Alert Banner for Low Stocks / Negative Margin */}
      {stats && (
        <AlertBanner
          lowIngredients={stats.alerts.lowIngredients}
          lowProducts={stats.alerts.lowProducts}
          lossMakingProducts={stats.alerts.lossMakingProducts}
          onNavigate={onNavigate}
        />
      )}

      {/* Top Header & Period Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
            Ringkasan Operasional
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Laporan finansial, stok, dan produksi Rumah Jajanan Lashira
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-2">
          <div className="inline-flex bg-white p-1 rounded-xl border border-gray-200 shadow-2xs">
            {(['today', 'week', 'month', 'year'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize cursor-pointer ${
                  period === p
                    ? 'bg-amber-500 text-slate-950 shadow-2xs font-bold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {p === 'today' ? 'Hari Ini' : p === 'week' ? 'Minggu Ini' : p === 'month' ? 'Bulan Ini' : 'Tahun Ini'}
              </button>
            ))}
          </div>

          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 shadow-2xs transition-colors cursor-pointer"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 Metric KPI Cards in Professional Polish Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Omzet */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs hover:border-gray-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
              Total Omzet
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatRupiah(stats?.omzetPeriod)}
          </p>
          <div className="text-xs text-emerald-600 mt-2 flex items-center justify-between">
            <span className="text-gray-400">Hari ini:</span>
            <span className="font-semibold text-emerald-700">{formatRupiah(stats?.omzetToday)}</span>
          </div>
        </div>

        {/* Card 2: Biaya Pokok Produksi (HPP) */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs hover:border-gray-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
              HPP Bahan Terjual
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatRupiah(stats?.hppPeriod)}
          </p>
          <div className="text-xs text-gray-500 mt-2 flex items-center justify-between">
            <span className="text-gray-400">Laba Kotor:</span>
            <span className="font-semibold text-amber-700">{formatRupiah(stats?.labaKotorPeriod)}</span>
          </div>
        </div>

        {/* Card 3: Pengeluaran Operasional */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs hover:border-gray-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
              Pengeluaran Operasional
            </span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatRupiah(stats?.pengeluaranPeriod)}
          </p>
          <div className="text-xs text-gray-500 mt-2 flex items-center justify-between">
            <span className="text-gray-400">Hari ini:</span>
            <span className="font-semibold text-rose-700">{formatRupiah(stats?.pengeluaranToday)}</span>
          </div>
        </div>

        {/* Card 4: Laba Bersih */}
        <div className={`p-5 rounded-xl border shadow-xs transition-all ${
          (stats?.labaBersihPeriod || 0) >= 0
            ? 'bg-white border-emerald-200/80 hover:border-emerald-300'
            : 'bg-white border-rose-200/80 hover:border-rose-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Laba Bersih (Net)
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              (stats?.labaBersihPeriod || 0) >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {(stats?.labaBersihPeriod || 0) >= 0 ? 'PROFIT' : 'DEFISIT'}
            </span>
          </div>
          <p className={`text-2xl font-bold mt-2 ${
            (stats?.labaBersihPeriod || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
          }`}>
            {formatRupiah(stats?.labaBersihPeriod)}
          </p>
          <div className="text-xs mt-2 flex items-center justify-between">
            <span className="text-gray-400">Hari ini:</span>
            <span className={`font-semibold ${
              (stats?.labaBersihToday || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {formatRupiah(stats?.labaBersihToday)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: 7-Day Sales Trend & Critical Stock Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart (Col 1-2) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-xs p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-gray-800 text-base">Tren Penjualan 7 Hari Terakhir</h3>
              <p className="text-xs text-gray-400">Total omzet harian Rumah Jajanan Lashira</p>
            </div>
            <button
              onClick={() => onNavigate('reports')}
              className="text-amber-600 text-xs font-semibold hover:underline cursor-pointer"
            >
              Lihat Laporan Detail →
            </button>
          </div>

          {/* Bar Chart Representation */}
          <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2">
            {charts?.last7Days && charts.last7Days.length > 0 ? (
              charts.last7Days.map((item, idx) => {
                const heightPercent = max7DayOmzet > 0 ? (item.omzet / max7DayOmzet) * 100 : 0;
                const isLast = idx === charts.last7Days.length - 1;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded shadow-xs whitespace-nowrap">
                      {formatRupiahCompact(item.omzet)}
                    </div>
                    <div className="w-full bg-gray-100 rounded-t-lg h-full flex items-end overflow-hidden">
                      <div
                        style={{ height: `${Math.max(heightPercent, 6)}%` }}
                        className={`w-full rounded-t-lg transition-all duration-300 ${
                          isLast || heightPercent > 70
                            ? 'bg-amber-500 hover:bg-amber-600'
                            : 'bg-amber-200 hover:bg-amber-300'
                        }`}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-gray-500 uppercase">{item.label}</span>
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                Belum ada data penjualan tercatat dalam 7 hari terakhir.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Hari Puncak / Aktif
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-200" />
                Omzet Harian
              </span>
            </div>
            <span className="text-gray-400">Mata Uang: IDR (Rp)</span>
          </div>
        </div>

        {/* Critical Stock & Shopping Needs (Col 3) */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 text-base">Stok Kritis / Butuh Belanja</h3>
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                {(stats?.alerts.lowIngredients.length || 0) + (stats?.alerts.lowProducts.length || 0)} Item
              </span>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-64 pr-1">
              {stats?.alerts.lowIngredients && stats.alerts.lowIngredients.length > 0 ? (
                stats.alerts.lowIngredients.map((ing) => (
                  <div
                    key={ing.id}
                    className="flex items-center justify-between p-3 bg-red-50/70 border-l-4 border-red-500 rounded-lg"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-gray-800">{ing.name}</h4>
                      <p className="text-[11px] text-red-600">
                        Sisa: <span className="font-bold">{formatQuantityWithUnit(ing.stock, ing.unit_symbol)}</span> (Min: {formatQuantityWithUnit(ing.min_stock, ing.unit_symbol)})
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigate('ingredients')}
                      className="text-[10px] bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer"
                    >
                      Beli
                    </button>
                  </div>
                ))
              ) : null}

              {stats?.alerts.lowProducts && stats.alerts.lowProducts.length > 0 ? (
                stats.alerts.lowProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="flex items-center justify-between p-3 bg-amber-50/70 border-l-4 border-amber-500 rounded-lg"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-gray-800">{prod.name}</h4>
                      <p className="text-[11px] text-amber-700">
                        Sisa: <span className="font-bold">{prod.stock} pcs</span> (Min: {prod.min_stock} pcs)
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigate('production')}
                      className="text-[10px] bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer"
                    >
                      Produksi
                    </button>
                  </div>
                ))
              ) : null}

              {(!stats?.alerts.lowIngredients || stats.alerts.lowIngredients.length === 0) &&
               (!stats?.alerts.lowProducts || stats.alerts.lowProducts.length === 0) && (
                <div className="py-10 text-center text-xs text-gray-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
                  Semua stok bahan baku dan produk dalam batas aman.
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('stock')}
            className="w-full mt-4 text-center text-xs text-gray-600 hover:text-gray-900 font-semibold py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            Lihat Semua Inventaris Bahan & Produk →
          </button>
        </div>
      </div>

      {/* Recent Production History Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 text-sm sm:text-base">Catatan Produksi Terkini</h3>
          <button
            onClick={() => onNavigate('production')}
            className="text-amber-600 text-xs sm:text-sm font-semibold hover:underline cursor-pointer"
          >
            + Produksi Makanan Baru
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-[11px] uppercase text-gray-400 font-bold border-b border-gray-100">
                <th className="px-6 py-3">Waktu / Tanggal</th>
                <th className="px-6 py-3">Produk Makanan</th>
                <th className="px-6 py-3 text-right">Jumlah Produksi</th>
                <th className="px-6 py-3 text-right">Total Biaya Bahan</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
              {recentProductions.length > 0 ? (
                recentProductions.map((prod) => (
                  <tr key={prod.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-6 py-3 text-gray-500 font-medium">
                      {new Date(prod.production_date || prod.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-3 font-semibold text-gray-800">
                      {prod.product_name || 'Produk Makanan'}
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-gray-700">
                      {prod.quantity_produced} pcs
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-gray-900">
                      {formatRupiah(prod.total_cost)}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        SELESAI
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-xs text-gray-400">
                    Belum ada riwayat produksi tercatat. Klik "+ Produksi Makanan Baru" untuk memulai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

