"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SettingsValidationSchema } from "@/lib/validation";
import { Store, MapPin, Phone, MessageSquare, Upload, Save, Loader2, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";

type SettingsFormData = {
  restaurantName: string;
  address: string;
  phone: string;
  footerMessage: string;
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoBase64, setLogoBase64] = useState<string>("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(SettingsValidationSchema.omit({ logo: true })), // Validate text fields with Zod
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) throw new Error("Failed to load settings");
        const data = await res.json();
        
        setValue("restaurantName", data.restaurantName);
        setValue("address", data.address);
        setValue("phone", data.phone);
        setValue("footerMessage", data.footerMessage);
        if (data.logo) {
          setLogoBase64(data.logo);
        }
      } catch (error) {
        console.error(error);
        toast.error("Error loading settings");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [setValue]);

  // Handle Logo image upload and convert to base64
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo file size must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoBase64(reader.result as string);
      toast.success("Logo uploaded and updated in memory!");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoBase64("");
    toast.success("Logo removed in memory!");
  };

  const onSubmit = async (data: SettingsFormData) => {
    try {
      setSaving(true);
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          logo: logoBase64,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save settings");
      }

      toast.success("Settings saved successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="text-stone-500 dark:text-stone-400 mt-2 text-sm">Loading restaurant settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
          Settings
        </h1>
        <p className="text-stone-500 dark:text-stone-400 mt-1">
          Configure details printed on your invoice and PDF templates.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-6">
          
          {/* Logo Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300">
              Restaurant Logo
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 bg-stone-50/55 dark:bg-stone-950/20">
              {logoBase64 ? (
                <div className="relative group w-24 h-24 rounded-xl overflow-hidden border border-stone-250 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center justify-center p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoBase64}
                    alt="Logo Preview"
                    className="max-w-full max-h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="text-xs font-medium text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-xl border border-stone-200 dark:border-stone-805 bg-stone-100 dark:bg-stone-850 flex flex-col items-center justify-center text-stone-400 dark:text-stone-500">
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-[10px] mt-1 font-medium">No Logo</span>
                </div>
              )}
              <div className="flex-1 text-center sm:text-left space-y-2">
                <p className="text-xs text-stone-500 dark:text-stone-405">
                  Upload an image for your restaurant invoice PDF header. File size should be under 2MB.
                </p>
                <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stone-250 dark:border-stone-800 text-xs font-semibold text-stone-750 dark:text-stone-300 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-850 cursor-pointer shadow-xs transition-colors">
                  <Upload className="w-3.5 h-3.5 text-orange-500" />
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          <hr className="border-stone-150 dark:border-stone-800/80" />

          {/* Restaurant details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Name */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-stone-700 dark:text-stone-300">
                <Store className="w-4 h-4 text-stone-400" />
                Restaurant Name
              </label>
              <input
                type="text"
                {...register("restaurantName")}
                placeholder="e.g. Bella Italia"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm shadow-xs"
              />
              {errors.restaurantName && (
                <p className="text-xs text-red-500 font-medium">{errors.restaurantName.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-stone-700 dark:text-stone-300">
                <Phone className="w-4 h-4 text-stone-400" />
                Phone Number
              </label>
              <input
                type="text"
                {...register("phone")}
                placeholder="e.g. +1 555-0199"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm shadow-xs"
              />
              {errors.phone && (
                <p className="text-xs text-red-500 font-medium">{errors.phone.message}</p>
              )}
            </div>

            {/* Address */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-stone-700 dark:text-stone-300">
                <MapPin className="w-4 h-4 text-stone-400" />
                Restaurant Address
              </label>
              <textarea
                {...register("address")}
                placeholder="e.g. 123 Main Street, Suite 4B, Cityville"
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm shadow-xs resize-none"
              />
              {errors.address && (
                <p className="text-xs text-red-500 font-medium">{errors.address.message}</p>
              )}
            </div>

            {/* Footer Message */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-stone-700 dark:text-stone-300">
                <MessageSquare className="w-4 h-4 text-stone-400" />
                Footer Message (Thank You)
              </label>
              <input
                type="text"
                {...register("footerMessage")}
                placeholder="e.g. Thank You! Please visit again."
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm shadow-xs"
              />
              {errors.footerMessage && (
                <p className="text-xs text-red-500 font-medium">{errors.footerMessage.message}</p>
              )}
            </div>

          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-all disabled:opacity-50 shadow-md shadow-orange-500/20 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
