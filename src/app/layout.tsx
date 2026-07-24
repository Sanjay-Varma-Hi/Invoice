import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeContext";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Restaurant Invoice Manager",
  description: "Create and manage invoices for your restaurant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="h-full bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col md:flex-row">
        <ThemeProvider>
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            <div className="flex-1 py-6 px-4 md:py-10 md:px-8 max-w-6xl w-full mx-auto">
              {children}
            </div>
          </main>
          <Toaster
            position="top-right"
            toastOptions={{
              className: "dark:bg-stone-900 dark:text-stone-100 border dark:border-stone-800",
              duration: 3000,
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
