"use client";

import React, { useState } from "react";
import { Order } from "../types/restaurant";
import { formatEuro } from "../lib/calculations";
import { useCart } from "../context/CartContext";
import {
  CheckCircle2,
  Clock,
  Printer,
  Receipt,
} from "lucide-react";

interface OrderSuccessViewProps {
  order: Order;
  onNewOrder: () => void;
}

export function OrderSuccessView({
  order,
  onNewOrder,
}: OrderSuccessViewProps) {
  const { restaurant } = useCart();
  const [showReceipt, setShowReceipt] = useState(false);

  const estimatedTime =
    order.desiredTime.type === "scheduled" && order.desiredTime.timeSlot
      ? order.desiredTime.timeSlot
      : `ca. ${new Date(Date.now() + 35 * 60000).toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
        })} Uhr`;

  return (
    <div className="min-h-screen bg-stone-100/70 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-soft text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 mb-2">
            Bestellnummer: #{order.orderNumber}
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
            Vielen Dank für deine Bestellung!
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Deine Bestellung wurde an das Restaurant {restaurant.name} übertragen.
          </p>

          <div className="mt-6 p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-center gap-3">
            <Clock className="w-5 h-5 text-orange-600 animate-pulse" />
            <div className="text-left">
              <span className="text-xs text-stone-500 block font-medium">
                Voraussichtlich fertig / geliefert um:
              </span>
              <span className="text-base font-extrabold text-stone-900">
                {estimatedTime}
              </span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-stone-100 text-left">
            <h3 className="text-xs font-bold uppercase text-stone-400 mb-4 tracking-wider">
              Aktueller Bestellstatus
            </h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-md">
                  ✓
                </div>
                <span className="text-[11px] font-bold text-stone-900 mt-2">
                  Eingegangen
                </span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold animate-pulse">
                  2
                </div>
                <span className="text-[11px] font-bold text-orange-700 mt-2">
                  In Zubereitung
                </span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-400 flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <span className="text-[11px] font-medium text-stone-400 mt-2">
                  In der Küche
                </span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-400 flex items-center justify-center text-xs font-bold">
                  4
                </div>
                <span className="text-[11px] font-medium text-stone-400 mt-2">
                  {order.orderType === "delivery" ? "Unterwegs" : "Abholbereit"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-soft space-y-4">
          <h2 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center justify-between">
            <span>Übersicht der Bestellung</span>
            <span className="text-xs text-stone-400 font-normal">
              Zahlart:{" "}
              {order.paymentMethod === "cash" ? "Barzahlung" : "Online (Mollie)"}
            </span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-stone-600 bg-stone-50 p-4 rounded-xl">
            <div>
              <span className="text-stone-400 block font-medium mb-1">
                Kunde:
              </span>
              <p className="font-bold text-stone-900">{order.customer.name}</p>
              <p>{order.customer.phone}</p>
              <p>{order.customer.email}</p>
            </div>
            <div>
              <span className="text-stone-400 block font-medium mb-1">
                {order.orderType === "delivery" ? "Lieferung an:" : "Abholung bei:"}
              </span>
              {order.orderType === "delivery" ? (
                <>
                  <p className="font-bold text-stone-900">
                    {order.customer.street} {order.customer.houseNumber}
                  </p>
                  <p>
                    {order.customer.plz} {order.customer.city}
                  </p>
                  {order.customer.comment && (
                    <p className="text-amber-800 italic mt-1">
                      Hinweis: {order.customer.comment}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="font-bold text-stone-900">
                    {restaurant.name}
                  </p>
                  <p>
                    {restaurant.address.street}, {restaurant.address.plz}{" "}
                    {restaurant.address.city}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="divide-y divide-stone-100 pt-2">
            {order.items.map((it) => (
              <div key={it.cartLineId} className="py-2.5 flex justify-between items-start text-xs">
                <div>
                  <div className="font-bold text-stone-900">
                    {it.quantity}x #{it.number} {it.name}
                  </div>
                  {it.selectedSize && (
                    <div className="text-stone-500">{it.selectedSize.name}</div>
                  )}
                  {it.selectedExtras.length > 0 && (
                    <div className="text-stone-400">
                      +{it.selectedExtras.map((e) => e.name).join(", ")}
                    </div>
                  )}
                  {it.comment && (
                    <div className="text-amber-800 italic">„{it.comment}“</div>
                  )}
                </div>
                <div className="font-bold text-stone-900">
                  {formatEuro(it.totalPrice)}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-stone-200 pt-3 space-y-1.5 text-xs text-stone-600">
            <div className="flex justify-between">
              <span>Zwischensumme</span>
              <span className="font-semibold text-stone-900">
                {formatEuro(order.calculation.subtotal)}
              </span>
            </div>
            {order.orderType === "delivery" && (
              <div className="flex justify-between">
                <span>Liefergebühr</span>
                <span className="font-semibold text-stone-900">
                  {formatEuro(order.calculation.deliveryFee)}
                </span>
              </div>
            )}
            <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-400 space-y-0.5">
              <div className="flex justify-between">
                <span>enthaltene 7% MwSt. (Speisen)</span>
                <span>{formatEuro(order.calculation.vat7)}</span>
              </div>
              {order.calculation.vat19 > 0 && (
                <div className="flex justify-between">
                  <span>enthaltene 19% MwSt. (Getränke / Liefergebühr)</span>
                  <span>{formatEuro(order.calculation.vat19)}</span>
                </div>
              )}
            </div>
            <div className="pt-2 border-t border-stone-200 flex justify-between text-base font-extrabold text-stone-900">
              <span>Gesamtbetrag (inkl. MwSt.)</span>
              <span style={{ color: restaurant.accentColor || "#ea580c" }}>
                {formatEuro(order.calculation.total)}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
            <button
              onClick={() => setShowReceipt(!showReceipt)}
              className="text-xs text-stone-600 hover:text-stone-900 flex items-center gap-1.5 font-medium underline underline-offset-2 cursor-pointer"
            >
              <Receipt className="w-4 h-4 text-stone-500" />
              <span>
                {showReceipt
                  ? "Küchenbon verbergen"
                  : "Küchenbon (80mm Bon-Vorschau) anzeigen"}
              </span>
            </button>
            <button
              onClick={() => window.print()}
              className="p-2 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Drucken</span>
            </button>
          </div>

          {showReceipt && (
            <div className="mt-4 p-4 bg-stone-50 rounded-xl border border-stone-300 font-mono text-[11px] leading-tight text-stone-800 shadow-inner">
              <div className="text-center pb-2 border-b border-dashed border-stone-400">
                <p className="font-bold text-xs uppercase">{restaurant.name}</p>
                <p>{restaurant.address.street}, {restaurant.address.plz} {restaurant.address.city}</p>
                <p>Tel: {restaurant.phone}</p>
                <p className="mt-1 font-bold">BON #{order.orderNumber}</p>
                <p>{new Date().toLocaleString("de-DE")}</p>
              </div>

              <div className="py-2 border-b border-dashed border-stone-400">
                <p className="font-bold uppercase">
                  {order.orderType === "delivery" ? ">>> LIEFERUNG <<<" : ">>> ABHOLUNG <<<"}
                </p>
                <p>Kunde: {order.customer.name}</p>
                <p>Tel: {order.customer.phone}</p>
                {order.orderType === "delivery" && (
                  <p>Adresse: {order.customer.street} {order.customer.houseNumber}, {order.customer.plz} {order.customer.city}</p>
                )}
                {order.customer.comment && <p className="font-bold">Hinweis: {order.customer.comment}</p>}
                <p className="mt-1">Wunschzeit: {estimatedTime}</p>
              </div>

              <div className="py-2 border-b border-dashed border-stone-400 space-y-1.5">
                {order.items.map((it, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between font-bold">
                      <span>{it.quantity}x #{it.number} {it.name}</span>
                      <span>{formatEuro(it.totalPrice)}</span>
                    </div>
                    {it.selectedSize && <div className="text-[10px] pl-2">{it.selectedSize.name}</div>}
                    {it.selectedExtras.map((e, ei) => (
                      <div key={ei} className="text-[10px] pl-2">+ {e.name} ({formatEuro(e.price)})</div>
                    ))}
                    {it.comment && <div className="text-[10px] pl-2 italic">** {it.comment} **</div>}
                  </div>
                ))}
              </div>

              <div className="py-2 border-b border-dashed border-stone-400 space-y-0.5">
                <div className="flex justify-between">
                  <span>Zwischensumme:</span>
                  <span>{formatEuro(order.calculation.subtotal)}</span>
                </div>
                {order.orderType === "delivery" && (
                  <div className="flex justify-between">
                    <span>Liefergebühr:</span>
                    <span>{formatEuro(order.calculation.deliveryFee)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-stone-300">
                  <span>GESAMTSUMME:</span>
                  <span>{formatEuro(order.calculation.total)}</span>
                </div>
                <div className="flex justify-between text-[10px] pt-1">
                  <span>enthaltene MwSt 7%:</span>
                  <span>{formatEuro(order.calculation.vat7)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>enthaltene MwSt 19%:</span>
                  <span>{formatEuro(order.calculation.vat19)}</span>
                </div>
                <div className="pt-1 font-bold">
                  <span>Zahlart: {order.paymentMethod === "cash" ? "BARZAHLUNG" : "ONLINE BEZAHLT (Mollie)"}</span>
                </div>
              </div>

              <p className="text-center pt-2 text-[10px] text-stone-500">
                Vielen Dank für Ihre Bestellung bei {restaurant.name}!
              </p>
            </div>
          )}
        </div>

        <div className="text-center pt-2">
          <button
            onClick={onNewOrder}
            className="bg-stone-900 hover:bg-black text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer text-sm"
          >
            Weitere Bestellung aufgeben
          </button>
        </div>
      </div>
    </div>
  );
}
