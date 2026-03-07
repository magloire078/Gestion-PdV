"use client";

import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X, Download } from 'lucide-react';
import type { Company, UserProfile, PointOfSale } from '@/lib/types';

interface ReceiptItem {
    name: string;
    quantity: number;
    price: number;
}

interface ReceiptData {
    receiptNumber: string;
    timestamp: number;
    items: ReceiptItem[];
    total: number;
    cashierName?: string;
    posName?: string;
}

interface ReceiptModalProps {
    open: boolean;
    onClose: () => void;
    receipt: ReceiptData | null;
    company: Company | null;
}

function formatDate(ts: number) {
    return new Date(ts).toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

export function ReceiptModal({ open, onClose, receipt, company }: ReceiptModalProps) {
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank', 'width=400,height=600');
        if (!printWindow) return;

        printWindow.document.write(`
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Reçu de vente</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      width: 80mm;
      padding: 4mm;
      color: #000;
      background: #fff;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .large { font-size: 15px; }
    .small { font-size: 10px; }
    .divider {
      border-top: 1px dashed #000;
      margin: 6px 0;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin: 2px 0;
    }
    .row-item { flex: 1; }
    .row-price { text-align: right; white-space: nowrap; }
    .total-row {
      font-weight: bold;
      font-size: 14px;
      margin-top: 4px;
    }
    .logo { font-size: 18px; font-weight: bold; letter-spacing: 2px; }
    .thank-you { font-size: 11px; margin-top: 8px; }
  </style>
</head>
<body>
  ${printContent.innerHTML}
  <script>window.onload = function() { window.print(); window.close(); }<\/script>
</body>
</html>`);
        printWindow.document.close();
    };

    if (!receipt) return null;

    const subtotal = receipt.items.reduce((acc, i) => acc + i.price * i.quantity, 0);

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-sm bg-neutral-900 border-neutral-800 text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Printer size={18} className="text-indigo-400" />
                            Reçu de vente
                        </span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
                            <X size={14} />
                        </Button>
                    </DialogTitle>
                </DialogHeader>

                {/* Receipt preview */}
                <div className="bg-white text-black rounded-lg p-4 font-mono text-xs max-h-[60vh] overflow-y-auto">
                    <div ref={printRef}>
                        {/* Header */}
                        <div className="center mb-3">
                            <div className="logo bold large">{company?.name?.toUpperCase() ?? 'MON ENTREPRISE'}</div>
                            {company?.address && <div className="small mt-1">{company.address}</div>}
                            {company?.phone && <div className="small">{company.phone}</div>}
                            {company?.taxId && <div className="small">NIF: {company.taxId}</div>}
                        </div>

                        <div className="divider" />

                        {/* Meta */}
                        <div className="small mb-1">
                            <div className="row">
                                <span>Reçu N°</span>
                                <span className="bold">{receipt.receiptNumber}</span>
                            </div>
                            <div className="row">
                                <span>Date</span>
                                <span>{formatDate(receipt.timestamp)}</span>
                            </div>
                            {receipt.cashierName && (
                                <div className="row">
                                    <span>Caissier</span>
                                    <span>{receipt.cashierName}</span>
                                </div>
                            )}
                            {receipt.posName && (
                                <div className="row">
                                    <span>Point de Vente</span>
                                    <span>{receipt.posName}</span>
                                </div>
                            )}
                        </div>

                        <div className="divider" />

                        {/* Items */}
                        <div className="mb-1">
                            <div className="row bold small" style={{ borderBottom: '1px solid #ccc', paddingBottom: '2px', marginBottom: '4px' }}>
                                <span className="row-item">Article</span>
                                <span style={{ width: '30px', textAlign: 'center' }}>Qté</span>
                                <span className="row-price" style={{ width: '70px' }}>Prix</span>
                                <span className="row-price" style={{ width: '70px' }}>Total</span>
                            </div>
                            {receipt.items.map((item, i) => (
                                <div key={i} className="row small" style={{ marginBottom: '2px' }}>
                                    <span className="row-item" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90px' }}>{item.name}</span>
                                    <span style={{ width: '30px', textAlign: 'center' }}>x{item.quantity}</span>
                                    <span className="row-price" style={{ width: '70px' }}>{item.price.toLocaleString()}</span>
                                    <span className="row-price bold" style={{ width: '70px' }}>{(item.price * item.quantity).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>

                        <div className="divider" />

                        {/* Totals */}
                        <div className="small mb-1">
                            <div className="row">
                                <span>Sous-total</span>
                                <span>{subtotal.toLocaleString()} FCFA</span>
                            </div>
                            <div className="row">
                                <span>TVA (0%)</span>
                                <span>0 FCFA</span>
                            </div>
                        </div>
                        <div className="row total-row" style={{ fontSize: '14px', marginTop: '4px' }}>
                            <span>TOTAL</span>
                            <span>{receipt.total.toLocaleString()} FCFA</span>
                        </div>

                        <div className="divider" />

                        {/* Footer */}
                        <div className="center thank-you small" style={{ marginTop: '8px' }}>
                            <div className="bold">Merci pour votre achat !</div>
                            {company?.contactEmail && <div style={{ marginTop: '4px' }}>{company.contactEmail}</div>}
                            <div style={{ marginTop: '8px', fontSize: '9px', color: '#666' }}>
                                Ce reçu est votre preuve d'achat.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-2">
                    <Button
                        variant="outline"
                        className="flex-1 border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                        onClick={onClose}
                    >
                        Fermer sans imprimer
                    </Button>
                    <Button
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 gap-2"
                        onClick={handlePrint}
                    >
                        <Printer size={16} />
                        Imprimer
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
