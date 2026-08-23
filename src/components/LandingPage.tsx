import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Flame, 
  Sparkles, 
  Award, 
  ChevronRight,
  ExternalLink,
  MessageCircle
} from 'lucide-react';
import { Product, Category, AppSettings } from '../types';
import { formatRupiah } from '../utils/formatters';
import { api } from '../services/api';

interface LandingPageProps {
  products?: Product[];
  categories?: Category[];
  settings?: AppSettings | null;
  onGoToDashboard?: () => void;
  onGoToLogin?: () => void;
  onOpenLogin?: () => void;
  isLoggedIn?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  products: initialProducts,
  categories: initialCategories,
  settings,
  onGoToDashboard,
  onGoToLogin,
  onOpenLogin,
  isLoggedIn = false
}) => {
  const [internalProducts, setInternalProducts] = useState<Product[]>(initialProducts || []);
  const [internalCategories, setInternalCategories] = useState<Category[]>(initialCategories || []);
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleLoginClick = () => {
    if (onOpenLogin) {
      onOpenLogin();
    } else if (onGoToLogin) {
      onGoToLogin();
    }
  };

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setInternalProducts(initialProducts);
    } else {
      api.getProducts().then(res => {
        if (res && res.success && res.data) {
          setInternalProducts(res.data);
        }
      }).catch(err => console.error('Failed to load landing products:', err));
    }
  }, [initialProducts]);

  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) {
      setInternalCategories(initialCategories);
    } else {
      api.getCategories().then(res => {
        if (res && res.success && res.data) {
          setInternalCategories(res.data);
        }
      }).catch(err => console.error('Failed to load landing categories:', err));
    }
  }, [initialCategories]);

  const productsList = (internalProducts || []);
  const categoriesList = (internalCategories || []);

  const filteredProducts = productsList.filter(p => {
    const matchCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch && p.status === 'active';
  });

  const productCategories = categoriesList.filter(c => c.type === 'product');

  const getWhatsAppOrderLink = (productName?: string) => {
    const rawNumber = settings?.whatsapp?.replace(/[^0-9]/g, '') || '6282123456789';
    const text = productName 
      ? `Halo Rumah Jajanan Lashira, saya ingin memesan menu: *${productName}*. Apakah masih tersedia?`
      : 'Halo Rumah Jajanan Lashira, saya ingin memesan aneka jajanan lezat. Mohon info menu & pengiriman ya!';
    return `https://wa.me/${rawNumber}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-amber-600 text-white text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Bumbu Asli Melimpah • Daun Jeruk Segar • Bebas Pengawet Berbahaya • Dibuat Fresh Setiap Hari!</span>
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-amber-500 flex items-center justify-center text-white text-xl shadow-sm">
              🌶️
            </div>
            <div>
              <span className="text-base font-extrabold text-slate-900 tracking-tight">
                {settings?.business_name || 'Rumah Jajanan Lashira'}
              </span>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                {settings?.tagline || 'Sensasi Jajanan Nusantara Gurih, Renyah & Pedas Juara'}
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-2 sm:gap-4">
            <a href="#menu" className="text-xs font-semibold text-slate-700 hover:text-rose-600 transition-colors hidden md:inline-block">
              Daftar Menu
            </a>
            <a href="#tentang" className="text-xs font-semibold text-slate-700 hover:text-rose-600 transition-colors hidden md:inline-block">
              Tentang Kami
            </a>
            <a href="#kontak" className="text-xs font-semibold text-slate-700 hover:text-rose-600 transition-colors hidden md:inline-block">
              Kontak &amp; Alamat
            </a>

            {isLoggedIn ? (
              <button
                id="btn-landing-to-dashboard"
                onClick={onGoToDashboard}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-all"
              >
                <span>Masuk Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                id="btn-landing-to-login"
                onClick={handleLoginClick}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all"
              >
                <span>Login Admin</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-rose-50/70 to-slate-50 py-16 sm:py-24 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold">
                <Flame className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
                <span>Jajanan Pedas &amp; Gurih No. 1 Favorit Bandung</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Gurih, Renyah &amp; <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500">
                  Pedas Daun Jeruk Juara!
                </span>
              </h1>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl">
                Nikmati aneka cemilan tradisional nusantara: Basreng Stik Daun Jeruk, Makaroni Level 5, Cireng Crispy Bumbu Rujak, dan Keripik Kaca dengan bumbu rempah pilihan yang higienis dan bikin nagih.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#menu"
                  className="px-6 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Jelajahi Menu Makanan</span>
                </a>
                <a
                  href={getWhatsAppOrderLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Pesan via WhatsApp</span>
                </a>
              </div>

              {/* Feature Badges */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200">
                <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                  <Award className="w-4 h-4 text-rose-600 mb-1" />
                  <p className="text-xs font-bold text-slate-800">100% Halal</p>
                  <p className="text-[10px] text-slate-500">Bahan alami bermutu</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 mb-1" />
                  <p className="text-xs font-bold text-slate-800">Higienis</p>
                  <p className="text-[10px] text-slate-500">Kemasan zipper sealed</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                  <Flame className="w-4 h-4 text-amber-500 mb-1" />
                  <p className="text-xs font-bold text-slate-800">Level Pedas</p>
                  <p className="text-[10px] text-slate-500">Bisa request selera</p>
                </div>
              </div>
            </div>

            {/* Right Hero Image Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900 group">
                <img
                  src="https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=80"
                  alt="Basreng Pedas Lashira"
                  className="w-full h-80 sm:h-96 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                  <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-extrabold tracking-wider uppercase self-start mb-2">
                    Best Seller No. 1
                  </span>
                  <h3 className="text-lg font-bold">Basreng Pedas Daun Jeruk</h3>
                  <p className="text-xs text-slate-200 mt-1">
                    Bumbu cabai asli melimpah berpadu wangi daun jeruk segar khas Bandung.
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-base font-extrabold text-amber-300">Rp 18.000 / pouch</span>
                    <a
                      href={getWhatsAppOrderLink('Basreng Pedas Daun Jeruk (200g)')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-colors"
                    >
                      Pesan Sekarang
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Catalog Section */}
      <section id="menu" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Koleksi Menu Jajanan Lashira
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Pilihan cemilan renyah dan baso goreng pilihan dengan racikan bumbu khas keluarga.
          </p>
        </div>

        {/* Filter Categories & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 custom-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Semua Menu ({productsList.filter(p => p.status === 'active').length})
            </button>
            {productCategories.map(cat => {
              const count = productsList.filter(p => p.category_id === cat.id && p.status === 'active').length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Cari jajanan favorit..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <p className="text-sm font-bold text-slate-700">Tidak ada produk yang cocok dengan pencarian.</p>
            <p className="text-xs text-slate-500 mt-1">Coba gunakan kata kunci lain atau pilih kategori Semua Menu.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
              >
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  <img
                    src={product.image || 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=80'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${
                      product.stock > 0
                        ? 'bg-emerald-500 text-white'
                        : 'bg-rose-500 text-white'
                    }`}>
                      {product.stock > 0 ? `Ready Stok (${product.stock} pcs)` : 'Habis'}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                      {product.category_name || 'Cemilan Nusantara'}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5 group-hover:text-rose-600 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {product.description || 'Olahan camilan lezat dengan rasa gurih dan pedas mantap.'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">Harga Satuan</p>
                      <p className="text-sm font-extrabold text-slate-900">
                        {formatRupiah(product.selling_price)}
                      </p>
                    </div>

                    <a
                      href={getWhatsAppOrderLink(product.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 transition-colors shadow-xs"
                    >
                      <span>Pesan</span>
                      <ChevronRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* About Section */}
      <section id="tentang" className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase text-rose-600 tracking-wider">
                Tentang Usaha Kami
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Dedikasi Rasa &amp; Mutu di Rumah Jajanan Lashira
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Rumah Jajanan Lashira didirikan dengan komitmen menyajikan makanan olahan dan jajanan khas nusantara yang mengutamakan cita rasa otentik, higienitas, dan bahan baku berkualitas tinggi.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Seluruh proses produksi kami telah terstandarisasi dengan manajemen resep proporsional, kontrol mutu bahan, serta kebersihan dapur yang terjaga demi kepuasan pelanggan dan mitra reseller di seluruh Indonesia.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="text-2xl font-black text-rose-600">5.000+</p>
                <p className="text-xs font-bold text-slate-800 mt-1">Pouch Terjual</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Dinikmati konsumen &amp; reseller</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="text-2xl font-black text-emerald-600">100%</p>
                <p className="text-xs font-bold text-slate-800 mt-1">Bahan Pilihan</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Cabai segar &amp; minyak higienis</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="text-2xl font-black text-amber-500">4.9 / 5.0</p>
                <p className="text-xs font-bold text-slate-800 mt-1">Rating Kepuasan</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Ulasan pelanggan setia</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="text-2xl font-black text-indigo-600">Open</p>
                <p className="text-xs font-bold text-slate-800 mt-1">Reseller &amp; Dropship</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Harga khusus partai besar</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact & Footer Section */}
      <footer id="kontak" className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white text-base">
                🌶️
              </div>
              <span className="text-base font-extrabold text-white">
                {settings?.business_name || 'Rumah Jajanan Lashira'}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {settings?.tagline || 'Sensasi Jajanan Nusantara Gurih, Renyah & Pedas Juara'}
            </p>
            <div className="mt-4 pt-4 border-t border-slate-800">
              <button
                onClick={onGoToLogin}
                className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <span>Akses Masuk Admin &amp; Kasir</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Kontak Pemesanan
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-rose-500 shrink-0" />
                <span>WhatsApp: {settings?.whatsapp || '0821-2345-6789'}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Email: {settings?.email || 'kontak@rumahjajananlashira.com'}</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{settings?.address || 'Jl. Cisaranten Kulon No. 42, Arcamanik, Kota Bandung, Jawa Barat'}</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Jam Operasional &amp; Pengiriman
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Senin - Sabtu: 08:00 - 18:00 WIB<br />
              Minggu / Hari Libur: Tetap melayani pesanan online via WhatsApp.
            </p>
            <div className="mt-4">
              <a
                href={getWhatsAppOrderLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat Admin WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Rumah Jajanan Lashira. All rights reserved.</p>
          <p>Sistem Manajemen Makanan &amp; HPP Otomatis</p>
        </div>
      </footer>
    </div>
  );
};
