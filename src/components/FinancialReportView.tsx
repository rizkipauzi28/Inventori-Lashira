import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileSpreadsheet,
  Printer,
  FileText,
  Filter,
  PieChart as PieIcon,
  BarChart3,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Receipt
} from 'lucide-react';
import { FinancialReport, AppSettings } from '../types';
import { api } from '../services/api';
import { formatRupiah, formatDateIndo, formatPercent, exportToExcel, exportToPDF } from '../utils/formatters';

interface FinancialReportViewProps {
  settings: AppSettings | null;
}

export const FinancialReportView: React.FC<FinancialReportViewProps> = ({ settings }) => {
  const [periodPreset, setPeriodPreset] = useState<'today' | 'this_week' | 'this_month' | 'this_year' | 'custom'>('this_month');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [reportData, setReportData] = useState<FinancialReport | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.getFinancialReport(startDate, endDate);
      if (res.success) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const handlePresetChange = (preset: 'today' | 'this_week' | 'this_month' | 'this_year' | 'custom') => {
    setPeriodPreset(preset);
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (preset === 'today') {
      start = now;
      end = now;
    } else if (preset === 'this_week') {
      const day = now.getDay() || 7;
      start.setDate(now.getDate() - day + 1);
    } else if (preset === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (preset === 'this_year') {
      start = new Date(now.getFullYear(), 0, 1);
    }

    if (preset !== 'custom') {
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (!reportData) return;
    const pnlData = [
      { 'Komponen Laporan': '1. PENDAPATAN & PENJUALAN', 'Nominal (Rp)': '' },
      { 'Komponen Laporan': 'Penjualan Kotor (Subtotal)', 'Nominal (Rp)': reportData.gross_revenue },
      { 'Komponen Laporan': 'Potongan / Diskon Penjualan', 'Nominal (Rp)': -reportData.total_discount },
      { 'Komponen Laporan': 'Total Pendapatan Bersih', 'Nominal (Rp)': reportData.net_revenue },
      { 'Komponen Laporan': '', 'Nominal (Rp)': '' },
      { 'Komponen Laporan': '2. BEBAN POKOK PENJUALAN (HPP)', 'Nominal (Rp)': '' },
      { 'Komponen Laporan': 'HPP Produk Terjual', 'Nominal (Rp)': -reportData.total_hpp },
      { 'Komponen Laporan': 'LABA KOTOR (Gross Profit)', 'Nominal (Rp)': reportData.gross_profit },
      { 'Komponen Laporan': '', 'Nominal (Rp)': '' },
      { 'Komponen Laporan': '3. BEBAN OPERASIONAL', 'Nominal (Rp)': '' },
      ...reportData.expenses_by_category.map(exp => ({
        'Komponen Laporan': `Beban ${exp.category}`,
        'Nominal (Rp)': -exp.total
      })),
      { 'Komponen Laporan': 'Total Beban Operasional', 'Nominal (Rp)': -reportData.total_expenses },
      { 'Komponen Laporan': '', 'Nominal (Rp)': '' },
      { 'Komponen Laporan': '4. HASIL BERSIH AKHIR', 'Nominal (Rp)': '' },
      { 'Komponen Laporan': 'LABA BERSIH (Net Profit)', 'Nominal (Rp)': reportData.net_profit },
      { 'Komponen Laporan': 'Margin Keuntungan Bersih', 'Nominal (Rp)': formatPercent(reportData?.net_profit_margin, 2) }
    ];

    exportToExcel(pnlData, `Laporan_Laba_Rugi_${startDate}_sd_${endDate}`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Print and Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-rose-600" />
            <span>Laporan Keuangan &amp; Laba Rugi (P&amp;L)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Laporan laba rugi komprehensif, HPP produk terjual, biaya operasional, dan margin profitabilitas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak PDF / Print</span>
          </button>
        </div>
      </div>

      {/* Date Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(
              [
                { id: 'today', label: 'Hari Ini' },
                { id: 'this_week', label: 'Minggu Ini' },
                { id: 'this_month', label: 'Bulan Ini' },
                { id: 'this_year', label: 'Tahun Ini' },
                { id: 'custom', label: 'Kustom' }
              ] as const
            ).map(preset => (
              <button
                key={preset.id}
                onClick={() => handlePresetChange(preset.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                  periodPreset === preset.id
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Date Picker Inputs */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-semibold">Dari:</span>
              <input
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  setPeriodPreset('custom');
                }}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-semibold">Sampai:</span>
              <input
                type="date"
                value={endDate}
                onChange={e => {
                  setEndDate(e.target.value);
                  setPeriodPreset('custom');
                }}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {loading || !reportData ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Menghitung laporan laba rugi...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Pendapatan Bersih</span>
              <p className="text-xl font-black text-slate-900 mt-1">{formatRupiah(reportData.net_revenue)}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{reportData.sales_count} nota penjualan</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">HPP Produk Terjual</span>
              <p className="text-xl font-black text-rose-700 mt-1">{formatRupiah(reportData.total_hpp)}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Biaya pokok resep &amp; bahan</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Laba Kotor (Gross Profit)</span>
              <p className="text-xl font-black text-emerald-700 mt-1">{formatRupiah(reportData.gross_profit)}</p>
              <p className="text-[10px] text-emerald-600 mt-0.5">Margin: {formatPercent(reportData?.gross_profit_margin, 1)}</p>
            </div>

            <div className={`p-4 rounded-2xl border shadow-2xs ${
              reportData.net_profit >= 0 ? 'bg-emerald-900 text-white border-emerald-800' : 'bg-rose-900 text-white border-rose-800'
            }`}>
              <span className="text-[11px] font-bold text-emerald-200 uppercase">Laba Bersih Akhir</span>
              <p className="text-2xl font-black mt-1">{formatRupiah(reportData.net_profit)}</p>
              <p className="text-[10px] text-emerald-300 mt-0.5">Margin Bersih: {formatPercent(reportData?.net_profit_margin, 1)}</p>
            </div>
          </div>

          {/* Official Printable Statement Sheet */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            {/* Header Statement */}
            <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  {settings?.business_name || 'Rumah Jajanan Lashira'}
                </h3>
                <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                  Laporan Laba Rugi Komprehensif (Income Statement)
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Periode: {formatDateIndo(startDate)} s/d {formatDateIndo(endDate)}
                </p>
              </div>

              <div className="text-right text-xs text-slate-400">
                <p>Mata Uang: IDR (Rupiah)</p>
                <p>Metode: HPP Resep Terkini (Standard Costing)</p>
              </div>
            </div>

            {/* Income Statement Table Rows */}
            <div className="space-y-4 text-xs">
              {/* 1. Pendapatan */}
              <div>
                <div className="flex justify-between items-center py-2 bg-slate-50 px-3 rounded-lg font-bold text-slate-800 uppercase text-[11px]">
                  <span>1. PENDAPATAN OPERASIONAL</span>
                  <span>(IDR)</span>
                </div>
                <div className="divide-y divide-slate-100 px-3">
                  <div className="flex justify-between py-2 text-slate-600">
                    <span>Penjualan Kotor Makanan Jadi</span>
                    <span className="font-semibold text-slate-800">{formatRupiah(reportData.gross_revenue)}</span>
                  </div>
                  <div className="flex justify-between py-2 text-slate-600">
                    <span>Potongan / Diskon Penjualan</span>
                    <span className="text-rose-600 font-semibold">({formatRupiah(reportData.total_discount)})</span>
                  </div>
                  <div className="flex justify-between py-2 font-bold text-slate-900 bg-slate-50/50">
                    <span>Total Pendapatan Bersih</span>
                    <span className="text-emerald-700 font-extrabold">{formatRupiah(reportData.net_revenue)}</span>
                  </div>
                </div>
              </div>

              {/* 2. HPP */}
              <div>
                <div className="flex justify-between items-center py-2 bg-slate-50 px-3 rounded-lg font-bold text-slate-800 uppercase text-[11px]">
                  <span>2. HARGA POKOK PENJUALAN (HPP)</span>
                  <span>(IDR)</span>
                </div>
                <div className="divide-y divide-slate-100 px-3">
                  <div className="flex justify-between py-2 text-slate-600">
                    <span>Beban Pokok Produksi Produk Terjual</span>
                    <span className="text-rose-700 font-semibold">({formatRupiah(reportData.total_hpp)})</span>
                  </div>
                  <div className="flex justify-between py-2 font-bold text-slate-900 bg-slate-50/50">
                    <span>LABA KOTOR (Gross Profit)</span>
                    <span className="text-emerald-700 font-black">{formatRupiah(reportData.gross_profit)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-[11px] text-slate-400 italic">
                    <span>Margin Laba Kotor:</span>
                    <span>{formatPercent(reportData?.gross_profit_margin, 2)}</span>
                  </div>
                </div>
              </div>

              {/* 3. Biaya Operasional */}
              <div>
                <div className="flex justify-between items-center py-2 bg-slate-50 px-3 rounded-lg font-bold text-slate-800 uppercase text-[11px]">
                  <span>3. BEBAN OPERASIONAL &amp; UMUM</span>
                  <span>(IDR)</span>
                </div>
                <div className="divide-y divide-slate-100 px-3">
                  {reportData.expenses_by_category.length === 0 ? (
                    <div className="py-2 text-slate-400 italic">Tidak ada beban operasional di periode ini.</div>
                  ) : (
                    reportData.expenses_by_category.map((exp, idx) => (
                      <div key={idx} className="flex justify-between py-2 text-slate-600">
                        <span>Beban {exp.category}</span>
                        <span className="text-rose-700">({formatRupiah(exp.total)})</span>
                      </div>
                    ))
                  )}
                  <div className="flex justify-between py-2 font-bold text-slate-900 bg-slate-50/50">
                    <span>Total Beban Operasional</span>
                    <span className="text-rose-700 font-extrabold">({formatRupiah(reportData.total_expenses)})</span>
                  </div>
                </div>
              </div>

              {/* 4. Laba Bersih Final */}
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
                <div className="flex justify-between items-center text-sm font-black">
                  <span className="tracking-wide uppercase">LABA BERSIH OPERASIONAL (NET PROFIT):</span>
                  <span className={`text-lg ${reportData.net_profit >= 0 ? 'text-amber-300' : 'text-rose-400'}`}>
                    {formatRupiah(reportData.net_profit)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-400 border-t border-slate-800 pt-2">
                  <span>Persentase Margin Laba Bersih:</span>
                  <span className="font-bold text-emerald-400">{formatPercent(reportData?.net_profit_margin, 2)}</span>
                </div>
              </div>
            </div>

            {/* Signature Area for Printing */}
            <div className="pt-8 border-t border-slate-200 grid grid-cols-2 text-center text-xs text-slate-500">
              <div>
                <p>Disiapkan Oleh,</p>
                <div className="h-16" />
                <p className="font-bold text-slate-800">Admin Keuangan Lashira</p>
              </div>
              <div>
                <p>Disetujui Oleh,</p>
                <div className="h-16" />
                <p className="font-bold text-slate-800">{settings?.owner_name || 'Pemilik Usaha'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
