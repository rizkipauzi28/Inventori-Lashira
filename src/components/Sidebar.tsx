import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  ScrollText,
  Factory,
  Layers,
  ShoppingCart,
  Receipt,
  Wallet,
  FileSpreadsheet,
  TrendingUp,
  Settings,
  Users,
  LogOut,
  ChevronRight,
  Package,
  Layers2,
  Truck
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  currentUser?: User | null;
  user?: User | null;
  onLogout?: () => void;
  lowStockCount?: number;
  alertsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isOpen = true,
  setIsOpen,
  currentUser,
  user: userProp,
  onLogout,
  lowStockCount,
  alertsCount
}) => {
  const activeUser = currentUser || userProp;
  const warningCount = lowStockCount ?? alertsCount ?? 0;
  
  const [masterDataOpen, setMasterDataOpen] = React.useState(
    ['ingredients', 'products', 'units_categories', 'suppliers'].includes(currentView)
  );

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'recipes', label: 'Resep & HPP', icon: ScrollText, badge: null },
    { id: 'production', label: 'Produksi', icon: Factory, badge: null },
    { id: 'stock', label: 'Stok Inventory', icon: Layers, badge: warningCount > 0 ? `${warningCount} Alert` : null },
    { id: 'sales', label: 'Penjualan & Kasir', icon: ShoppingCart, badge: 'POS' },
    { id: 'expenses', label: 'Pengeluaran', icon: Receipt, badge: null },
    { id: 'reports', label: 'Laporan Keuangan', icon: FileSpreadsheet, badge: null },
    { id: 'analysis', label: 'Analisis & Forecast', icon: TrendingUp, badge: null }
  ];

  const handleNavClick = (viewId: string) => {
    onNavigate(viewId);
    if (setIsOpen && window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && setIsOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`w-64 bg-[#2d3436] text-white flex flex-col shrink-0 border-r border-[#212529] select-none ${
          setIsOpen ? (isOpen ? 'fixed lg:static inset-y-0 left-0 z-50' : 'hidden lg:flex') : ''
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 bg-[#212529] border-b border-[#1b1e21] flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-amber-400 flex items-center gap-2">
              Lashira Admin
            </h1>
            <p className="text-xs text-gray-400 uppercase tracking-widest mt-0.5 font-medium">
              Rumah Jajanan
            </p>
          </div>
          <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-sm font-bold uppercase tracking-wider border border-amber-500/30">
            PRO
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-3 overflow-y-auto space-y-1">
          {/* Main Dashboard */}
          <button
            id="nav-dashboard"
            onClick={() => handleNavClick('dashboard')}
            className={`w-full px-5 py-2.5 text-sm flex items-center justify-between text-left transition-colors cursor-pointer ${
              currentView === 'dashboard'
                ? 'bg-amber-500/10 border-l-4 border-amber-500 text-amber-400 font-semibold'
                : 'text-gray-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </div>
          </button>

          {/* Master Data Section with Submenu */}
          <div>
            <button
              id="nav-master-toggle"
              onClick={() => setMasterDataOpen(!masterDataOpen)}
              className="w-full px-5 py-2.5 text-sm flex items-center justify-between text-left text-gray-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Boxes className="w-4 h-4 text-amber-400" />
                <span>Master Data</span>
              </div>
              <ChevronRight
                className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
                  masterDataOpen ? 'rotate-90 text-amber-400' : ''
                }`}
              />
            </button>

            {masterDataOpen && (
              <div className="bg-[#262c2d] py-1 border-y border-[#212529] space-y-0.5">
                <button
                  id="nav-ingredients"
                  onClick={() => handleNavClick('ingredients')}
                  className={`w-full pl-11 pr-5 py-2 text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                    currentView === 'ingredients'
                      ? 'text-amber-400 font-semibold bg-amber-500/10'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }`}
                >
                  <Layers2 className="w-3.5 h-3.5" />
                  <span>Bahan Baku</span>
                </button>

                <button
                  id="nav-products"
                  onClick={() => handleNavClick('products')}
                  className={`w-full pl-11 pr-5 py-2 text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                    currentView === 'products'
                      ? 'text-amber-400 font-semibold bg-amber-500/10'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Produk Makanan</span>
                </button>

                <button
                  id="nav-units-categories"
                  onClick={() => handleNavClick('units_categories')}
                  className={`w-full pl-11 pr-5 py-2 text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                    currentView === 'units_categories'
                      ? 'text-amber-400 font-semibold bg-amber-500/10'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }`}
                >
                  <Boxes className="w-3.5 h-3.5" />
                  <span>Satuan & Kategori</span>
                </button>

                <button
                  id="nav-suppliers"
                  onClick={() => handleNavClick('suppliers')}
                  className={`w-full pl-11 pr-5 py-2 text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                    currentView === 'suppliers'
                      ? 'text-amber-400 font-semibold bg-amber-500/10'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Supplier</span>
                </button>
              </div>
            )}
          </div>

          {/* Operational Menu Items */}
          {navItems.slice(1, 6).map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`w-full px-5 py-2.5 text-sm flex items-center justify-between text-left transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/10 border-l-4 border-amber-500 text-amber-400 font-semibold'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.badge.includes('Alert')
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Reports & Analytics */}
          {navItems.slice(6).map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`w-full px-5 py-2.5 text-sm flex items-center justify-between text-left transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/10 border-l-4 border-amber-500 text-amber-400 font-semibold'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}

          {/* Settings Nav Item */}
          <button
            id="nav-settings"
            onClick={() => handleNavClick('settings')}
            className={`w-full px-5 py-2.5 text-sm flex items-center justify-between text-left transition-colors cursor-pointer ${
              currentView === 'settings'
                ? 'bg-amber-500/10 border-l-4 border-amber-500 text-amber-400 font-semibold'
                : 'text-gray-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Settings className="w-4 h-4" />
              <span>Pengaturan & DB</span>
            </div>
          </button>
        </nav>

        {/* User Card & Logout Bottom Bar */}
        <div className="p-4 bg-[#212529] border-t border-[#1b1e21] text-xs flex items-center justify-between">
          {activeUser ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3 truncate">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-[#212529] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  {activeUser.name ? activeUser.name.slice(0, 2).toUpperCase() : 'AD'}
                </div>
                <div className="truncate">
                  <p className="font-medium text-white truncate">{activeUser.name}</p>
                  <p className="text-gray-400 text-[11px] truncate">{activeUser.email || `${activeUser.role}@lashira.com`}</p>
                </div>
              </div>
              {onLogout && (
                <button
                  id="btn-sidebar-logout"
                  onClick={onLogout}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-white/5 transition-colors ml-2 shrink-0"
                  title="Keluar Akun"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => handleNavClick('login')}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-900 bg-amber-500 hover:bg-amber-400 transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Masuk Admin</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

