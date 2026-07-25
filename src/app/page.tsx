"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Utensils,
  Plus,
  ArrowRight,
  TrendingUp,
  History,
  Calendar,
  User,
  ExternalLink,
  Store,
} from "lucide-react";
import toast from "react-hot-toast";

interface Invoice {
  _id: string;
  date: string;
  receivedFrom: string;
  items: any[];
  createdAt: string;
}

interface Item {
  _id: string;
  name: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [itemsCount, setItemsCount] = useState(0);
  const [placesCount, setPlacesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Quick Add Item Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [addingItem, setAddingItem] = useState(false);

  // Quick Add Place Modal state
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
  const [newPlaceName, setNewPlaceName] = useState("");
  const [addingPlace, setAddingPlace] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invoicesRes, itemsRes, placesRes] = await Promise.all([
        fetch("/api/invoices"),
        fetch("/api/items"),
        fetch("/api/places"),
      ]);

      if (!invoicesRes.ok || !itemsRes.ok || !placesRes.ok) {
        throw new Error("Failed to load dashboard data");
      }

      const invoicesData = await invoicesRes.json();
      const itemsData = await itemsRes.json();
      const placesData = await placesRes.json();

      setInvoices(invoicesData);
      setItemsCount(itemsData.length);
      setPlacesCount(placesData.length);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleQuickAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      toast.error("Item name cannot be empty");
      return;
    }

    try {
      setAddingItem(true);
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newItemName }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.name?.message || "Failed to add item");
      }

      toast.success(`"${newItemName}" added successfully!`);
      setNewItemName("");
      setIsModalOpen(false);
      fetchData(); // Refresh counts
    } catch (error: any) {
      toast.error(error.message || "Failed to add item");
    } finally {
      setAddingItem(false);
    }
  };

  const handleQuickAddPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaceName.trim()) {
      toast.error("Place name cannot be empty");
      return;
    }

    try {
      setAddingPlace(true);
      const res = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPlaceName }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.name?.message || "Failed to add place");
      }

      toast.success(`"${newPlaceName}" added successfully!`);
      setNewPlaceName("");
      setIsPlaceModalOpen(false);
      fetchData(); // Refresh counts
    } catch (error: any) {
      toast.error(error.message || "Failed to add place");
    } finally {
      setAddingPlace(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const recentInvoices = invoices.slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-stone-500 dark:text-stone-400 mt-1">
            Overview of your restaurant invoice activities.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsPlaceModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-250 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-805 text-stone-750 dark:text-stone-300 font-medium text-sm transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-orange-500" />
            Quick Add Place
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-250 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-805 text-stone-750 dark:text-stone-300 font-medium text-sm transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-orange-500" />
            Quick Add Item
          </button>
          <Link
            href="/invoices/create"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm transition-all shadow-sm shadow-orange-500/20"
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 rounded-2xl bg-stone-100 dark:bg-stone-900 animate-pulse" />
          <div className="h-32 rounded-2xl bg-stone-100 dark:bg-stone-900 animate-pulse" />
          <div className="h-32 rounded-2xl bg-stone-100 dark:bg-stone-900 animate-pulse" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Total Invoices */}
            <div className="relative overflow-hidden bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 rounded-2xl shadow-xs transition-transform hover:-translate-y-0.5 duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    Total Invoices
                  </p>
                  <h3 className="text-4xl font-bold text-stone-900 dark:text-white mt-2">
                    {invoices.length}
                  </h3>
                </div>
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 dark:bg-orange-500/20">
                  <FileText className="w-6 h-6" />
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-stone-400 dark:text-stone-500 mt-4">
                <TrendingUp className="w-3 h-3 text-orange-500" />
                <span>All-time recorded invoices</span>
              </div>
            </div>

            {/* Total Items */}
            <div className="relative overflow-hidden bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 rounded-2xl shadow-xs transition-transform hover:-translate-y-0.5 duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    Restaurant Items
                  </p>
                  <h3 className="text-4xl font-bold text-stone-900 dark:text-white mt-2">
                    {itemsCount}
                  </h3>
                </div>
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-500/10 text-green-500 dark:bg-green-500/20">
                  <Utensils className="w-6 h-6" />
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-stone-400 dark:text-stone-500 mt-4">
                <Link href="/items" className="text-green-500 hover:underline flex items-center gap-0.5">
                  Manage menu items <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Sourcing Places */}
            <div className="relative overflow-hidden bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 rounded-2xl shadow-xs transition-transform hover:-translate-y-0.5 duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    Sourcing Places
                  </p>
                  <h3 className="text-4xl font-bold text-stone-900 dark:text-white mt-2">
                    {placesCount}
                  </h3>
                </div>
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 dark:bg-blue-500/20">
                  <Store className="w-6 h-6" />
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-stone-400 dark:text-stone-500 mt-4">
                <Link href="/places" className="text-blue-500 hover:underline flex items-center gap-0.5 font-medium">
                  Manage sourcing places <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Invoices Section */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200 dark:border-stone-800">
              <h2 className="text-lg font-semibold text-stone-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-orange-500" />
                Recently Created Invoices
              </h2>
              {invoices.length > 5 && (
                <Link
                  href="/invoices/history"
                  className="text-sm font-medium text-orange-500 hover:text-orange-600 flex items-center gap-1"
                >
                  View All <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>

            {recentInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-16 h-16 rounded-full bg-stone-50 dark:bg-stone-800 flex items-center justify-center text-stone-400 dark:text-stone-500 mb-4">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-stone-900 dark:text-white">
                  No invoices created yet
                </h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-xs">
                  Create your first professional invoice in just a few clicks.
                </p>
                <Link
                  href="/invoices/create"
                  className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Create Invoice
                </Link>
              </div>
            ) : (
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
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80">
                    {recentInvoices.map((invoice) => (
                      <tr
                        key={invoice._id}
                        className="hover:bg-stone-50/50 dark:hover:bg-stone-800/20 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600 dark:text-stone-300">
                          <span className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-stone-400" />
                            {formatDate(invoice.date)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-stone-900 dark:text-white">
                          <span className="flex items-center gap-2">
                            <User className="w-4 h-4 text-stone-400" />
                            {invoice.receivedFrom}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500 dark:text-stone-400">
                          {invoice.items.length} {invoice.items.length === 1 ? "item" : "items"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <Link
                            href={`/invoices/view/${invoice._id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-250 dark:border-stone-800 text-xs font-medium text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                          >
                            View
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Quick Add Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-scale-in">
            <div className="px-6 py-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <h3 className="font-semibold text-lg text-stone-900 dark:text-white">
                Quick Add Restaurant Item
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 dark:text-stone-500 cursor-pointer"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleQuickAddItem} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Garlic Bread"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-250 dark:border-stone-800 text-stone-700 dark:text-stone-300 font-medium text-sm hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingItem}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm transition-all disabled:opacity-50 shadow-sm shadow-orange-500/20 cursor-pointer"
                >
                  {addingItem ? "Adding..." : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Place Modal */}
      {isPlaceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-scale-in">
            <div className="px-6 py-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <h3 className="font-semibold text-lg text-stone-900 dark:text-white">
                Quick Add Sourcing Place
              </h3>
              <button
                onClick={() => setIsPlaceModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 dark:text-stone-500 cursor-pointer"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleQuickAddPlace} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                  Place Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Costco Wholesale"
                  value={newPlaceName}
                  onChange={(e) => setNewPlaceName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPlaceModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-250 dark:border-stone-800 text-stone-700 dark:text-stone-300 font-medium text-sm hover:bg-stone-50 dark:hover:bg-stone-805 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingPlace}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm transition-all disabled:opacity-50 shadow-sm shadow-orange-500/20 cursor-pointer"
                >
                  {addingPlace ? "Adding..." : "Add Place"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
