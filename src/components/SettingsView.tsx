import React, { useState, useEffect } from 'react';
import {
  Settings,
  Store,
  Users,
  Shield,
  FileCode,
  Download,
  CheckCircle,
  Save,
  Plus,
  Trash2,
  Lock,
  History,
  HardDrive
} from 'lucide-react';
import { AppSettings, User, AuditLog } from '../types';
import { api } from '../services/api';
import { formatDateIndo } from '../utils/formatters';

interface SettingsViewProps {
  settings: AppSettings | null;
  currentUser: User | null;
  onSettingsUpdated: (newSettings: AppSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  currentUser,
  onSettingsUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'business' | 'users' | 'audit' | 'database'>('business');
  const [formData, setFormData] = useState<AppSettings>(
    settings || {
      business_name: 'Rumah Jajanan Lashira',
      tagline: 'Camilan & Jajanan Tradisional Berkualitas Gurih & Lezat',
      address: 'Jl. Melati No. 18, Sidoarjo, Jawa Timur',
      phone: '0812-3456-7890',
      receipt_footer: 'Terima kasih atas kunjungan Anda! Nikmati kelezatan jajanan kami.',
      currency: 'Rp',
      default_profit_target_percent: 50,
      low_stock_threshold: 5
    }
  );

  const [savingSettings, setSavingSettings] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Users Management State
  const [users, setUsers] = useState<User[]>([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    name: '',
    role: 'cashier' as const
  });

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const loadData = async () => {
    try {
      const [uRes, aRes] = await Promise.all([
        api.getUsers(),
        api.getAuditLogs()
      ]);
      if (uRes.success) setUsers(uRes.data);
      if (aRes.success) setAuditLogs(aRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await api.updateSettings(formData);
      if (res.success) {
        setSuccessMsg('Pengaturan usaha berhasil diperbarui!');
        onSettingsUpdated(formData);
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg('Gagal memperbarui pengaturan.');
      }
    } catch (err) {
      setErrorMsg('Terjadi kesalahan.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password || !newUser.name) {
      alert('Semua field akun wajib diisi.');
      return;
    }

    try {
      const res = await api.createUser(newUser);
      if (res.success) {
        setIsAddUserOpen(false);
        setNewUser({ username: '', password: '', name: '', role: 'cashier' });
        loadData();
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('Gagal membuat user.');
    }
  };

  const handleDownloadSQL = async () => {
    try {
      const res = await api.getDatabaseSQL();
      if (res.success) {
        const blob = new Blob([res.sql], { type: 'text/sql' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rumah_jajanan_lashira_schema_${new Date().toISOString().split('T')[0]}.sql`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      alert('Gagal mengunduh skema database SQL.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-rose-600" />
            <span>Pengaturan Sistem &amp; Profil Usaha</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi profil toko jajanan, manajemen hak akses staf, log aktivitas keamanan, dan ekspor database.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('business')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'business'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Profil Toko &amp; Struk</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'users'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Pengguna &amp; Hak Akses ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'audit'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Log Aktivitas ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'database'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Deploy &amp; Skema Database MySQL</span>
        </button>
      </div>

      {/* Tab 1: Business Profile */}
      {activeTab === 'business' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Usaha / Toko</label>
              <input
                type="text"
                value={formData.business_name}
                onChange={e => setFormData({ ...formData, business_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Slogan / Tagline</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Telepon / WhatsApp</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Margin Profit Standar (%)</label>
              <input
                type="number"
                value={formData.default_profit_target_percent}
                onChange={e => setFormData({ ...formData, default_profit_target_percent: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Lengkap Toko</label>
            <input
              type="text"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Pesan Footer Struk Kasir</label>
            <input
              type="text"
              value={formData.receipt_footer}
              onChange={e => setFormData({ ...formData, receipt_footer: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingSettings ? 'Menyimpan...' : 'Simpan Pengaturan Usaha'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Users Management */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Manajemen Staf &amp; Pengguna Sistem</h3>
              <p className="text-xs text-slate-400">Atur hak akses untuk kasir, koki dapur, dan pemilik usaha.</p>
            </div>

            <button
              onClick={() => setIsAddUserOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah User Baru</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Nama Staf</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Role / Peran</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Terdaftar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono">{u.username}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'admin'
                          ? 'bg-rose-100 text-rose-800'
                          : u.role === 'cashier'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {u.role === 'admin' ? 'Owner / Admin' : u.role === 'cashier' ? 'Kasir' : 'Dapur Produksi'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                        Aktif
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{formatDateIndo(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add User Modal */}
          {isAddUserOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800">Tambah Akun Pengguna Baru</h3>
                </div>
                <form onSubmit={handleCreateUser} className="p-6 space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      placeholder="Siti Aminah"
                      value={newUser.name}
                      onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Username Login</label>
                    <input
                      type="text"
                      placeholder="kasir1"
                      value={newUser.username}
                      onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Password</label>
                    <input
                      type="password"
                      placeholder="Minimal 6 karakter"
                      value={newUser.password}
                      onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Peran / Role</label>
                    <select
                      value={newUser.role}
                      onChange={e => setNewUser({ ...newUser, role: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    >
                      <option value="cashier">Kasir (Penjualan &amp; POS)</option>
                      <option value="kitchen">Dapur (Produksi &amp; Resep)</option>
                      <option value="admin">Administrator / Owner</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddUserOpen(false)}
                      className="px-4 py-2 text-slate-600 font-semibold rounded-xl"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-rose-600 text-white font-bold rounded-xl"
                    >
                      Simpan User
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Catatan Aktivitas Keamanan &amp; Audit Log</h3>
            <p className="text-xs text-slate-400">Seluruh aksi perubahan harga, resep, produksi, dan stok terekam permanen.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Pengguna</th>
                  <th className="py-2.5 px-3">Aksi</th>
                  <th className="py-2.5 px-3">Modul</th>
                  <th className="py-2.5 px-3">Rincian Aktivitas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">{formatDateIndo(log.created_at, true)}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{log.user_name}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-rose-700">{log.module}</td>
                    <td className="py-2.5 px-3 text-slate-600">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Hostinger / Shared Hosting Deployment Guide & SQL Download */}
      {activeTab === 'database' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <FileCode className="w-5 h-5 text-rose-600" />
                <span>Panduan Deploy Shared Hosting (Hostinger / cPanel / VPS)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Struktur database SQL relasional siap pakai untuk impor ke MySQL / phpMyAdmin di cPanel.
              </p>
            </div>

            <button
              onClick={handleDownloadSQL}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download Schema database.sql</span>
            </button>
          </div>

          {/* Deployment Step-by-Step Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="w-6 h-6 rounded-full bg-rose-600 text-white text-xs font-bold flex items-center justify-center">
                1
              </span>
              <h4 className="text-xs font-bold text-slate-800">Export SQL Database</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Klik tombol "Download Schema database.sql" di atas, lalu buat database baru di phpMyAdmin hosting Anda dan import file SQL tersebut.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="w-6 h-6 rounded-full bg-rose-600 text-white text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h4 className="text-xs font-bold text-slate-800">Upload File Aplikasi</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Jalankan <code className="bg-slate-200 px-1 rounded">npm run build</code>, upload folder ke File Manager Hostinger (Node.js Application Manager atau Cloud Server).
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="w-6 h-6 rounded-full bg-rose-600 text-white text-xs font-bold flex items-center justify-center">
                3
              </span>
              <h4 className="text-xs font-bold text-slate-800">Aplikasi Siap Digunakan!</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Akses domain toko Anda, login menggunakan akun Admin, dan sistem langsung mencatat stok serta laba secara otomatis.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
