"use client";

import React from "react";
import { useCart } from "../context/CartContext";
import { formatEuro } from "../lib/calculations";
import {
  ShoppingBag,
  Info,
  ChevronRight,
} from "lucide-react";

interface HeaderProps {
  onOpenInfo: () => void;
}

export function Header({ onOpenInfo }: HeaderProps) {
  const { restaurant, itemCount, calculation, setIsCartOpen } = useCart();

  // Öffnungszeiten-Status heute
  const currentDay = new Date().getDay();
  const todayHours = restaurant.openingHours.find((h) => h.day === currentDay);
  const timesStr = todayHours && todayHours.isOpen
    ? todayHours.slots.map((s) => `${s.from}–${s.to}`).join(" & ")
    : "Heute Ruhetag";

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 transition-all">
      {/* Top Banner: Qualitätsversprechen / Öffnungszeiten Status */}
      <div className="bg-stone-900 text-stone-200 text-xs py-1.5 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium text-stone-100">
              Heute geöffnet: {timesStr}
            </span>
          </div>
          <button
            onClick={onOpenInfo}
            className="text-stone-300 hover:text-white flex items-center gap-1 underline underline-offset-2 transition-colors cursor-pointer"
          >
            <span>Liefergebiete & Zeiten</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl text-white flex items-center justify-center text-2xl shadow-md"
            style={{ backgroundColor: restaurant.accentColor || "#ea580c" }}
          >
            {restaurant.logo}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg sm:text-xl text-stone-900 leading-tight">
                {restaurant.name}
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-stone-100 text-stone-800 border border-stone-200">
                {restaurant.address.city}
              </span>
            </div>
            <p className="text-xs text-stone-500 line-clamp-1">
              {restaurant.tagline}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenInfo}
            aria-label="Restaurant-Informationen"
            className="p-2.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 transition flex items-center gap-1.5 text-xs font-medium cursor-pointer"
          >
            <Info className="w-4 h-4 text-stone-600" />
            <span className="hidden md:inline">Info & Kontakt</span>
          </button>

          {/* Cart Trigger Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            aria-label={`Warenkorb mit ${itemCount} Artikeln`}
            style={{ backgroundColor: restaurant.accentColor || "#ea580c" }}
            className="relative flex items-center gap-2 text-white font-medium px-4 py-2.5 rounded-xl shadow-md transition-all transform active:scale-95 cursor-pointer hover:opacity-90"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="font-semibold text-sm">
              {calculation.subtotal > 0 ? formatEuro(calculation.total) : "Warenkorb"}
            </span>

            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-stone-900 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
