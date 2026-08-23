import React from 'react';
import { Printer, X, CheckCircle, Share2 } from 'lucide-react';
import { Sale, AppSettings } from '../types';
import { formatRupiah, formatDateIndo, printElement } from '../utils/formatters';

interface ReceiptModalProps {
  sale: Sale | null;
  settings: AppSettings | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, settings, onClose }) => {
  if (!sale) return null;

  const handlePrint = () => {
    printElement('printable-receipt-area', `Struk_${sale.invoice_number}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800">Struk Transaksi Penjualan</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Body (Printable Area) */}
        <div className="p-6 overflow-y-auto flex-1 bg-white font-mono text-xs text-slate-800" id="printable-receipt-area">
          {/* Header */}
          <div className="text-center pb-4 border-b border-dashed border-slate-300">
            <h2 className="text-base font-bold tracking-tight text-slate-900 font-sans">
              {settings?.business_name || 'RUMAH JAJANAN LASHIRA'}
            </h2>
            <p className="text-[10px] text-slate-500 font-sans mt-0.5 max-w-[260px] mx-auto">
              {settings?.address || 'Jl. Cisaranten Kulon No. 42, Arcamanik, Bandung'}
            </p>
            <p className="text-[10px] text-slate-500 font-sans mt-0.5">
              WhatsApp: {settings?.whatsapp || '0821-2345-6789'}
            </p>
          </div>

          {/* Meta Info */}
          <div className="py-3 border-b border-dashed border-slate-300 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">No. Nota:</span>
              <span className="font-bold text-slate-900">{sale.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tanggal:</span>
              <span>{formatDateIndo(sale.sale_date, true)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Pelanggan:</span>
              <span className="font-semibold">{sale.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Kasir:</span>
              <span>{sale.created_by_name}</span>
            </div>
          </div>

          {/* Items */}
          <div className="py-3 border-b border-dashed border-slate-300 space-y-2">
            {sale.items.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <p className="font-bold text-slate-900">{item.product_name}</p>
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>{item.quantity} x {formatRupiah(item.selling_price)}</span>
                  <span className="font-semibold text-slate-900">{formatRupiah(item.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="py-3 border-b border-dashed border-slate-300 text-[11px] space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatRupiah(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Diskon</span>
                <span>-{formatRupiah(sale.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>TOTAL BAYAR</span>
              <span className="text-sm text-rose-600">{formatRupiah(sale.total)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Metode Pembayaran</span>
              <span className="font-semibold text-slate-800">{sale.payment_method}</span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-4 text-[10px] text-slate-500 font-sans leading-relaxed">
            <p className="font-medium whitespace-pre-line">
              {settings?.receipt_footer || 'Terima kasih atas pesanan Anda di Rumah Jajanan Lashira!\nCamilan dibuat segar dan higienis.'}
            </p>
            <p className="mt-2 text-[9px] text-slate-400">=== Simpan struk ini sebagai bukti pembayaran sah ===</p>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Struk (Print)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
