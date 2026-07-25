"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Calendar,
  Eye,
  Download,
  Printer,
  Edit,
  Copy,
  Trash2,
  Filter,
  X,
  AlertTriangle,
  FileText,
  User,
  ShoppingBag,
  RefreshCw,
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
  items: InvoiceItem[];
  pdfReference?: string;
  createdAt: string;
}

export default function InvoiceHistoryPage() {
  const router = useRouter();
  
  // Data State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchReceivedFrom, setSearchReceivedFrom] = useState("");
  const [searchItemName, setSearchItemName] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Delete Dialog State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (searchReceivedFrom) queryParams.append("searchReceivedFrom", searchReceivedFrom);
      if (searchItemName) queryParams.append("searchItemName", searchItemName);
      if (dateFrom) queryParams.append("dateFrom", dateFrom);
      if (dateTo) queryParams.append("dateTo", dateTo);

      const res = await fetch(`/api/invoices?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch invoices");
      const data = await res.json();
      setInvoices(data);
    } catch (error) {
      console.error(error);
      toast.error("Could not load invoice history");
    } finally {
      setLoading(false);
    }
  };

  // Trigger search on filter changes with debounce or basic useEffect
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchInvoices();
    }, 300); // 300ms debounce
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchReceivedFrom, searchItemName, dateFrom, dateTo]);

  const handleResetFilters = () => {
    setSearchReceivedFrom("");
    setSearchItemName("");
    setDateFrom("");
    setDateTo("");
    toast.success("Filters reset");
  };

  // Actions
  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      if (invoice.pdfReference) {
        // Download from reference link
        const link = document.createElement("a");
        link.href = invoice.pdfReference;
        link.download = `invoice_${invoice._id}.pdf`;
        link.click();
        toast.success("Downloading PDF...");
      } else {
        // Regenerate on-the-fly if reference not uploaded
        toast.loading("Generating PDF...", { id: "gen-pdf" });
        const settingsRes = await fetch("/api/settings");
        const settings = await settingsRes.json();
        const doc = generateInvoicePDF(invoice, settings);
        doc.save(`invoice_${invoice._id}.pdf`);
        toast.success("PDF generated & downloaded!", { id: "gen-pdf" });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to download PDF", { id: "gen-pdf" });
    }
  };

  const handlePrintPDF = async (invoice: Invoice) => {
    try {
      let pdfUrl = invoice.pdfReference;
      if (!pdfUrl) {
        toast.loading("Preparing print layout...", { id: "print-pdf" });
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

  const handleOpenDeleteModal = (invoice: Invoice) => {
    setDeletingInvoice(invoice);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteInvoice = async () => {
    if (!deletingInvoice) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/invoices/${deletingInvoice._id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete invoice");

      toast.success("Invoice deleted successfully");
      setIsDeleteModalOpen(false);
      fetchInvoices();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete invoice");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const hasActiveFilters = searchReceivedFrom || searchItemName || dateFrom || dateTo;

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
            Invoice History
          </h1>
          <p className="text-stone-500 dark:text-stone-400 mt-1">
            Search, filter, view, and print previously created invoices.
          </p>
        </div>
        <Link
          href="/invoices/create"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm transition-all shadow-sm shadow-orange-500/20 self-start sm:self-auto"
        >
          Create Invoice
        </Link>
      </div>

      {/* Advanced Filters Panel */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-stone-800 dark:text-white">
          <Filter className="w-4 h-4 text-orange-500" />
          Filter Invoices
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Received From Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search Received From..."
              value={searchReceivedFrom}
              onChange={(e) => setSearchReceivedFrom(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-xs shadow-xs"
            />
          </div>

          {/* Item Name Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search by Item Name..."
              value={searchItemName}
              onChange={(e) => setSearchItemName(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-xs shadow-xs"
            />
          </div>

          {/* Date From */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
              <Calendar className="w-4 h-4" />
            </div>
            <input
              type="date"
              placeholder="From Date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-white text-xs shadow-xs focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* Date To */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
              <Calendar className="w-4 h-4" />
            </div>
            <input
              type="date"
              placeholder="To Date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-white text-xs shadow-xs focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Clear Filters Indicator */}
        {hasActiveFilters && (
          <div className="flex justify-end">
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400 hover:text-orange-500 font-semibold"
            >
              <X className="w-3.5 h-3.5" />
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Invoices List / Table */}
      {loading ? (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 flex flex-col items-center justify-center py-20 shadow-xs">
          <RefreshCw className="w-10 h-10 text-orange-500 animate-spin" />
          <p className="text-stone-500 dark:text-stone-400 mt-2 text-sm">Loading invoice history...</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs">
          <div className="w-16 h-16 rounded-full bg-stone-50 dark:bg-stone-800 flex items-center justify-center text-stone-400 dark:text-stone-500 mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-stone-900 dark:text-white">
            {hasActiveFilters ? "No matching invoices found" : "No invoices created yet"}
          </h3>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-xs">
            {hasActiveFilters
              ? "Try modifying your search or filter values."
              : "Generate invoices from the creation portal."}
          </p>
          {!hasActiveFilters && (
            <Link
              href="/invoices/create"
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm transition-all"
            >
              Create Invoice
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 bg-stone-50/50 dark:bg-stone-800/50">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Received From</th>
                  <th className="px-6 py-4">Items Count</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-150 dark:divide-stone-800/80">
                {invoices.map((invoice) => (
                  <tr
                    key={invoice._id}
                    className="hover:bg-stone-50/50 dark:hover:bg-stone-800/20 transition-colors"
                  >
                    {/* Date */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600 dark:text-stone-300">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-stone-400" />
                        {formatDate(invoice.date)}
                      </span>
                    </td>

                    {/* Received From */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-stone-900 dark:text-white">
                      <span className="flex items-center gap-2">
                        <User className="w-4 h-4 text-stone-400" />
                        {invoice.receivedFrom}
                      </span>
                    </td>

                    {/* Items Count */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500 dark:text-stone-400">
                      {invoice.items.length} {invoice.items.length === 1 ? "item" : "items"}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/invoices/view/${invoice._id}`}
                          className="p-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-550 dark:text-stone-300 border border-stone-100 dark:border-stone-800 bg-stone-50/20 dark:bg-stone-950/50"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        
                        <button
                          onClick={() => handleDownloadPDF(invoice)}
                          className="p-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-300 border border-stone-100 dark:border-stone-800 bg-stone-50/20 dark:bg-stone-900/50"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4 text-orange-500" />
                        </button>
                        
                        <button
                          onClick={() => handlePrintPDF(invoice)}
                          className="p-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-550 dark:text-stone-300 border border-stone-100 dark:border-stone-800 bg-stone-50/20 dark:bg-stone-900/50"
                          title="Print"
                        >
                          <Printer className="w-4 h-4 text-orange-500" />
                        </button>

                        <button
                          onClick={() => router.push(`/invoices/create?edit=${invoice._id}`)}
                          className="p-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-300 border border-stone-100 dark:border-stone-800 bg-stone-50/20 dark:bg-stone-900/50"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => router.push(`/invoices/create?duplicate=${invoice._id}`)}
                          className="p-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-300 border border-stone-100 dark:border-stone-800 bg-stone-50/20 dark:bg-stone-900/50"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenDeleteModal(invoice)}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-955/20 text-red-500 border border-stone-105 dark:border-stone-800 bg-stone-50/20 dark:bg-stone-900/50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-scale-in">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center text-red-600 dark:text-red-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg text-stone-900 dark:text-white">
                  Delete Invoice?
                </h3>
                <p className="text-xs text-stone-505 dark:text-stone-400">
                  Are you sure you want to delete the invoice from <strong>{deletingInvoice && formatDate(deletingInvoice.date)}</strong> for <strong>{deletingInvoice?.receivedFrom}</strong>? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="px-6 py-4 bg-stone-50 dark:bg-stone-950 border-t border-stone-150 dark:border-stone-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-stone-250 dark:border-stone-800 text-stone-700 dark:text-stone-300 font-semibold text-xs hover:bg-stone-50 dark:hover:bg-stone-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteInvoice}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-all disabled:opacity-50"
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
