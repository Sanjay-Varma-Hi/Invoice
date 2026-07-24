"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InvoiceValidationSchema } from "@/lib/validation";
import { generateInvoicePDF } from "@/lib/pdf";
import {
  Calendar,
  User,
  Plus,
  Trash2,
  X,
  Sparkles,
  Download,
  Printer,
  ChevronDown,
  RefreshCw,
  Search,
  CheckCircle2,
  ArrowRight,
  PlusCircle,
  Edit,
  Copy,
  MapPin,
} from "lucide-react";
import toast from "react-hot-toast";

import { z } from "zod";

type InvoiceFormData = z.input<typeof InvoiceValidationSchema>;

interface RestaurantItem {
  _id: string;
  name: string;
}

interface SourcingPlace {
  _id: string;
  name: string;
  address?: string;
}

function CreateInvoiceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const duplicateId = searchParams.get("duplicate");

  // Edit states
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  
  // Available resources from DB
  const [restaurantItems, setRestaurantItems] = useState<RestaurantItem[]>([]);
  const [sourcingPlaces, setSourcingPlaces] = useState<SourcingPlace[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [placesLoading, setPlacesLoading] = useState(true);
  
  // PDF Preview and workflow state
  const [isConfirming, setIsConfirming] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string>("");
  const [generatedPdfDoc, setGeneratedPdfDoc] = useState<any>(null);
  const [createdInvoiceId, setCreatedInvoiceId] = useState<string>("");

  // Search filter states for each row's item select
  const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);
  const [dropdownSearch, setDropdownSearch] = useState("");
  const dropdownRef = useRef<HTMLTableCellElement>(null);

  // Sourcing Place select states
  const [isPlacesDropdownOpen, setIsPlacesDropdownOpen] = useState(false);
  const [placesSearch, setPlacesSearch] = useState("");
  const placesDropdownRef = useRef<HTMLDivElement>(null);

  // Default values: date defaults to today
  const todayStr = new Date().toISOString().substring(0, 10);
  
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(InvoiceValidationSchema),
    defaultValues: {
      date: todayStr,
      receivedFrom: "",
      receivedFromAddress: "",
      receivedFromId: "",
      items: [{ itemId: "", itemName: "", quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // Watch values for auto-draft saving
  const watchedValues = watch();

  // Load items and places from DB on mount
  useEffect(() => {
    const loadResources = async () => {
      try {
        setItemsLoading(true);
        setPlacesLoading(true);
        const [itemsRes, placesRes] = await Promise.all([
          fetch("/api/items"),
          fetch("/api/places"),
        ]);

        if (!itemsRes.ok) throw new Error("Failed to load restaurant items");
        if (!placesRes.ok) throw new Error("Failed to load sourcing places");

        const itemsData = await itemsRes.json();
        const placesData = await placesRes.json();

        setRestaurantItems(itemsData);
        setSourcingPlaces(placesData);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load database resources. Add items and places first!");
      } finally {
        setItemsLoading(false);
        setPlacesLoading(false);
      }
    };
    loadResources();
  }, []);

  // Restore draft or load edit/duplicate invoice on mount
  useEffect(() => {
    const loadInvoiceForForm = async (id: string, isDuplicate: boolean) => {
      try {
        setItemsLoading(true);
        const res = await fetch(`/api/invoices/${id}`);
        if (!res.ok) throw new Error("Failed to load invoice data");
        const invoice = await res.json();
        
        // Setup form values
        const formattedDate = new Date(invoice.date).toISOString().substring(0, 10);
        reset({
          date: isDuplicate ? todayStr : formattedDate,
          receivedFrom: isDuplicate ? `${invoice.receivedFrom} (Copy)` : invoice.receivedFrom,
          receivedFromAddress: invoice.receivedFromAddress || "",
          receivedFromId: invoice.receivedFromId || "",
          items: invoice.items.map((item: any) => ({
            itemId: item.itemId,
            itemName: item.itemName,
            quantity: item.quantity,
          })),
        });

        if (!isDuplicate) {
          setEditingInvoiceId(id);
        }
        toast.success(isDuplicate ? "Duplicated invoice loaded!" : "Invoice loaded for editing!");
      } catch (err) {
        console.error(err);
        toast.error("Failed to load invoice");
      } finally {
        setItemsLoading(false);
      }
    };

    if (editId) {
      loadInvoiceForForm(editId, false);
    } else if (duplicateId) {
      loadInvoiceForForm(duplicateId, true);
    } else {
      // Restore draft if we are creating a fresh invoice
      const draft = localStorage.getItem("invoice_draft");
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          if (parsed.date) {
            parsed.date = new Date(parsed.date).toISOString().substring(0, 10);
          }
          reset(parsed);
          toast.success("Restored invoice draft", { id: "draft-restore" });
        } catch (err) {
          console.error("Error restoring draft", err);
        }
      }
    }
  }, [editId, duplicateId, reset, todayStr]);

  // Auto-save draft on form value changes (only if NOT in edit mode)
  useEffect(() => {
    if (editingInvoiceId) return; // Don't overwrite draft with edited values automatically
    
    if (
      watchedValues.receivedFrom ||
      (watchedValues.items && watchedValues.items.some((i) => i.itemId || i.quantity > 1))
    ) {
      localStorage.setItem("invoice_draft", JSON.stringify(watchedValues));
    }
  }, [watchedValues, editingInvoiceId]);

  // Handle outside clicks to close item and place dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdownIndex(null);
      }
      if (placesDropdownRef.current && !placesDropdownRef.current.contains(event.target as Node)) {
        setIsPlacesDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectItem = (index: number, item: RestaurantItem) => {
    setValue(`items.${index}.itemId`, item._id);
    setValue(`items.${index}.itemName`, item.name);
    setActiveDropdownIndex(null);
    setDropdownSearch("");
  };

  const handleSelectPlace = (place: SourcingPlace) => {
    setValue("receivedFrom", place.name);
    setValue("receivedFromAddress", place.address || "");
    setValue("receivedFromId", place._id);
    setIsPlacesDropdownOpen(false);
    setPlacesSearch("");
  };

  const handleClearInvoice = () => {
    reset({
      date: todayStr,
      receivedFrom: "",
      receivedFromAddress: "",
      receivedFromId: "",
      items: [{ itemId: "", itemName: "", quantity: 1 }],
    });
    setEditingInvoiceId(null);
    localStorage.removeItem("invoice_draft");
    toast.success("Invoice cleared");
    router.replace("/invoices/create"); // Clear search params
  };

  // Submit Handler: Saves or updates invoice in DB, generates PDF, shows preview
  const onSubmit = async (data: InvoiceFormData) => {
    try {
      setIsConfirming(true);
      
      const isEdit = !!editingInvoiceId;
      const url = isEdit ? `/api/invoices/${editingInvoiceId}` : "/api/invoices";
      const method = isEdit ? "PUT" : "POST";

      // 1. Save/Update Invoice in MongoDB
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save invoice");
      }

      const savedInvoice = await res.json();
      setCreatedInvoiceId(savedInvoice._id);

      // 2. Fetch Restaurant Settings for PDF styling
      const settingsRes = await fetch("/api/settings");
      if (!settingsRes.ok) throw new Error("Failed to load restaurant settings");
      const settingsData = await settingsRes.json();

      // 3. Generate PDF automatically using client-side helper
      const doc = generateInvoicePDF(savedInvoice, settingsData);
      setGeneratedPdfDoc(doc);

      // 4. Create Blob URL for preview
      const blob = doc.output("blob");
      const blobUrl = URL.createObjectURL(blob);
      setPdfBlobUrl(blobUrl);

      // 5. Convert PDF to base64 data string and upload/PATCH reference to Invoice
      const pdfBase64 = doc.output("datauristring");
      const patchRes = await fetch(`/api/invoices/${savedInvoice._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfReference: pdfBase64 }),
      });

      if (!patchRes.ok) {
        console.error("Failed to upload PDF reference to invoice");
      }

      // Clear draft locally after successful submit
      if (!isEdit) {
        localStorage.removeItem("invoice_draft");
      }
      
      toast.success(isEdit ? "Invoice updated and confirmed!" : "Invoice confirmed and saved!");
      setShowPreviewModal(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to confirm invoice");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!generatedPdfDoc || !createdInvoiceId) return;
    generatedPdfDoc.save(`invoice_${createdInvoiceId}.pdf`);
    toast.success("PDF downloaded!");
  };

  const handlePrintPDF = () => {
    if (!pdfBlobUrl) return;
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = pdfBlobUrl;
    document.body.appendChild(iframe);
    iframe.contentWindow?.print();
  };

  // Filter items in active row dropdown based on search
  const filteredMenuItems = restaurantItems.filter((item) =>
    item.name.toLowerCase().includes(dropdownSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-white flex items-center gap-2">
            {editingInvoiceId ? (
              <>
                <Edit className="w-7 h-7 text-orange-500" />
                Edit Invoice
              </>
            ) : duplicateId ? (
              <>
                <Copy className="w-7 h-7 text-orange-500" />
                Duplicate Invoice
              </>
            ) : (
              "Create Invoice"
            )}
          </h1>
          <p className="text-stone-500 dark:text-stone-400 mt-1">
            {editingInvoiceId
              ? "Modify details of an existing invoice and update."
              : "Build a new invoice using items from your menu database."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Invoice Header Card */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date Picker */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-semibold text-stone-700 dark:text-stone-300">
              <Calendar className="w-4 h-4 text-stone-450" />
              Invoice Date
            </label>
            <input
              type="date"
              {...register("date")}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm shadow-xs"
            />
            {errors.date && (
              <p className="text-xs text-red-500 font-medium">{errors.date.message}</p>
            )}
          </div>

          {/* Received From Sourcing Place */}
          <div className="space-y-1.5 relative" ref={placesDropdownRef}>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-stone-700 dark:text-stone-300">
              <User className="w-4 h-4 text-stone-450" />
              Received From (Place)
            </label>
            <div>
              <button
                type="button"
                onClick={() => {
                  setIsPlacesDropdownOpen(!isPlacesDropdownOpen);
                  setPlacesSearch("");
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm text-left transition-all ${
                  watch("receivedFrom")
                    ? "border-stone-300 dark:border-stone-700 bg-stone-50/20 dark:bg-stone-900 text-stone-900 dark:text-white"
                    : "border-stone-300 dark:border-stone-700 text-stone-400 bg-white dark:bg-stone-950"
                }`}
              >
                <span className="truncate">
                  {watch("receivedFrom") || "Search & Select supplier place..."}
                </span>
                <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />
              </button>
              <input
                type="hidden"
                {...register("receivedFrom")}
              />
              <input
                type="hidden"
                {...register("receivedFromId")}
              />
            </div>

            {/* Places Dropdown Container */}
            {isPlacesDropdownOpen && (
              <div className="absolute left-0 right-0 top-[100%] mt-1 z-35 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-lg max-h-60 overflow-hidden flex flex-col animate-scale-in">
                {/* Search bar inside dropdown */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-stone-200 dark:border-stone-800">
                  <Search className="w-4 h-4 text-stone-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Type to filter places..."
                    value={placesSearch}
                    onChange={(e) => setPlacesSearch(e.target.value)}
                    className="w-full bg-transparent text-sm focus:outline-hidden text-stone-900 dark:text-white"
                    autoFocus
                  />
                </div>

                {/* Options list */}
                <div className="overflow-y-auto flex-1 py-1 max-h-48">
                  {placesLoading ? (
                    <div className="px-4 py-2.5 text-xs text-stone-400">Loading places...</div>
                  ) : sourcingPlaces.filter(p => p.name.toLowerCase().includes(placesSearch.toLowerCase())).length === 0 ? (
                    <div className="px-4 py-2.5 text-xs text-stone-400 flex flex-col gap-1">
                      <span>No sourcing places found.</span>
                      <button
                        type="button"
                        onClick={() => router.push("/places")}
                        className="text-orange-500 font-semibold hover:underline text-[11px] self-start cursor-pointer"
                      >
                        Go to Places page to add
                      </button>
                    </div>
                  ) : (
                    sourcingPlaces
                      .filter(p => p.name.toLowerCase().includes(placesSearch.toLowerCase()))
                      .map((place) => (
                        <button
                          key={place._id}
                          type="button"
                          onClick={() => handleSelectPlace(place)}
                          className="w-full text-left px-4 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/80 transition-colors truncate cursor-pointer"
                        >
                          <div className="font-medium text-stone-900 dark:text-white">{place.name}</div>
                          {place.address && (
                            <div className="text-[11px] text-stone-400 dark:text-stone-500 truncate mt-0.5">{place.address}</div>
                          )}
                        </button>
                      ))
                  )}
                </div>
              </div>
            )}
            {errors.receivedFrom && (
              <p className="text-xs text-red-500 font-medium">{errors.receivedFrom.message}</p>
            )}
          </div>

          {/* Received From Address */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-semibold text-stone-700 dark:text-stone-300">
              <MapPin className="w-4 h-4 text-stone-450" />
              Received From Address (Supplier / Place Address)
            </label>
            <textarea
              {...register("receivedFromAddress")}
              placeholder="Supplier address will be filled automatically when a place is selected, or type it here..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm shadow-xs resize-none"
            />
            {errors.receivedFromAddress && (
              <p className="text-xs text-red-500 font-medium">{errors.receivedFromAddress.message}</p>
            )}
          </div>
        </div>

        {/* Invoice Items Table Card */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850/50 flex items-center justify-between">
            <h2 className="font-semibold text-stone-800 dark:text-white text-sm">
              Items Breakdown
            </h2>
            <span className="text-xs text-stone-400 dark:text-stone-500">
              {fields.length} {fields.length === 1 ? "Row" : "Rows"}
            </span>
          </div>

          <div className="overflow-x-visible min-w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                  <th className="px-6 py-3 w-16">S.No</th>
                  <th className="px-6 py-3">Item Name</th>
                  <th className="px-6 py-3 w-32">Quantity</th>
                  <th className="px-6 py-3 w-20 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-150 dark:divide-stone-800/80">
                {fields.map((field, index) => (
                  <tr key={field.id} className="hover:bg-stone-50/30 dark:hover:bg-stone-800/10">
                    {/* S.No */}
                    <td className="px-6 py-4 text-sm font-medium text-stone-500 dark:text-stone-400 align-middle">
                      {index + 1}
                    </td>

                    {/* Searchable Item select */}
                    <td className="px-6 py-4 relative align-middle" ref={index === activeDropdownIndex ? dropdownRef : null}>
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDropdownIndex(index);
                            setDropdownSearch("");
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl border text-sm text-left transition-all ${
                            watch(`items.${index}.itemName`)
                              ? "border-stone-300 dark:border-stone-700 bg-stone-50/20 dark:bg-stone-900 text-stone-900 dark:text-white"
                              : "border-stone-300 dark:border-stone-700 text-stone-400 bg-white dark:bg-stone-950"
                          }`}
                        >
                          <span className="truncate">
                            {watch(`items.${index}.itemName`) || "Search & Select menu item..."}
                          </span>
                          <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />
                        </button>
                        <input
                          type="hidden"
                          {...register(`items.${index}.itemId`)}
                        />
                        <input
                          type="hidden"
                          {...register(`items.${index}.itemName`)}
                        />
                      </div>

                      {/* Dropdown Container */}
                      {index === activeDropdownIndex && (
                        <div className="absolute left-6 right-6 top-[80%] mt-1 z-30 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-lg max-h-60 overflow-hidden flex flex-col animate-scale-in">
                          {/* Search bar inside dropdown */}
                          <div className="flex items-center gap-2 px-3 py-2 border-b border-stone-200 dark:border-stone-800">
                            <Search className="w-4 h-4 text-stone-400 shrink-0" />
                            <input
                              type="text"
                              placeholder="Type to filter..."
                              value={dropdownSearch}
                              onChange={(e) => setDropdownSearch(e.target.value)}
                              className="w-full bg-transparent text-sm focus:outline-hidden text-stone-900 dark:text-white"
                              autoFocus
                            />
                          </div>

                          {/* Options list */}
                          <div className="overflow-y-auto flex-1 py-1 max-h-48">
                            {itemsLoading ? (
                              <div className="px-4 py-2.5 text-xs text-stone-400">Loading menu...</div>
                            ) : filteredMenuItems.length === 0 ? (
                              <div className="px-4 py-2.5 text-xs text-stone-400 flex flex-col gap-1">
                                <span>No items found.</span>
                                <button
                                  type="button"
                                  onClick={() => router.push("/items")}
                                  className="text-orange-500 font-semibold hover:underline text-[11px] self-start"
                                >
                                  Go to Items page to add
                                </button>
                              </div>
                            ) : (
                              filteredMenuItems.map((item) => (
                                <button
                                  key={item._id}
                                  type="button"
                                  onClick={() => handleSelectItem(index, item)}
                                  className="w-full text-left px-4 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/80 transition-colors truncate"
                                >
                                  {item.name}
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Quantity */}
                    <td className="px-6 py-4 align-middle">
                      <input
                        type="number"
                        min="1"
                        {...register(`items.${index}.quantity`, {
                          valueAsNumber: true,
                          min: 1,
                        })}
                        placeholder="1"
                        className="w-24 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-white focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm text-center shadow-xs"
                      />
                    </td>

                    {/* Delete row */}
                    <td className="px-6 py-4 text-center align-middle">
                      <button
                        type="button"
                        onClick={() => {
                          if (fields.length > 1) {
                            remove(index);
                          } else {
                            toast.error("At least one row is required");
                          }
                        }}
                        disabled={fields.length <= 1}
                        className="p-2 rounded-lg text-stone-400 dark:text-stone-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Remove row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add item row button */}
          <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/20 dark:bg-stone-900/10 flex items-center justify-between">
            <button
              type="button"
              onClick={() => append({ itemId: "", itemName: "", quantity: 1 })}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stone-250 dark:border-stone-800 text-xs font-semibold text-stone-750 dark:text-stone-300 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-850 cursor-pointer shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-orange-500" />
              Add Item Row
            </button>
            {errors.items && (
              <p className="text-xs text-red-500 font-medium">{errors.items.message}</p>
            )}
          </div>
        </div>

        {/* Form Actions bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <button
            type="button"
            onClick={handleClearInvoice}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-stone-250 dark:border-stone-800 text-stone-700 dark:text-stone-300 font-semibold text-sm hover:bg-stone-50 dark:hover:bg-stone-800/80 transition-colors"
          >
            Clear Invoice
          </button>
          
          <button
            type="submit"
            disabled={isConfirming}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-all disabled:opacity-50 shadow-md shadow-orange-500/20 cursor-pointer"
          >
            {isConfirming ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {editingInvoiceId ? "Save Changes" : "Confirm Invoice"}
              </>
            )}
          </button>
        </div>

      </form>

      {/* Invoice PDF Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-850/50">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <h3 className="font-bold text-lg text-stone-900 dark:text-white">
                  {editingInvoiceId ? "Invoice Updated & Confirmed" : "Invoice Confirmed & Saved"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  router.push("/invoices/history");
                }}
                className="p-1.5 rounded-lg hover:bg-stone-150 dark:hover:bg-stone-800 text-stone-400 dark:text-stone-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / PDF Preview */}
            <div className="flex-1 p-6 bg-stone-100 dark:bg-stone-950 overflow-y-auto">
              {pdfBlobUrl ? (
                <div className="w-full h-[55vh] rounded-xl overflow-hidden border border-stone-300 dark:border-stone-800 bg-white">
                  <iframe
                    src={`${pdfBlobUrl}#toolbar=0&navpanes=0`}
                    className="w-full h-full"
                    title="Invoice PDF Preview"
                  />
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-sm text-stone-500">
                  Preparing PDF Preview...
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="px-6 py-4 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleDownloadPDF}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-stone-250 dark:border-stone-800 text-stone-700 dark:text-stone-300 font-semibold text-xs bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-850 transition-colors"
                >
                  <Download className="w-4 h-4 text-orange-500" />
                  Download PDF
                </button>
                <button
                  onClick={handlePrintPDF}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-stone-250 dark:border-stone-800 text-stone-700 dark:text-stone-300 font-semibold text-xs bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-850 transition-colors"
                >
                  <Printer className="w-4 h-4 text-orange-500" />
                  Print PDF
                </button>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    reset({
                      date: todayStr,
                      receivedFrom: "",
                      items: [{ itemId: "", itemName: "", quantity: 1 }],
                    });
                    setEditingInvoiceId(null);
                    localStorage.removeItem("invoice_draft");
                    router.replace("/invoices/create"); // Clear query parameters
                  }}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-orange-500 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20 font-semibold text-xs transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  Create New Invoice
                </button>
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    router.push("/invoices/history");
                  }}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition-all shadow-sm shadow-orange-500/20"
                >
                  Go to History
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateInvoicePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="text-stone-500 dark:text-stone-400 mt-2 text-sm">Loading form...</p>
      </div>
    }>
      <CreateInvoiceForm />
    </Suspense>
  );
}
