"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, X, AlertTriangle, Store } from "lucide-react";
import toast from "react-hot-toast";

interface Place {
  _id: string;
  name: string;
  address?: string;
  createdAt: string;
}

export default function PlacesPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [placeNameInput, setPlaceNameInput] = useState("");
  const [placeAddressInput, setPlaceAddressInput] = useState("");
  const [savingPlace, setSavingPlace] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingPlace, setDeletingPlace] = useState<Place | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPlaces = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/places");
      if (!res.ok) throw new Error("Failed to load places");
      const data = await res.json();
      setPlaces(data);
    } catch (error) {
      console.error(error);
      toast.error("Could not load sources / places");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  // Filter places locally
  const filteredPlaces = places.filter((place) =>
    place.name.toLowerCase().includes(search.toLowerCase()) ||
    (place.address || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingPlace(null);
    setPlaceNameInput("");
    setPlaceAddressInput("");
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (place: Place) => {
    setEditingPlace(place);
    setPlaceNameInput(place.name);
    setPlaceAddressInput(place.address || "");
    setIsAddEditModalOpen(true);
  };

  const handleOpenDelete = (place: Place) => {
    setDeletingPlace(place);
    setIsDeleteModalOpen(true);
  };

  const handleSavePlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeNameInput.trim()) {
      toast.error("Place name is required");
      return;
    }

    try {
      setSavingPlace(true);
      const url = editingPlace ? `/api/places/${editingPlace._id}` : "/api/places";
      const method = editingPlace ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: placeNameInput.trim(),
          address: placeAddressInput.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.name?.message || "Failed to save place");
      }

      toast.success(
        editingPlace
          ? `"${editingPlace.name}" updated!`
          : `"${placeNameInput.trim()}" added to sources!`
      );
      
      setIsAddEditModalOpen(false);
      fetchPlaces();
    } catch (error: any) {
      toast.error(error.message || "Failed to save place");
    } finally {
      setSavingPlace(false);
    }
  };

  const handleDeletePlace = async () => {
    if (!deletingPlace) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/places/${deletingPlace._id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete place");

      toast.success(`"${deletingPlace.name}" deleted successfully.`);
      setIsDeleteModalOpen(false);
      fetchPlaces();
    } catch (error) {
      console.error(error);
      toast.error("Could not delete place");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-stone-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
            Places We Source From
          </h1>
          <p className="text-stone-500 dark:text-stone-400 mt-1">
            Manage places where you source restaurant items from (suppliers, stores, markets).
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm transition-all shadow-sm shadow-orange-500/20 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Sourcing Place
        </button>
      </div>

      {/* Control bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400 dark:text-stone-500">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          placeholder="Search places by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-955 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm shadow-xs bg-stone-950 dark:bg-stone-950"
        />
      </div>

      {/* Places list */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-stone-100 dark:bg-stone-900/60 animate-pulse" />
          ))}
        </div>
      ) : filteredPlaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-stone-50 dark:bg-stone-800 flex items-center justify-center text-stone-400 dark:text-stone-500 mb-4">
            <Store className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-stone-900 dark:text-white">
            {search ? "No places match your search" : "No sourcing places yet"}
          </h3>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-xs">
            {search
              ? "Try adjusting your search terms to find the place."
              : "Add your first sourcing place (e.g. Costco, Local Farm Market)."}
          </p>
          {!search && (
            <button
              onClick={handleOpenAdd}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Place
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPlaces.map((place) => (
            <div
              key={place._id}
              className="flex items-center justify-between p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xs hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <Store className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="font-semibold text-stone-900 dark:text-white text-base">
                    {place.name}
                  </span>
                  {place.address && (
                    <span className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-1">
                      {place.address}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(place)}
                  className="p-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 border border-stone-100 dark:border-stone-800 bg-stone-50/20 dark:bg-stone-900/50 cursor-pointer"
                  title="Edit Place"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleOpenDelete(place)}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-955/20 text-red-500 border border-stone-100 dark:border-stone-800 bg-stone-50/20 dark:bg-stone-900/50 cursor-pointer"
                  title="Delete Place"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Place Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-scale-in">
            <div className="px-6 py-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <h3 className="font-semibold text-lg text-stone-900 dark:text-white">
                {editingPlace ? "Edit Sourcing Place" : "Add Sourcing Place"}
              </h3>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 dark:text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSavePlace} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                  Place Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Costco WholeSale"
                  value={placeNameInput}
                  onChange={(e) => setPlaceNameInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                  Address
                </label>
                <textarea
                  placeholder="e.g. 39029 Cedar Blvd, Newark, CA 94560"
                  value={placeAddressInput}
                  onChange={(e) => setPlaceAddressInput(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm resize-none"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-250 dark:border-stone-800 text-stone-750 dark:text-stone-305 font-medium text-sm hover:bg-stone-50 dark:hover:bg-stone-805 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPlace}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm transition-all disabled:opacity-50 shadow-sm shadow-orange-500/20 cursor-pointer"
                >
                  {savingPlace ? "Saving..." : editingPlace ? "Update Place" : "Add Place"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-scale-in">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center text-red-600 dark:text-red-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg text-stone-900 dark:text-white">
                  Delete Sourcing Place?
                </h3>
                <p className="text-sm text-stone-550 dark:text-stone-400">
                  Are you sure you want to delete <strong>{deletingPlace?.name}</strong>? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="px-6 py-4 bg-stone-50 dark:bg-stone-950 border-t border-stone-150 dark:border-stone-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-stone-250 dark:border-stone-800 text-stone-705 dark:text-stone-300 font-medium text-sm hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePlace}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-all disabled:opacity-50 cursor-pointer"
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
