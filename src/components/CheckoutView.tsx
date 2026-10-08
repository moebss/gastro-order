"use client";

import React, { useState, useMemo } from "react";
import { useCart } from "../context/CartContext";
import { formatEuro, getAvailableTimeSlots } from "../lib/calculations";
import { Order } from "../types/restaurant";
import {
  ArrowLeft,
  Bike,
  Store,
  Clock,
  CreditCard,
  Banknote,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

interface CheckoutViewProps {
  onBackToMenu: () => void;
  onOrderComplete: (order: Order) => void;
}

export function CheckoutView({
  onBackToMenu,
  onOrderComplete,
}: CheckoutViewProps) {
  const {
    restaurant,
    items,
    orderType,
    setOrderType,
    selectedPlz,
    setSelectedPlz,
    customer,
    setCustomer,
    desiredTime,
    setDesiredTime,
    paymentMethod,
    setPaymentMethod,
    calculation,
    clearCart,
  } = useCart();

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agbAccepted, setAgbAccepted] = useState(true);
  const [honeypotValue, setHoneypotValue] = useState("");

  // Zeitfenster aus Öffnungszeiten des jeweiligen Restaurants
  const timeSlotsInfo = useMemo(() => {
    return getAvailableTimeSlots(restaurant.openingHours);
  }, [restaurant.openingHours]);

  // Prüfen, ob gewählte PLZ beliefert wird
  const currentDeliveryZone = useMemo(() => {
    return restaurant.deliveryZones.find(
      (z) => z.plz.trim() === customer.plz.trim()
    );
  }, [restaurant.deliveryZones, customer.plz]);

  const isPlzSupported = orderType === "pickup" || Boolean(currentDeliveryZone);
  const isMinOrderOk = orderType === "pickup" || calculation.isMinOrderReached;
  const isFormValid =
    isPlzSupported &&
    isMinOrderOk &&
    items.length > 0 &&
    agbAccepted;

  const handleInputChange = (
    field: keyof typeof customer,
    value: string
  ) => {
    setServerError(null);
    setCustomer((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const errors: Record<string, string> = {};
    if (!customer.name.trim()) errors.name = "Bitte gib deinen Namen an.";
    if (!customer.phone.trim()) {
      errors.phone = "Bitte gib eine Telefonnummer für Rückfragen an.";
    } else if (customer.phone.trim().length < 6) {
      errors.phone = "Bitte gib eine gültige Telefonnummer an.";
    }

    if (!customer.email.trim()) {
      errors.email = "Bitte gib deine E-Mail für die Bestellbestätigung an.";
    } else if (!customer.email.includes("@")) {
      errors.email = "Bitte gib eine gültige E-Mail-Adresse an.";
    }

    if (orderType === "delivery") {
      if (!customer.street.trim()) errors.street = "Straße ist erforderlich.";
      if (!customer.houseNumber.trim()) errors.houseNumber = "Hausnr. fehlt.";
      if (!customer.plz.trim()) errors.plz = "PLZ ist erforderlich.";
      if (!currentDeliveryZone) {
        errors.plz = `Das Liefergebiet mit PLZ ${customer.plz} wird von ${restaurant.name} nicht beliefert.`;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      window.scrollTo({ top: 120, behavior: "smooth" });
      return;
    }

    if (!isMinOrderOk) {
      setServerError(
        `Der Mindestbestellwert von ${formatEuro(
          calculation.minOrderRequired
        )} ist noch nicht erreicht.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Idempotency Key zur Vermeidung von Doppelbestellungen
      const idempotencyKey = `idem_${restaurant.id}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      // Payload für die serverseitige Validierung (preisfrei)
      const serverPayload = {
        restaurantId: restaurant.id,
        idempotencyKey,
        orderType,
        customer,
        desiredTime,
        paymentMethod,
        honeypot: honeypotValue,
        items: items.map((it) => ({
          itemId: it.itemId,
          sizeId: it.selectedSize?.id,
          extraIds: (it.selectedExtras || []).map((e) => e.id),
          quantity: it.quantity,
          comment: it.comment,
        })),
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(serverPayload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setServerError(
          data.error || "Fehler beim Bestellen. Bitte überprüfe deine Angaben."
        );
        window.scrollTo({ top: 120, behavior: "smooth" });
        setIsSubmitting(false);
        return;
      }

      // Erfolgreich verifiziert und gespeichert
      if (data.checkoutUrl) {
        clearCart();
        window.location.href = data.checkoutUrl;
        return;
      }

      clearCart();
      setIsSubmitting(false);
      onOrderComplete(data.order);
    } catch (err: any) {
      console.error("Bestellfehler:", err);
      setServerError("Netzwerkfehler. Bitte prüfe deine Internetverbindung.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/60 pb-20">
      <div className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <button
            onClick={onBackToMenu}
            className="flex items-center gap-2 text-stone-600 hover:text-stone-900 text-sm font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Zurück zur Speisekarte</span>
          </button>
          <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Sicherer Server-Checkout</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
            Bestellung abschließen
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            {restaurant.name} • Ohne Registrierung
          </p>
        </div>

        {/* Globaler Serverfehler Hinweis */}
        {serverError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Bestellung konnte nicht ausgeführt werden</h4>
              <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">{serverError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          {/* Honeypot-Feld zur Spam-Bot-Abwehr (für Menschen unsichtbar) */}
          <div style={{ position: "absolute", left: "-9999px", opacity: 0 }} aria-hidden="true">
            <input
              type="text"
              name="hp_website_contact"
              tabIndex={-1}
              autoComplete="off"
              value={honeypotValue}
              onChange={(e) => setHoneypotValue(e.target.value)}
            />
          </div>

          <div className="lg:col-span-7 space-y-6">
            {/* Schritt 1: Bestellart wählen */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 shadow-soft">
              <h2 className="text-base font-bold text-stone-900 mb-3.5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-800 text-xs font-extrabold flex items-center justify-center">
                  1
                </span>
                <span>Bestellart wählen</span>
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOrderType("delivery")}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                    orderType === "delivery"
                      ? "border-orange-600 bg-orange-50/60 text-stone-900 ring-2 ring-orange-600/20"
                      : "border-stone-200 bg-white hover:bg-stone-50 text-stone-600"
                  }`}
                >
                  <Bike
                    className={`w-6 h-6 ${
                      orderType === "delivery"
                        ? "text-orange-600"
                        : "text-stone-400"
                    }`}
                  />
                  <div className="text-center">
                    <span className="block font-bold text-sm">Lieferung</span>
                    <span className="text-xs text-stone-500">
                      Bequem nach Hause
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderType("pickup")}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                    orderType === "pickup"
                      ? "border-orange-600 bg-orange-50/60 text-stone-900 ring-2 ring-orange-600/20"
                      : "border-stone-200 bg-white hover:bg-stone-50 text-stone-600"
                  }`}
                >
                  <Store
                    className={`w-6 h-6 ${
                      orderType === "pickup"
                        ? "text-orange-600"
                        : "text-stone-400"
                    }`}
                  />
                  <div className="text-center">
                    <span className="block font-bold text-sm">Selbstabholung</span>
                    <span className="text-xs text-stone-500">
                      Keine Liefergebühr
                    </span>
                  </div>
                </button>
              </div>

              {orderType === "pickup" && (
                <div className="mt-4 p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600">
                  <span className="font-bold text-stone-800">Abholadresse: </span>
                  {restaurant.address.street}, {restaurant.address.plz}{" "}
                  {restaurant.address.city} (Abholbereit ca. 20–25 Min. nach Bestelleingang)
                </div>
              )}
            </div>

            {/* Schritt 2: Kontaktdaten */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 shadow-soft">
              <h2 className="text-base font-bold text-stone-900 mb-3.5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-800 text-xs font-extrabold flex items-center justify-center">
                  2
                </span>
                <span>Deine Kontaktdaten</span>
              </h2>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Vor- und Nachname *
                  </label>
                  <input
                    type="text"
                    required
                    value={customer.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Max Mustermann"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${
                      formErrors.name
                        ? "border-rose-500 bg-rose-50/30"
                        : "border-stone-200 focus:border-orange-500"
                    }`}
                  />
                  {formErrors.name && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">
                      {formErrors.name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                      Telefonnummer (für Rückfragen) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={customer.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="0171 1234567"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${
                        formErrors.phone
                          ? "border-rose-500 bg-rose-50/30"
                          : "border-stone-200 focus:border-orange-500"
                      }`}
                    />
                    {formErrors.phone && (
                      <p className="text-xs text-rose-600 mt-1 font-medium">
                        {formErrors.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                      E-Mail (für Bestätigung) *
                    </label>
                    <input
                      type="email"
                      required
                      value={customer.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="max@beispiel.de"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${
                        formErrors.email
                          ? "border-rose-500 bg-rose-50/30"
                          : "border-stone-200 focus:border-orange-500"
                      }`}
                    />
                    {formErrors.email && (
                      <p className="text-xs text-rose-600 mt-1 font-medium">
                        {formErrors.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Schritt 3: Lieferadresse (Nur bei Lieferung) */}
            {orderType === "delivery" && (
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 shadow-soft">
                <h2 className="text-base font-bold text-stone-900 mb-3.5 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-800 text-xs font-extrabold flex items-center justify-center">
                    3
                  </span>
                  <span>Lieferadresse</span>
                </h2>

                <div className="space-y-3.5">
                  <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-3">
                      <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                        Straße *
                      </label>
                      <input
                        type="text"
                        required
                        value={customer.street}
                        onChange={(e) =>
                          handleInputChange("street", e.target.value)
                        }
                        placeholder="Straße und Name"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${
                          formErrors.street
                            ? "border-rose-500 bg-rose-50/30"
                            : "border-stone-200 focus:border-orange-500"
                        }`}
                      />
                      {formErrors.street && (
                        <p className="text-xs text-rose-600 mt-1 font-medium">
                          {formErrors.street}
                        </p>
                      )}
                    </div>

                    <div className="col-span-1">
                      <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                        Hausnr. *
                      </label>
                      <input
                        type="text"
                        required
                        value={customer.houseNumber}
                        onChange={(e) =>
                          handleInputChange("houseNumber", e.target.value)
                        }
                        placeholder="12"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${
                          formErrors.houseNumber
                            ? "border-rose-500 bg-rose-50/30"
                            : "border-stone-200 focus:border-orange-500"
                        }`}
                      />
                      {formErrors.houseNumber && (
                        <p className="text-xs text-rose-600 mt-1 font-medium">
                          {formErrors.houseNumber}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                        Postleitzahl (PLZ) *
                      </label>
                      <select
                        value={customer.plz}
                        onChange={(e) => {
                          handleInputChange("plz", e.target.value);
                          setSelectedPlz(e.target.value);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      >
                        {restaurant.deliveryZones.map((z) => (
                          <option key={z.plz} value={z.plz}>
                            {z.plz} – {z.areaName} (Mindestbestellwert: {formatEuro(z.minOrder)})
                          </option>
                        ))}
                      </select>
                      {currentDeliveryZone ? (
                        <p className="text-xs text-emerald-700 mt-1 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Lieferung nach {currentDeliveryZone.areaName} (ca. {currentDeliveryZone.estimatedMinutes} Min., Gebühr: {formatEuro(currentDeliveryZone.deliveryFee)})
                        </p>
                      ) : (
                        <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Diese PLZ wird leider nicht beliefert.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                        Stadt *
                      </label>
                      <input
                        type="text"
                        required
                        value={customer.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                        placeholder={restaurant.address.city}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                      Hinweis für Fahrer (optional)
                    </label>
                    <input
                      type="text"
                      value={customer.comment}
                      onChange={(e) =>
                        handleInputChange("comment", e.target.value)
                      }
                      placeholder="z.B. Hinterhaus 2. Stock, bitte klopfen"
                      maxLength={120}
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Schritt 4: Uhrzeit (Wunschzeit) */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 shadow-soft">
              <h2 className="text-base font-bold text-stone-900 mb-3.5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-800 text-xs font-extrabold flex items-center justify-center">
                  {orderType === "delivery" ? "4" : "3"}
                </span>
                <span>Gewünschte Lieferzeit</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDesiredTime({ type: "asap" })}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    desiredTime.type === "asap"
                      ? "border-orange-600 bg-orange-50/60 ring-2 ring-orange-600/20"
                      : "border-stone-200 bg-white hover:bg-stone-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Clock
                      className={`w-4 h-4 ${
                        desiredTime.type === "asap"
                          ? "text-orange-600"
                          : "text-stone-400"
                      }`}
                    />
                    <span className="font-bold text-sm text-stone-900">
                      So schnell wie möglich
                    </span>
                  </div>
                  <span className="text-xs text-stone-500">
                    ca. {orderType === "delivery" ? "30–45 Minuten" : "20–25 Minuten"}
                  </span>
                </button>

                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    desiredTime.type === "scheduled"
                      ? "border-orange-600 bg-orange-50/60 ring-2 ring-orange-600/20"
                      : "border-stone-200 bg-white"
                  }`}
                >
                  <label className="flex items-center gap-2 mb-1 cursor-pointer">
                    <input
                      type="radio"
                      name="desiredTimeType"
                      checked={desiredTime.type === "scheduled"}
                      onChange={() =>
                        setDesiredTime({
                          type: "scheduled",
                          timeSlot: timeSlotsInfo.slots[0] || "18:00 Uhr",
                        })
                      }
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <span className="font-bold text-sm text-stone-900">
                      Wunschzeit heute
                    </span>
                  </label>

                  {timeSlotsInfo.slots.length > 0 ? (
                    <select
                      disabled={desiredTime.type !== "scheduled"}
                      value={desiredTime.timeSlot || timeSlotsInfo.slots[0]}
                      onChange={(e) =>
                        setDesiredTime({
                          type: "scheduled",
                          timeSlot: e.target.value,
                        })
                      }
                      className="w-full mt-1.5 px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold text-stone-800 bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {timeSlotsInfo.slots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-[11px] text-amber-700 mt-1">
                      Keine weiteren buchbaren Zeitfenster für heute.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Schritt 5: Zahlungsart */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 shadow-soft">
              <h2 className="text-base font-bold text-stone-900 mb-3.5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-800 text-xs font-extrabold flex items-center justify-center">
                  {orderType === "delivery" ? "5" : "4"}
                </span>
                <span>Zahlungsart wählen</span>
              </h2>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash")}
                  className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    paymentMethod === "cash"
                      ? "border-orange-600 bg-orange-50/60 ring-2 ring-orange-600/20"
                      : "border-stone-200 bg-white hover:bg-stone-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
                      <Banknote className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-stone-900">
                        {orderType === "delivery"
                          ? "Barzahlung bei Lieferung"
                          : "Barzahlung bei Abholung"}
                      </div>
                      <div className="text-xs text-stone-500">
                        Passend oder mit Wechselgeld beim Fahrer/an der Theke
                      </div>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      paymentMethod === "cash"
                        ? "border-orange-600 bg-orange-600"
                        : "border-stone-300"
                    }`}
                  >
                    {paymentMethod === "cash" && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("online")}
                  className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    paymentMethod === "online"
                      ? "border-orange-600 bg-orange-50/60 ring-2 ring-orange-600/20"
                      : "border-stone-200 bg-white hover:bg-stone-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-700">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-stone-900 flex items-center gap-2">
                        <span>Online-Zahlung (Mollie)</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                          Sofort & Kontaktlos
                        </span>
                      </div>
                      <div className="text-xs text-stone-500">
                        PayPal, Apple Pay, Kreditkarte, SEPA & Wero
                      </div>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      paymentMethod === "online"
                        ? "border-orange-600 bg-orange-600"
                        : "border-stone-300"
                    }`}
                  >
                    {paymentMethod === "online" && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </button>

                {paymentMethod === "online" && (
                  <div className="p-3.5 bg-orange-50/50 rounded-xl border border-orange-200/80 text-xs space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between text-[11px] text-stone-700">
                      <span className="font-semibold text-stone-500">Zahlungsempfänger:</span>
                      <span className="font-bold text-stone-900">{restaurant.name} (Direktzahlung)</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {[
                        { label: "PayPal", icon: "🅿️" },
                        { label: "Apple Pay & Google Pay", icon: "🍎" },
                        { label: "Visa & Mastercard", icon: "💳" },
                        { label: "SEPA Überweisung", icon: "🏦" },
                        { label: "Wero", icon: "🇪🇺" },
                      ].map((p, i) => (
                        <span
                          key={i}
                          className="bg-white border border-stone-200 px-2 py-1 rounded-lg text-[10px] font-bold text-stone-800 flex items-center gap-1 shadow-2xs"
                        >
                          <span>{p.icon}</span>
                          <span>{p.label}</span>
                        </span>
                      ))}
                    </div>
                    <div className="text-[10px] text-stone-500 flex items-center gap-1 pt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>Sichere 256-Bit SSL-Verschlüsselung via Mollie. Auszahlung direkt an das Restaurant.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rechte Spalte: Bestellübersicht */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 shadow-soft sticky top-20">
              <h3 className="font-bold text-stone-900 text-base mb-4 pb-2 border-b border-stone-100">
                Bestellübersicht ({items.reduce((s, i) => s + i.quantity, 0)} Artikel)
              </h3>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1 divide-y divide-stone-100">
                {items.map((it) => (
                  <div key={it.cartLineId} className="pt-2 first:pt-0 text-xs">
                    <div className="flex justify-between items-start font-medium text-stone-900">
                      <span>
                        {it.quantity}x #{it.number} {it.name}
                      </span>
                      <span className="font-bold">{formatEuro(it.totalPrice)}</span>
                    </div>
                    {it.selectedSize && (
                      <div className="text-[11px] text-stone-500">
                        {it.selectedSize.name}
                      </div>
                    )}
                    {it.selectedExtras.length > 0 && (
                      <div className="text-[11px] text-stone-400">
                        +{it.selectedExtras.map((e) => e.name).join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-stone-200 space-y-2 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Zwischensumme</span>
                  <span className="font-semibold text-stone-900">
                    {formatEuro(calculation.subtotal)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>
                    {orderType === "delivery"
                      ? `Liefergebühr (${currentDeliveryZone?.areaName || customer.plz})`
                      : "Selbstabholung vor Ort"}
                  </span>
                  <span className="font-semibold text-stone-900">
                    {orderType === "delivery"
                      ? formatEuro(calculation.deliveryFee)
                      : "Kostenlos"}
                  </span>
                </div>

                <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-500 space-y-1">
                  <div className="flex justify-between">
                    <span>enthaltene 7% MwSt. (Speisen)</span>
                    <span className="font-medium">{formatEuro(calculation.vat7)}</span>
                  </div>
                  {calculation.vat19 > 0 && (
                    <div className="flex justify-between">
                      <span>enthaltene 19% MwSt. (Getränke / Liefergebühr)</span>
                      <span className="font-medium">{formatEuro(calculation.vat19)}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline text-lg font-black text-stone-900">
                  <span>Gesamtsumme</span>
                  <span style={{ color: restaurant.accentColor || "#ea580c" }} className="text-xl">
                    {formatEuro(calculation.total)}
                  </span>
                </div>
              </div>

              {orderType === "delivery" && !calculation.isMinOrderReached && (
                <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    Mindestbestellwert von {formatEuro(calculation.minOrderRequired)} für {customer.plz} noch nicht erreicht. Es fehlen noch {formatEuro(calculation.minOrderDelta)}.
                  </div>
                </div>
              )}

              <div className="mt-5 pt-4 border-t border-stone-100">
                <label className="flex items-start gap-2.5 text-[11px] text-stone-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agbAccepted}
                    onChange={(e) => setAgbAccepted(e.target.checked)}
                    className="mt-0.5 rounded border-stone-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span>
                    Ich akzeptiere die{" "}
                    <a href="/legal/agb" target="_blank" className="underline text-stone-800 hover:text-black">AGB</a> und habe die{" "}
                    <a href="/legal/datenschutz" target="_blank" className="underline text-stone-800 hover:text-black">
                      Datenschutzerklärung
                    </a>{" "}
                    sowie die <a href="/legal/agb" target="_blank" className="underline text-stone-800 hover:text-black">Widerrufsbelehrung</a> zur Kenntnis genommen.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                style={{
                  backgroundColor: isFormValid && !isSubmitting ? (restaurant.accentColor || "#ea580c") : undefined
                }}
                className={`w-full mt-4 py-3.5 px-4 rounded-xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                  isFormValid && !isSubmitting
                    ? "text-white shadow-orange-600/30 active:scale-[0.99] hover:opacity-95"
                    : "bg-stone-300 text-stone-500 cursor-not-allowed shadow-none"
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Wird serverseitig verifiziert...
                  </span>
                ) : (
                  <span>
                    {paymentMethod === "online"
                      ? "Zahlungspflichtig bestellen"
                      : "Verbindlich bestellen"}
                  </span>
                )}
              </button>

              <div className="mt-3 text-center flex items-center justify-center gap-2 text-[11px] text-stone-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>SSL-verschlüsselte Datenübertragung & serverseitige Preissicherung</span>
              </div>

              <div className="mt-2 pt-2 border-t border-stone-100 text-center flex items-center justify-center gap-2.5 text-[10px] text-stone-400">
                <a href="/legal/impressum" target="_blank" className="hover:text-stone-600 underline">Impressum</a>
                <span>•</span>
                <a href="/legal/datenschutz" target="_blank" className="hover:text-stone-600 underline">Datenschutz</a>
                <span>•</span>
                <a href="/legal/agb" target="_blank" className="hover:text-stone-600 underline">AGB</a>
                <span>•</span>
                <a href="/legal/avv" target="_blank" className="hover:text-stone-600 underline">AVV</a>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
