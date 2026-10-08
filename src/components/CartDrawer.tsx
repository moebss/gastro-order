"use client";

import React from "react";
import { useCart } from "../context/CartContext";
import { formatEuro } from "../lib/calculations";
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Bike,
  Store,
} from "lucide-react";

interface CartDrawerProps {
  onProceedToCheckout: () => void;
}

export function CartDrawer({ onProceedToCheckout }: CartDrawerProps) {
  const {
    restaurant,
    items,
    orderType,
    setOrderType,
    selectedPlz,
    setSelectedPlz,
    calculation,
    updateQuantity,
    removeItem,
    clearCart,
    isCartOpen,
    setIsCartOpen,
  } = useCart();

  if (!isCartOpen) return null;

  const currentZone = restaurant.deliveryZones.find(
    (z) => z.plz === selectedPlz
  );

  const canCheckout =
    items.length > 0 &&
    (orderType === "pickup" || calculation.isMinOrderReached);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg text-white flex items-center justify-center font-bold text-sm"
              style={{ backgroundColor: restaurant.accentColor || "#ea580c" }}
            >
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-stone-900 text-base leading-tight">
                Dein Warenkorb
              </h2>
              <p className="text-xs text-stone-500">
                {items.length === 0
                  ? "Leer"
                  : `${items.reduce((s, i) => s + i.quantity, 0)} Artikel bei ${restaurant.name}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-stone-400 hover:text-rose-600 transition-colors px-2 py-1"
                title="Warenkorb leeren"
              >
                Leeren
              </button>
            )}
            <button
              onClick={() => setIsCartOpen(false)}
              className="w-8 h-8 rounded-full bg-stone-200/80 hover:bg-stone-300 text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bestellart Schalter (Lieferung / Abholung) */}
        <div className="p-4 border-b border-stone-100 bg-white">
          <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-xl">
            <button
              type="button"
              onClick={() => setOrderType("delivery")}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                orderType === "delivery"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <Bike className="w-4 h-4 text-orange-600" />
              <span>Lieferung</span>
            </button>
            <button
              type="button"
              onClick={() => setOrderType("pickup")}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                orderType === "pickup"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <Store className="w-4 h-4 text-stone-700" />
              <span>Abholung</span>
            </button>
          </div>

          {/* Wenn Lieferung: PLZ-Auswahl & Mindestbestellwert-Check */}
          {orderType === "delivery" && (
            <div className="mt-3 pt-3 border-t border-stone-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500 font-medium">Liefergebiet:</span>
                <select
                  value={selectedPlz}
                  onChange={(e) => setSelectedPlz(e.target.value)}
                  className="bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs font-semibold text-stone-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  {restaurant.deliveryZones.map((z) => (
                    <option key={z.plz} value={z.plz}>
                      {z.plz} {z.areaName} (Min. {formatEuro(z.minOrder)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Progress bar Mindestbestellwert */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  {calculation.isMinOrderReached ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mindestbestellwert erreicht!
                    </span>
                  ) : (
                    <span className="text-amber-700 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Noch {formatEuro(calculation.minOrderDelta)} bis zum Mindestbestellwert
                    </span>
                  )}
                  <span className="text-stone-500">
                    Min. {formatEuro(calculation.minOrderRequired)}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      calculation.isMinOrderReached ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        (calculation.subtotal / (calculation.minOrderRequired || 1)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Artikelliste */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-stone-100">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
              <ShoppingBag className="w-12 h-12 stroke-1 text-stone-300 mb-3" />
              <p className="font-semibold text-stone-700 text-sm">
                Dein Warenkorb ist noch leer
              </p>
              <p className="text-xs text-stone-400 mt-1 max-w-xs">
                Wähle köstliche Gerichte aus der Speisekarte von {restaurant.name}.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.cartLineId} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-stone-400">
                        #{item.number}
                      </span>
                      <h4 className="font-bold text-stone-900 text-sm">
                        {item.name}
                      </h4>
                    </div>

                    {item.selectedSize && (
                      <p className="text-xs text-stone-600 font-medium mt-0.5">
                        {item.selectedSize.name}
                      </p>
                    )}

                    {item.selectedExtras && item.selectedExtras.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {item.selectedExtras.map((ext) => (
                          <li
                            key={ext.id}
                            className="text-[11px] text-stone-500 flex items-center justify-between"
                          >
                            <span>+ {ext.name}</span>
                            {ext.price > 0 && (
                              <span className="font-medium text-stone-700">
                                {formatEuro(ext.price)}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}

                    {item.comment && (
                      <p className="text-[11px] text-amber-800 bg-amber-50 rounded px-1.5 py-0.5 mt-1 italic">
                        „{item.comment}“
                      </p>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="font-bold text-stone-900 text-sm">
                      {formatEuro(item.totalPrice)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2.5">
                  <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50">
                    <button
                      onClick={() => updateQuantity(item.cartLineId, -1)}
                      className="p-1.5 text-stone-600 hover:text-stone-900 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-7 text-center text-xs font-bold text-stone-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.cartLineId, 1)}
                      className="p-1.5 text-stone-600 hover:text-stone-900 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.cartLineId)}
                    className="text-stone-400 hover:text-rose-600 p-1.5 transition-colors cursor-pointer"
                    title="Entfernen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 space-y-3">
            <div className="space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Zwischensumme</span>
                <span className="font-semibold text-stone-900">
                  {formatEuro(calculation.subtotal)}
                </span>
              </div>

              {orderType === "delivery" ? (
                <div className="flex justify-between">
                  <span>Liefergebühr ({currentZone?.areaName || selectedPlz})</span>
                  <span className="font-semibold text-stone-900">
                    {formatEuro(calculation.deliveryFee)}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between text-emerald-700">
                  <span>Abholung vor Ort</span>
                  <span className="font-semibold">Kostenlos</span>
                </div>
              )}

              <div className="pt-2 border-t border-stone-200/80 text-[11px] text-stone-500 space-y-0.5">
                <div className="flex justify-between">
                  <span>inkl. 7% MwSt. (Speisen)</span>
                  <span>{formatEuro(calculation.vat7)}</span>
                </div>
                {calculation.vat19 > 0 && (
                  <div className="flex justify-between">
                    <span>inkl. 19% MwSt. (Getränke / Service)</span>
                    <span>{formatEuro(calculation.vat19)}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-stone-200 flex justify-between text-base font-extrabold text-stone-900">
                <span>Gesamtsumme</span>
                <span style={{ color: restaurant.accentColor || "#ea580c" }}>
                  {formatEuro(calculation.total)}
                </span>
              </div>
            </div>

            {!canCheckout && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                Der Mindestbestellwert von {formatEuro(calculation.minOrderRequired)} für PLZ {selectedPlz} ist noch nicht erreicht. Bitte füge weitere Artikel für mind. {formatEuro(calculation.minOrderDelta)} hinzu.
              </div>
            )}

            <button
              type="button"
              disabled={!canCheckout}
              onClick={() => {
                setIsCartOpen(false);
                onProceedToCheckout();
              }}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                canCheckout
                  ? "bg-stone-900 hover:bg-black text-white shadow-stone-900/20 active:scale-[0.99]"
                  : "bg-stone-300 text-stone-500 cursor-not-allowed shadow-none"
              }`}
            >
              <span>Zur Kasse</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function MobileCartBar({ onOpen }: { onOpen: () => void }) {
  const { restaurant, itemCount, calculation } = useCart();

  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-20 sm:hidden p-3 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-float">
      <button
        onClick={onOpen}
        style={{ backgroundColor: restaurant.accentColor || "#ea580c" }}
        className="w-full text-white font-bold py-3 px-4 rounded-xl shadow-md flex items-center justify-between transition-transform active:scale-[0.99] cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="bg-stone-900 text-white text-xs font-extrabold w-6 h-6 rounded-full flex items-center justify-center border border-white/40">
            {itemCount}
          </span>
          <span className="text-sm">Warenkorb ansehen</span>
        </div>
        <span className="text-base font-extrabold">
          {formatEuro(calculation.total)}
        </span>
      </button>
    </div>
  );
}
