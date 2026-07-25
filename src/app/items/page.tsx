"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, X, AlertTriangle, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

interface Item {
  _id: string;
  name: string;
  createdAt: string;
}

export default function RestaurantItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [itemNameInput, setItemNameInput] = useState("");
  const [savingItem, setSavingItem] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Item | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/items");
      if (!res.ok) throw new Error("Failed to load items");
      const data = await res.json();
      setItems(data);
    } catch (error) {
      console.error(error);
      toast.error("Could not load restaurant items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Filter items locally based on search input
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingItem(null);
    setItemNameInput("");
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (item: Item) => {
    setEditingItem(item);
    setItemNameInput(item.name);
    setIsAddEditModalOpen(true);
  };

  const handleOpenDelete = (item: Item) => {
    setDeletingItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemNameInput.trim()) {
      toast.error("Item name is required");
      return;
    }

    try {
      setSavingItem(true);
      const url = editingItem ? `/api/items/${editingItem._id}` : "/api/items";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: itemNameInput.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.name?.message || "Failed to save item");
      }

      toast.success(
        editingItem
          ? `"${editingItem.name}" updated to "${itemNameInput.trim()}"`
          : `"${itemNameInput.trim()}" added to menu!`
      );
      
      setIsAddEditModalOpen(false);
      fetchItems();
    } catch (error: any) {
      toast.error(error.message || "Failed to save item");
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!deletingItem) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/items/${deletingItem._id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete item");

      toast.success(`"${deletingItem.name}" deleted successfully.`);
      setIsDeleteModalOpen(false);
      fetchItems();
    } catch (error) {
      console.error(error);
      toast.error("Could not delete item");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
            Restaurant Items
          </h1>
          <p className="text-stone-500 dark:text-stone-400 mt-1">
            Manage the list of items available on your menu.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm transition-all shadow-sm shadow-orange-500/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Restaurant Item
        </button>
      </div>

      {/* Control bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400 dark:text-stone-500">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          placeholder="Search items by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm shadow-xs"
        />
      </div>

      {/* Items list */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-stone-100 dark:bg-stone-900 animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-stone-50 dark:bg-stone-800 flex items-center justify-center text-stone-400 dark:text-stone-500 mb-4">
            <Plus className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-stone-900 dark:text-white">
            {search ? "No items match your search" : "No restaurant items yet"}
          </h3>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-xs">
            {search
              ? "Try adjusting your search terms to find the item."
              : "Add your first restaurant item to start creating invoices."}
          </p>
          {!search && (
            <button
              onClick={handleOpenAdd}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item._id}
              className="flex items-center justify-between p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xs hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="font-semibold text-stone-900 dark:text-white text-base">
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="p-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-450 border border-stone-100 dark:border-stone-800 bg-stone-50/20 dark:bg-stone-900/50"
                  title="Edit Item"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleOpenDelete(item)}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 border border-stone-100 dark:border-stone-800 bg-stone-50/20 dark:bg-stone-900/50"
                  title="Delete Item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Item Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-scale-in">
            <div className="px-6 py-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <h3 className="font-semibold text-lg text-stone-900 dark:text-white">
                {editingItem ? "Edit Restaurant Item" : "Add Restaurant Item"}
              </h3>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 dark:text-stone-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveItem} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tomato Soup"
                  value={itemNameInput}
                  onChange={(e) => setItemNameInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-250 dark:border-stone-800 text-stone-700 dark:text-stone-300 font-medium text-sm hover:bg-stone-50 dark:hover:bg-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingItem}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm transition-all disabled:opacity-50 shadow-sm shadow-orange-500/20"
                >
                  {savingItem ? "Saving..." : editingItem ? "Update Item" : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-scale-in">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center text-red-655 dark:text-red-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg text-stone-900 dark:text-white">
                  Delete Item?
                </h3>
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  Are you sure you want to delete <strong>{deletingItem?.name}</strong>? This item will no longer be available when creating new invoices.
                </p>
              </div>
            </div>
            <div className="px-6 py-4 bg-stone-50 dark:bg-stone-950 border-t border-stone-150 dark:border-stone-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-stone-250 dark:border-stone-800 text-stone-700 dark:text-stone-300 font-medium text-sm hover:bg-stone-50 dark:hover:bg-stone-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteItem}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-all disabled:opacity-50"
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
