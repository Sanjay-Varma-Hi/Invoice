"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeContext";
import {
  LayoutDashboard,
  PlusCircle,
  History,
  Utensils,
  Settings,
  Sun,
  Moon,
  Menu,
  X,
  FileSpreadsheet,
  Store,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [restaurantName, setRestaurantName] = useState("Manager");

  React.useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.restaurantName) {
          setRestaurantName(data.restaurantName);
        }
      })
      .catch((err) => console.error("Error loading sidebar settings:", err));
  }, [pathname]); // Refetch when pathname changes to keep name in sync after settings updates


  const menuItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Create Invoice", href: "/invoices/create", icon: PlusCircle },
    { name: "Invoice History", href: "/invoices/history", icon: History },
    { name: "Restaurant Items", href: "/items", icon: Utensils },
    { name: "Places We Source", href: "/places", icon: Store },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-500 text-white font-bold text-xl shadow-md shadow-orange-500/20">
          <FileSpreadsheet className="w-5 h-5" />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="font-semibold text-base leading-none truncate">
            {restaurantName}
          </span>
          <span className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Invoice Console
          </span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                active
                  ? "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 shadow-sm border-l-4 border-orange-500 pl-3"
                  : "text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/50 hover:text-stone-900 dark:hover:text-stone-100"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "text-orange-500" : ""}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Info */}
      <div className="p-4 border-t border-stone-200 dark:border-stone-800">
        <div className="text-center text-[10px] text-stone-400 dark:text-stone-500">
          Sanjay Varma &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 z-30">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-500 text-white font-bold shadow-sm">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <span className="font-semibold text-sm truncate">{restaurantName}</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-850"
          aria-label="Toggle Menu"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Side Drawer */}
      <div
        className={`md:hidden fixed top-0 bottom-0 left-0 w-64 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </div>
    </>
  );
}
