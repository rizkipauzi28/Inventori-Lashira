import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Currency Formatter
export function formatRupiah(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return 'Rp 0';
  }
  const num = Math.round(Number(amount));
  return 'Rp ' + num.toLocaleString('id-ID');
}

// Compact Currency Formatter for charts/cards
export function formatRupiahCompact(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return 'Rp 0';
  }
  const num = Number(amount);
  if (Math.abs(num) >= 1_000_000) {
    return `Rp ${(num / 1_000_000).toFixed(1)} jt`;
  }
  if (Math.abs(num) >= 1_000) {
    return `Rp ${(num / 1_000).toFixed(0)} rb`;
  }
  return `Rp ${num.toLocaleString('id-ID')}`;
}

// Percent Formatter
export function formatPercent(value: number | string | undefined | null, decimals = 1): string {
  if (value === undefined || value === null || isNaN(Number(value))) {
    return '0.0%';
  }
  return `${Number(value).toFixed(decimals)}%`;
}

// Date Formatter
export function formatDateIndo(dateStr?: string, includeTime = false): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
    };
    return d.toLocaleDateString('id-ID', options);
  } catch {
    return dateStr;
  }
}

// Quantity with unit formatter
export function formatQuantityWithUnit(qty: number, unitSymbol = 'g', isStock = false): string {
  if (unitSymbol.toLowerCase() === 'g' || unitSymbol.toLowerCase() === 'gram') {
    if (qty >= 1000) {
      const kg = (qty / 1000).toLocaleString('id-ID', { maximumFractionDigits: 2 });
      return `${kg} kg (${qty.toLocaleString('id-ID')} g)`;
    }
    return `${qty.toLocaleString('id-ID')} g`;
  }
  if (unitSymbol.toLowerCase() === 'ml') {
    if (qty >= 1000) {
      const l = (qty / 1000).toLocaleString('id-ID', { maximumFractionDigits: 2 });
      return `${l} L (${qty.toLocaleString('id-ID')} ml)`;
    }
    return `${qty.toLocaleString('id-ID')} ml`;
  }
  return `${qty.toLocaleString('id-ID')} ${unitSymbol}`;
}

// Export Table Data to Excel (XLSX)
export function exportToExcel(data: any[], fileName: string, sheetName = 'Laporan') {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// Export Table Data to CSV
export function exportToCSV(data: any[], fileName: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const csvOutput = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export Table to PDF
export function exportToPDF(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  fileName: string,
  subtitle?: string
) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text('RUMAH JAJANAN LASHIRA', 14, 15);
  
  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  doc.text(title, 14, 23);

  if (subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, 14, 29);
  }

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, subtitle ? 34 : 29);

  // Table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: subtitle ? 38 : 33,
    theme: 'striped',
    headStyles: { fillColor: [225, 29, 72], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2 },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });

  doc.save(`${fileName}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Window Print Helper
export function printElement(elementId: string, pageTitle = 'Laporan Cetak') {
  const elem = document.getElementById(elementId);
  if (!elem) {
    window.print();
    return;
  }

  const printWindow = window.open('', '', 'height=700,width=900');
  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.write('<html><head><title>' + pageTitle + '</title>');
  printWindow.document.write('<style>');
  printWindow.document.write(`
    body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; color: #1e293b; }
    h1, h2, h3 { margin: 0 0 8px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 24px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-size: 12px; }
    th { background-color: #f1f5f9; font-weight: 600; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .footer { margin-top: 32px; font-size: 11px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 12px; }
    @media print {
      body { padding: 0; }
    }
  `);
  printWindow.document.write('</style></head><body>');
  printWindow.document.write(elem.innerHTML);
  printWindow.document.write('</body></html>');
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 300);
}
