"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Order } from "../../../types/restaurant";
import { OrderSuccessView } from "../../../components/OrderSuccessView";
import { formatEuro } from "../../../lib/calculations";
import {
  AlertTriangle,
  RotateCcw,
  Store,
  ArrowLeft,
  Banknote,
  CreditCard,
} from "lucide-react";
import Link from "next/link";

export default function OrderStatusPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const queryPaymentStatus = searchParams.get("paymentStatus");

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    fetch(`/api/orders?id=${orderId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.order) {
          setOrder(data.order);
        } else {
          setError("Bestellung nicht gefunden.");
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-stone-500">
            Prüfe Zahlungs- und Bestellstatus...
          </span>
        </div>
      </div>
    );
  }

  // 1. Zahlungsfehler oder Abbruch
  const isFailedOrCanceled =
    queryPaymentStatus === "canceled" ||
    queryPaymentStatus === "failed" ||
    order?.paymentStatus === "canceled" ||
    order?.paymentStatus === "failed";

  if (isFailedOrCanceled) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto w-full bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-soft text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-wider">
              {queryPaymentStatus === "canceled"
                ? "Zahlung abgebrochen"
                : "Zahlung nicht erfolgreich"}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 mt-3">
              Keine Sorge – es wurde kein Geld abgebucht!
            </h1>
            <p className="text-xs text-stone-500 mt-2 leading-relaxed">
              Die Online-Zahlung über Mollie wurde nicht abgeschlossen. Du kannst die Zahlung wiederholen oder einfach Barzahlung wählen.
            </p>
          </div>

          {order && (
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-left text-xs space-y-1">
              <div className="flex justify-between font-bold text-stone-900">
                <span>Bestellwert:</span>
                <span>{formatEuro(order.calculation.total)}</span>
              </div>
              <div className="text-stone-500 text-[11px]">
                {order.items.length} Artikel für {order.customer.name}
              </div>
            </div>
          )}

          <div className="space-y-2.5 pt-2">
            {/* Neuversuch Mollie */}
            {order?.mollieCheckoutUrl && (
              <a
                href={order.mollieCheckoutUrl}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99]"
              >
                <CreditCard className="w-4 h-4" />
                <span>Online-Zahlung wiederholen</span>
              </a>
            )}

            {/* Alternativ: Barzahlung wählen */}
            <button
              onClick={async () => {
                if (!order) return;
                try {
                  const res = await fetch("/api/orders", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      orderId: order.id,
                      switchPaymentMethod: "cash",
                    }),
                  });
                  const d = await res.json();
                  if (d.success && d.order) {
                    setOrder(d.order);
                    router.replace(`/order/status?orderId=${order.id}`);
                  }
                } catch (e) {
                  console.error(e);
                }
              }}
              className="w-full bg-stone-900 hover:bg-black text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Banknote className="w-4 h-4 text-emerald-400" />
              <span>Stattdessen Bar bei Übergabe zahlen</span>
            </button>

            {/* Zurück */}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 pt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Zurück zur Speisekarte</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Erfolgreiche Bestellung (Bezahlt oder Bar)
  if (order) {
    return (
      <OrderSuccessView
        order={order}
        onNewOrder={() => router.push("/")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 text-center">
      <h2 className="text-lg font-bold text-stone-900">
        Bestellung nicht gefunden
      </h2>
      <Link href="/" className="mt-4 text-xs font-bold text-orange-600 underline">
        Zur Startseite
      </Link>
    </div>
  );
}
