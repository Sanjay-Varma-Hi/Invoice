"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  User,
  ArrowLeft,
  Download,
  Printer,
  Edit,
  Copy,
  Trash2,
  AlertTriangle,
  Loader2,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import { generateInvoicePDF } from "@/lib/pdf";

interface InvoiceItem {
  itemId: string;
  itemName: string;
  quantity: number;
}

interface Invoice {
  _id: string;
  date: string;
  receivedFrom: string;
  receivedFromAddress?: string;
  receivedFromId?: string;
  items: InvoiceItem[];
  pdfReference?: string;
}

export default function ViewInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  // States
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Delete Dialog State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadInvoice = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/invoices/${id}`);
        if (!res.ok) throw new Error("Invoice not found");
        const data = await res.json();
        setInvoice(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load invoice");
        router.push("/invoices/history");
      } finally {
        setLoading(false);
      }
    };
    loadInvoice();
  }, [id, router]);

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    try {
      if (invoice.pdfReference) {
        const link = document.createElement("a");
        link.href = invoice.pdfReference;
        link.download = `invoice_${invoice._id}.pdf`;
        link.click();
        toast.success("Downloading PDF...");
      } else {
        toast.loading("Generating PDF...", { id: "gen-pdf" });
        const settingsRes = await fetch("/api/settings");
        const settings = await settingsRes.json();
        const doc = generateInvoicePDF(invoice, settings);
        doc.save(`invoice_${invoice._id}.pdf`);
        toast.success("PDF generated & downloaded!", { id: "gen-pdf" });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to download PDF");
    }
  };

  const handlePrintPDF = async () => {
    if (!invoice) return;
    try {
      let pdfUrl = invoice.pdfReference;
      if (!pdfUrl) {
        toast.loading("Preparing print...", { id: "print-pdf" });
        const settingsRes = await fetch("/api/settings");
        const settings = await settingsRes.json();
        const doc = generateInvoicePDF(invoice, settings);
        pdfUrl = doc.output("datauristring");
        toast.dismiss("print-pdf");
      }
      
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = pdfUrl;
      document.body.appendChild(iframe);
      iframe.contentWindow?.print();
    } catch (err) {
      console.error(err);
      toast.error("Failed to print PDF");
    }
  };

  const handleDeleteInvoice = async () => {
    try {
      setDeleting(true);
      const res = await fetch(`/api/invoices/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete invoice");

      toast.success("Invoice deleted successfully");
      router.push("/invoices/history");
    } catch (error) {
      console.error(error);
      toast.error("Could not delete invoice");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="text-stone-500 dark:text-stone-400 mt-2 text-sm">Loading invoice details...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-20">
        <p className="text-stone-500 dark:text-stone-400">Invoice not found.</p>
        <Link href="/invoices/history" className="text-orange-500 hover:underline mt-2 inline-block">
          Back to History
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Back button and page actions header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/invoices/history"
          className="inline-flex items-center gap-2 text-sm text-stone-500 dark:text-stone-450 hover:text-stone-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to History
        </Link>
        
        {/* Core Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => router.push(`/invoices/create?edit=${invoice._id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-250 dark:border-stone-800 text-stone-705 dark:text-stone-300 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-850 text-xs font-semibold shadow-xs transition-colors"
          >
            <Edit className="w-3.5 h-3.5 text-orange-500" />
            Edit
          </button>
          
          <button
            onClick={() => router.push(`/invoices/create?duplicate=${invoice._id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-250 dark:border-stone-800 text-stone-705 dark:text-stone-300 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-850 text-xs font-semibold shadow-xs transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-orange-500" />
            Duplicate
          </button>

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-250 dark:border-stone-800 text-red-500 bg-white dark:bg-stone-900 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-semibold shadow-xs transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Grid Layout: Invoice summary on left, live PDF print preview on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Summary Info */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-6">
            <h2 className="text-xl font-bold text-stone-900 dark:text-white">
              Invoice Summary
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-stone-400 mt-0.5" />
                <div>
                  <span className="text-xs text-stone-450 dark:text-stone-500 uppercase tracking-wider block font-semibold">
                    Invoice Date
                  </span>
                  <span className="text-stone-800 dark:text-stone-200 text-sm font-medium">
                    {formatDate(invoice.date)}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-stone-400 mt-0.5" />
                <div>
                  <span className="text-xs text-stone-450 dark:text-stone-500 uppercase tracking-wider block font-semibold">
                    Received From
                  </span>
                  <span className="text-stone-800 dark:text-stone-200 text-sm font-semibold">
                    {invoice.receivedFrom}
                  </span>
                  {invoice.receivedFromAddress && (
                    <span className="text-xs text-stone-500 dark:text-stone-400 block mt-0.5">
                      {invoice.receivedFromAddress}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <hr className="border-stone-150 dark:border-stone-800" />

            {/* List of items */}
            <div className="space-y-3">
              <span className="text-xs text-stone-450 dark:text-stone-500 uppercase tracking-wider font-semibold block">
                Items Breakdown
              </span>
              <div className="border border-stone-150 dark:border-stone-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-stone-50 dark:bg-stone-850/50 border-b border-stone-150 dark:border-stone-800 text-stone-500">
                      <th className="px-4 py-2.5 w-12 text-center">S.No</th>
                      <th className="px-4 py-2.5">Item Name</th>
                      <th className="px-4 py-2.5 w-20 text-center">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-150 dark:divide-stone-800 text-stone-700 dark:text-stone-305">
                    {invoice.items.map((item, index) => (
                      <tr key={index} className="hover:bg-stone-50/20 dark:hover:bg-stone-850/10">
                        <td className="px-4 py-2.5 text-center text-stone-400 font-medium">{index + 1}</td>
                        <td className="px-4 py-2.5 font-semibold text-stone-900 dark:text-stone-100">{item.itemName}</td>
                        <td className="px-4 py-2.5 text-center font-medium">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleDownloadPDF}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-250 dark:border-stone-805 text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-850 text-xs font-semibold shadow-xs transition-colors"
              >
                <Download className="w-4 h-4 text-orange-500" />
                Download PDF
              </button>
              <button
                onClick={handlePrintPDF}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-250 dark:border-stone-805 text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-850 text-xs font-semibold shadow-xs transition-colors"
              >
                <Printer className="w-4 h-4 text-orange-500" />
                Print PDF
              </button>
            </div>

          </div>
        </div>

        {/* Right Side: PDF Preview Panel */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs flex flex-col h-[70vh]">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-stone-900 dark:text-white text-sm">
                PDF Invoice Preview
              </h3>
            </div>
            
            <div className="flex-1 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950">
              {invoice.pdfReference ? (
                <iframe
                  src={`${invoice.pdfReference}#toolbar=0&navpanes=0`}
                  className="w-full h-full"
                  title="Saved PDF preview"
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center text-stone-500 space-y-3">
                  <p className="text-xs max-w-xs">
                    This invoice was created without a cached PDF reference. Click below to generate and display the preview.
                  </p>
                  <button
                    onClick={async () => {
                      try {
                        toast.loading("Generating preview...", { id: "preview-gen" });
                        const settingsRes = await fetch("/api/settings");
                        const settings = await settingsRes.json();
                        const doc = generateInvoicePDF(invoice, settings);
                        const dataUri = doc.output("datauristring");
                        
                        // Update UI
                        setInvoice((prev) => prev ? { ...prev, pdfReference: dataUri } : null);
                        
                        // Save back to DB
                        await fetch(`/api/invoices/${invoice._id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ pdfReference: dataUri }),
                        });
                        
                        toast.success("Preview generated and saved!", { id: "preview-gen" });
                      } catch (err) {
                        toast.error("Failed to generate preview", { id: "preview-gen" });
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition-all shadow-xs"
                  >
                    Generate Preview
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-scale-in">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center text-red-650 dark:text-red-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg text-stone-900 dark:text-white">
                  Delete Invoice?
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Are you sure you want to delete this invoice? This action is permanent and cannot be undone.
                </p>
              </div>
            </div>
            <div className="px-6 py-4 bg-stone-50 dark:bg-stone-850/50 border-t border-stone-150 dark:border-stone-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-stone-250 dark:border-stone-800 text-stone-705 dark:text-stone-300 font-semibold text-xs hover:bg-stone-50 dark:hover:bg-stone-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteInvoice}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-red-650 hover:bg-red-700 text-white font-semibold text-xs transition-all disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
