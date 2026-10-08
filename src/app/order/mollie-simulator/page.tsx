"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { formatEuro } from "../../../lib/calculations";
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Building2,
  Smartphone,
  Flame,
} from "lucide-react";

function MollieSimulatorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentId = searchParams.get("paymentId");

  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState("paypal");
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    if (!paymentId) return;

    // Zahlungsdetails abrufen
    fetch(`/api/admin/orders?paymentId=${paymentId}`)
      .then(() => {
        // Mock-Daten für Simulatoranzeige
        setPaymentData({
          id: paymentId,
          amount: "29.30",
          currency: "EUR",
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [paymentId]);

  const handleSimulatePayment = async (status: "paid" | "canceled" | "failed") => {
    setSimulating(true);

    try {
      // Setze Status im Simulator-Store und triggere idempotent den Webhook
      const updateRes = await fetch(`/api/webhooks/mollie-simulate-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, status }),
      });

      const data = await updateRes.json();
      const orderId = data.orderId;

      // Zurückleiten zur Statusseite
      router.push(`/order/status?orderId=${orderId}&paymentStatus=${status}`);
    } catch (e) {
      console.error(e);
      // Fallback Weiterleitung
      router.push(`/order/status?paymentStatus=${status}`);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Mollie Header */}
        <div className="bg-white rounded-t-3xl border-t border-x border-stone-200 p-6 text-center shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <span className="font-black text-lg text-stone-900 tracking-tight">
                mollie
              </span>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                Sandbox Simulator
              </span>
            </div>
            <span className="text-xs font-mono text-stone-400">
              {paymentId?.slice(0, 14)}...
            </span>
          </div>

          <div className="mt-4">
            <span className="text-xs text-stone-400 block font-medium">
              Zu zahlender Betrag
            </span>
            <div className="text-3xl font-black text-stone-900 mt-1">
              Online-Zahlung
            </div>
          </div>
        </div>

        {/* Zahlungsmethoden Auswahl */}
        <div className="bg-white border-x border-stone-200 p-6 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block mb-2">
            Zahlungsart wählen
          </span>

          <div className="space-y-2">
            {[
              {
                id: "paypal",
                name: "PayPal",
                badge: (
                  <div className="w-8 h-8 rounded-lg bg-[#003087] flex items-center justify-center text-white shrink-0 shadow-xs">
                    <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.786.786 0 0 1 .774-.654h6.398c2.955 0 5.068.745 5.86 2.052.753 1.24.582 2.97-.478 4.792-1.34 2.301-3.642 3.51-6.66 3.51H8.76l-1.042 6.643a.641.641 0 0 1-.642.574z"/>
                    </svg>
                  </div>
                ),
              },
              {
                id: "applepay",
                name: "Apple Pay / Google Pay",
                badge: (
                  <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                    Pay
                  </div>
                ),
              },
              {
                id: "card",
                name: "Kreditkarte (Visa / Mastercard)",
                badge: (
                  <div className="w-8 h-8 rounded-lg bg-slate-800 text-sky-400 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                ),
              },
              {
                id: "sepa",
                name: "SEPA Banküberweisung",
                badge: (
                  <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                    SEPA
                  </div>
                ),
              },
              {
                id: "wero",
                name: "Wero (EPI)",
                badge: (
                  <div className="w-8 h-8 rounded-lg bg-[#0f2e4a] text-emerald-400 flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                    WERO
                  </div>
                ),
              },
            ].map((m) => (
              <label
                key={m.id}
                onClick={() => setSelectedMethod(m.id)}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedMethod === m.id
                    ? "border-orange-600 bg-orange-50/50 ring-1 ring-orange-600/30"
                    : "border-stone-200 hover:bg-stone-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  {m.badge}
                  <span className="font-bold text-sm text-stone-800">{m.name}</span>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedMethod === m.id
                      ? "border-orange-600 bg-orange-600"
                      : "border-stone-300"
                  }`}
                >
                  {selectedMethod === m.id && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Test-Szenario Buttons */}
        <div className="bg-stone-50 rounded-b-3xl border border-stone-200 p-6 space-y-3 shadow-soft">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block text-center mb-1">
            Mollie Ergebnis simulieren:
          </span>

          {/* Erfolg (paid) */}
          <button
            disabled={simulating}
            onClick={() => handleSimulatePayment("paid")}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99] cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Zahlung erfolgreich ausführen (paid)</span>
          </button>

          {/* Abbruch (canceled) */}
          <button
            disabled={simulating}
            onClick={() => handleSimulatePayment("canceled")}
            className="w-full bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <XCircle className="w-4 h-4 text-stone-500" />
            <span>Zahlung abbrechen (canceled)</span>
          </button>

          {/* Fehlschlag (failed) */}
          <button
            disabled={simulating}
            onClick={() => handleSimulatePayment("failed")}
            className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Fehlschlag simulieren (failed)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MollieSimulatorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MollieSimulatorContent />
    </Suspense>
  );
}
