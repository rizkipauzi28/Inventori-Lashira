import React from 'react';
import { 
  Bell, 
  Store, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  ShieldCheck, 
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  PlusCircle,
  Search
} from 'lucide-react';
import { User, AppSettings } from '../types';

interface NavbarProps {
  currentUser?: User | null;
  user?: User | null;
  settings: AppSettings | null;
  alertsCount?: number;
  lowStockCount?: number;
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
  onLogout: () => void;
  onNavigate: (view: string) => void;
  currentView?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  user: userProp,
  settings,
  alertsCount,
  lowStockCount,
  sidebarOpen,
  setSidebarOpen,
  onLogout,
  onNavigate,
  currentView
}) => {
  const activeUser = currentUser || userProp;
  const warningCount = alertsCount ?? lowStockCount ?? 0;
  const [profileDropdownOpen, setProfileDropdownOpen] = React.useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = React.useState(false);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 z-30">
      {/* Left: Mobile Toggle & Brand/Status */}
      <div className="flex items-center gap-3 md:gap-4">
        {setSidebarOpen && (
          <button
            id="btn-sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden focus:outline-none cursor-pointer"
            title="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-3">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 tracking-tight">
            {settings?.business_name || 'Rumah Jajanan Lashira'}
          </h2>
          <span className="hidden sm:inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border border-gray-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Status: Live
          </span>
        </div>
      </div>

      {/* Right: Search, Quick Action, Public Landing, Notifications & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Action Button: POS / New Transaction */}
        <button
          id="btn-nav-quick-pos"
          onClick={() => onNavigate('sales')}
          className="bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-semibold px-3.5 py-1.5 rounded-lg text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-slate-950" />
          <span>+ Transaksi Baru</span>
        </button>

        {/* View Public Store / Landing page */}
        <button
          id="btn-view-public-store"
          onClick={() => onNavigate('landing')}
          className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
            currentView === 'landing'
              ? 'bg-amber-50 text-amber-900 border border-amber-200'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200'
          }`}
          title="Lihat Halaman Publik Toko"
        >
          <Store className="w-3.5 h-3.5 text-amber-600" />
          <span>Halaman Publik</span>
          <ExternalLink className="w-3 h-3 text-gray-400" />
        </button>

        {/* Notifications / Low Stock Alert Dropdown */}
        <div className="relative">
          <button
            id="btn-notif-dropdown"
            onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
            className="relative p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Peringatan Stok"
          >
            <Bell className="w-5 h-5" />
            {warningCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full animate-pulse">
                {warningCount}
              </span>
            )}
          </button>

          {notifDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Pemberitahuan Sistem</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${warningCount > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                  {warningCount} Peringatan
                </span>
              </div>
              <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                {warningCount > 0 ? (
                  <div 
                    onClick={() => { onNavigate('stock'); setNotifDropdownOpen(false); }}
                    className="p-3 rounded-lg bg-red-50 border-l-4 border-red-500 text-red-900 text-xs flex items-start gap-2.5 cursor-pointer hover:bg-red-100/70 transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-red-950">Stok Kritis / Menipis</p>
                      <p className="text-[11px] text-red-800 mt-0.5">
                        Terdapat {warningCount} item bahan atau produk berada di bawah batas minimum stok.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-gray-400">
                    Semua stok bahan dan produk dalam batas aman.
                  </div>
                )}
              </div>
              <div className="px-3 pt-1 border-t border-gray-100 text-center">
                <button
                  onClick={() => { onNavigate('stock'); setNotifDropdownOpen(false); }}
                  className="text-xs font-semibold text-amber-600 hover:text-amber-700 py-1 cursor-pointer"
                >
                  Kelola Stok & Inventaris →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Role Info */}
        {activeUser ? (
          <div className="relative">
            <button
              id="btn-user-profile-menu"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 p-1.5 pl-2 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors text-left cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-amber-500 text-[#212529] flex items-center justify-center font-bold text-xs">
                {activeUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-gray-800 leading-tight truncate max-w-[110px]">
                  {activeUser.name}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium capitalize">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  {activeUser.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-800">{activeUser.name}</p>
                  <p className="text-[11px] text-gray-500 truncate">{activeUser.email || `${activeUser.role}@lashira.com`}</p>
                  <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    Role: {activeUser.role.toUpperCase()}
                  </span>
                </div>
                <div className="p-1">
                  <button
                    onClick={() => { onNavigate('settings'); setProfileDropdownOpen(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2 cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-gray-500" />
                    Pengaturan Toko & DB
                  </button>
                  <button
                    onClick={() => { onLogout(); setProfileDropdownOpen(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 mt-0.5 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Keluar (Logout)
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            id="btn-nav-login"
            onClick={() => onNavigate('login')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <UserIcon className="w-3.5 h-3.5" />
            Login
          </button>
        )}
      </div>
    </header>
  );
};

