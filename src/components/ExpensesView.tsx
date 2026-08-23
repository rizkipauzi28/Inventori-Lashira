import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Trash2,
  FileSpreadsheet,
  Printer,
  X,
  CheckCircle,
  Calendar,
  Wallet,
  Tag
} from 'lucide-react';
import { Expense, User } from '../types';
import { api } from '../services/api';
import { formatRupiah, formatDateIndo, exportToExcel, exportToPDF } from '../utils/formatters';

interface ExpensesViewProps {
  currentUser: User | null;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({ currentUser }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Listrik & Air',
    description: '',
    amount: 100000,
    payment_method: 'Cash',
    receipt: '',
    notes: ''
  });

  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const expenseCategories = [
    'Listrik & Air',
    'Gas LPG',
    'Gaji Karyawan',
    'Sewa Tempat / Ruko',
    'Kemasan & Stiker',
    'Bensin & Transportasi',
    'Kebersihan & Sanitasi',
    'Perawatan Alat Dapur',
    'Pemasaran & Iklan',
    'Lain-lain'
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getExpenses();
      if (res.success) setExpenses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      setFormError('Deskripsi pengeluaran wajib diisi.');
      return;
    }
    if (Number(formData.amount) <= 0) {
      setFormError('Jumlah pengeluaran harus lebih dari 0.');
      return;
    }

    try {
      const res = await api.createExpense({
        ...formData,
        amount: Number(formData.amount),
        created_by: currentUser?.id || 1,
        created_by_name: currentUser?.name || 'Admin'
      });

      if (res.success) {
        setIsModalOpen(false);
        setSuccessMessage('Pengeluaran operasional berhasil dicatat!');
        loadData();
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        setFormError(res.message);
      }
    } catch (err) {
      setFormError('Gagal mencatat pengeluaran.');
    }
  };

  const handleDelete = async (id: number, desc: string) => {
    if (confirm(`Hapus pengeluaran "${desc}"?`)) {
      const res = await api.deleteExpense(id);
      if (res.success) {
        loadData();
      }
    }
  };

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleExportExcel = () => {
    const data = expenses.map(e => ({
      'No. Pengeluaran': e.expense_number,
      'Tanggal': e.date,
      'Kategori': e.category,
      'Deskripsi': e.description,
      'Nominal (Rp)': e.amount,
      'Metode Bayar': e.payment_method,
      'Dicatat Oleh': e.created_by_name
    }));
    exportToExcel(data, 'Biaya_Operasional_Lashira');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-rose-600" />
            <span>Pengeluaran &amp; Biaya Operasional</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Catat beban utilitas (gas, listrik), sewa, gaji, dan biaya operasional untuk perhitungan laba bersih.
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
            id="btn-add-expense"
            onClick={() => {
              setFormData({
                date: new Date().toISOString().split('T')[0],
                category: 'Listrik & Air',
                description: '',
                amount: 100000,
                payment_method: 'Cash',
                receipt: '',
                notes: ''
              });
              setFormError('');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Pengeluaran Baru</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Pengeluaran Tercatat</span>
          <p className="text-2xl font-black text-rose-700 mt-1">{formatRupiah(totalExpense)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{expenses.length} transaksi beban operasional</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Beban Tertinggi</span>
          <p className="text-base font-bold text-slate-800 mt-1 truncate">
            {expenses.length > 0
              ? `${expenses.sort((a, b) => b.amount - a.amount)[0]?.category} (${formatRupiah(expenses.sort((a, b) => b.amount - a.amount)[0]?.amount)})`
              : '-'}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Kategori biaya paling dominan</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Status Pengurangan Laba</span>
          <p className="text-base font-extrabold text-emerald-700 mt-1">Otomatis Termasuk di P&amp;L</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Laba bersih dihitung setelah beban ini</p>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Daftar Beban &amp; Pengeluaran</h3>
          <span className="text-xs text-slate-400 font-semibold">{expenses.length} Catatan</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">No. Pengeluaran</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Deskripsi / Rincian</th>
                <th className="py-3 px-4">Nominal</th>
                <th className="py-3 px-4">Metode Bayar</th>
                <th className="py-3 px-4">Dicatat Oleh</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Memuat data pengeluaran...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Belum ada pengeluaran yang dicatat.
                  </td>
                </tr>
              ) : (
                expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-rose-700">{exp.expense_number}</td>
                    <td className="py-3 px-4 text-slate-600">{formatDateIndo(exp.date)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{exp.description}</td>
                    <td className="py-3 px-4 font-extrabold text-rose-700">{formatRupiah(exp.amount)}</td>
                    <td className="py-3 px-4 text-slate-600">{exp.payment_method}</td>
                    <td className="py-3 px-4 text-slate-500">{exp.created_by_name}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(exp.id, exp.description)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                        title="Hapus Pengeluaran"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Expense */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">Catat Pengeluaran Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Beban</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                  >
                    {expenseCategories.map((c, i) => (
                      <option key={i} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi / Keterangan Biaya</label>
                <input
                  type="text"
                  placeholder="Contoh: Beli Tabung Gas Elpiji 12kg x 2"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nominal (Rp)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-rose-700 focus:bg-white focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Metode Bayar</label>
                  <select
                    value={formData.payment_method}
                    onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                  >
                    <option value="Cash">Tunai (Cash)</option>
                    <option value="Transfer">Transfer Bank</option>
                    <option value="QRIS">QRIS</option>
                    <option value="E-wallet">E-wallet</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
                >
                  Simpan Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
