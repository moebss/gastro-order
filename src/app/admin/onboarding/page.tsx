"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Store,
  MapPin,
  Clock,
  Utensils,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  FileSpreadsheet,
  Sparkles,
  ExternalLink,
  ChefHat,
  ShieldCheck,
  AlertCircle,
  Lock,
  Key,
  Copy,
  Check,
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [createdResult, setCreatedResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedLogin, setCopiedLogin] = useState(false);

  // Formular-State
  const [formData, setFormData] = useState({
    name: "Pizzeria & Trattoria Roma",
    tagline: "Traditionelle Steinofen-Pizzen & hausgemachte Pasta",
    ownerName: "Luigi Romano",
    email: "luigi@pizzeria-roma-demo.de",
    password: "",
    passwordConfirm: "",
    phone: "0221 4455667",
    street: "Friesenplatz 12",
    plz: "50672",
    city: "Köln",
    accentColor: "#dc2626",
    menuSource: "template" as "template" | "csv",
    templateId: "template_pizzeria",
    csvContent: `Kategorie;Nummer;Name;Beschreibung;Preis;MwSt;Allergene
Steinofen-Pizza;01;Pizza Margherita;San Marzano Tomaten, Fior di Latte Mozzarella, frisches Basilikum;8.50;7;A;G
Steinofen-Pizza;02;Pizza Diavola;Scharfe Salami, Mozzarella, Peperoni;10.50;7;A;G
Frische Pasta;20;Spaghetti Aglio e Olio;Knoblauch, Olivenöl, Chili, Petersilie;9.00;7;A
Getränke;90;San Pellegrino 0,5l;Italienisches Mineralwasser;2.80;19;
Getränke;91;Coca-Cola 0,33l;Eiskalte Erfrischung;2.50;19;`,
    deliveryZones: [
      { plz: "50672", areaName: "Köln Innenstadt", minOrder: 15, deliveryFee: 1.0, estimatedMinutes: 25 },
      { plz: "50823", areaName: "Köln Ehrenfeld", minOrder: 18, deliveryFee: 2.0, estimatedMinutes: 35 },
    ],
  });

  const validateAndNextStep1 = () => {
    setErrorMessage(null);
    if (!formData.name.trim()) {
      setErrorMessage("Bitte gib den Namen des Restaurants ein.");
      return;
    }
    if (!formData.ownerName.trim()) {
      setErrorMessage("Bitte gib den Namen des Restaurantinhabers ein.");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setErrorMessage("Bitte gib eine gültige E-Mail-Adresse für das Inhaber-Login ein.");
      return;
    }
    if (!formData.password) {
      setErrorMessage("Bitte vergib ein Passwort für den Inhaber-Zugang.");
      return;
    }
    if (formData.password.length < 6) {
      setErrorMessage("Das Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }
    if (formData.password !== formData.passwordConfirm) {
      setErrorMessage("Die Passwörter stimmen nicht überein. Bitte überprüfe deine Eingabe.");
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMessage("Bitte gib eine Telefonnummer für das Restaurant ein.");
      return;
    }
    if (!formData.plz.trim() || !formData.city.trim()) {
      setErrorMessage("Bitte gib PLZ und Stadt des Betriebs an.");
      return;
    }
    setStep(2);
  };

  const addDeliveryZone = () => {
    setFormData((prev) => ({
      ...prev,
      deliveryZones: [
        ...prev.deliveryZones,
        { plz: "", areaName: "", minOrder: 15, deliveryFee: 1.5, estimatedMinutes: 30 },
      ],
    }));
  };

  const removeDeliveryZone = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      deliveryZones: prev.deliveryZones.filter((_, i) => i !== index),
    }));
  };

  const updateDeliveryZone = (index: number, field: string, value: any) => {
    setFormData((prev) => {
      const updated = [...prev.deliveryZones];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, deliveryZones: updated };
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Fehler beim Anlegen des Restaurants.");
        setSubmitting(false);
        return;
      }

      setCreatedResult(data);
      setStep(5); // Erfolgs-Screen
    } catch (e: any) {
      setErrorMessage(e.message || "Netzwerkfehler.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/70 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-stone-200 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-black shadow-sm">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-stone-900 tracking-tight">
                Restaurant Onboarding-Assistent
              </h1>
              <p className="text-xs text-stone-500">
                In unter 5 Minuten ein neues Restaurant betriebsbereit schalten
              </p>
            </div>
          </div>
          <Link
            href="/admin"
            className="text-xs font-semibold text-stone-600 hover:text-stone-900 transition"
          >
            Zurück zur Übersicht
          </Link>
        </div>

        {/* Schritt-Indikator */}
        {step < 5 && (
          <div className="mb-8">
            <div className="grid grid-cols-4 gap-2">
              {[
                { s: 1, label: "Stammdaten" },
                { s: 2, label: "Liefergebiete" },
                { s: 3, label: "Speisekarte" },
                { s: 4, label: "Aktivieren" },
              ].map((i) => (
                <div
                  key={i.s}
                  className={`border-t-4 pt-2 text-xs font-bold transition-all ${
                    step >= i.s
                      ? "border-orange-600 text-orange-900"
                      : "border-stone-200 text-stone-400"
                  }`}
                >
                  <span className="block text-[10px] uppercase font-mono">Schritt {i.s}</span>
                  <span>{i.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
            <p className="text-xs font-bold">{errorMessage}</p>
          </div>
        )}

        {/* SCHRITT 1: Stammdaten & Inhaber-Registrierung */}
        {step === 1 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-soft space-y-6">
            <div>
              <h2 className="text-lg font-bold text-stone-900">1. Restaurant &amp; Inhaber-Registrierung</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Stammdaten für den Online-Auftritt und persönliche Zugangsdaten für das Küchen- und Inhaber-Dashboard.
              </p>
            </div>

            {/* Inhaber-Zugang & Registrierung Card */}
            <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-stone-200">
                <ShieldCheck className="w-4 h-4 text-orange-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                  Inhaber-Zugang &amp; Registrierung (Login)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Vor- &amp; Nachname des Inhabers *
                  </label>
                  <input
                    type="text"
                    placeholder="z.B. Luigi Romano"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Login-E-Mail-Adresse *
                  </label>
                  <input
                    type="email"
                    placeholder="inhaber@restaurant.de"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 bg-white"
                  />
                  <span className="text-[10px] text-stone-500 mt-1 block">
                    Dient als Benutzername für das Admin- und Küchen-Dashboard.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Passwort vergeben *
                  </label>
                  <input
                    type="password"
                    placeholder="Mindestens 6 Zeichen"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 bg-white"
                  />
                  {formData.password && formData.password.length < 6 && (
                    <span className="text-[10px] text-rose-600 mt-1 block font-medium">
                      Mindestens 6 Zeichen erforderlich.
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Passwort bestätigen *
                  </label>
                  <input
                    type="password"
                    placeholder="Passwort wiederholen"
                    value={formData.passwordConfirm}
                    onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 bg-white"
                  />
                  {formData.password && formData.passwordConfirm && formData.password !== formData.passwordConfirm && (
                    <span className="text-[10px] text-rose-600 mt-1 block font-medium">
                      Passwörter stimmen nicht überein.
                    </span>
                  )}
                  {formData.password && formData.passwordConfirm && formData.password === formData.passwordConfirm && formData.password.length >= 6 && (
                    <span className="text-[10px] text-emerald-600 mt-1 block font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Passwörter stimmen überein
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Restaurant-Stammdaten */}
            <div>
              <div className="flex items-center gap-2 pb-2 mb-3 border-b border-stone-200">
                <Store className="w-4 h-4 text-orange-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                  Restaurant-Stammdaten &amp; Betrieb
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Name des Restaurants *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Slogan / Untertitel
                  </label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Telefonnummer Restaurant *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Branding-Akzentfarbe
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.accentColor}
                      onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-stone-200 p-1"
                    />
                    <span className="text-xs font-mono text-stone-500">{formData.accentColor}</span>
                  </div>
                </div>

                <div className="sm:col-span-2 grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Straße &amp; Hausnummer
                    </label>
                    <input
                      type="text"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">PLZ *</label>
                    <input
                      type="text"
                      value={formData.plz}
                      onChange={(e) => setFormData({ ...formData, plz: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Stadt *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={validateAndNextStep1}
                className="bg-stone-900 hover:bg-black text-white font-bold py-3 px-6 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer"
              >
                <span>Weiter zu Liefergebieten</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SCHRITT 2: Liefergebiete */}
        {step === 2 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-soft space-y-5">
            <div>
              <h2 className="text-lg font-bold text-stone-900">2. Liefergebiete & Konditionen</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Definiere die belieferten PLZ mit Mindestbestellwerten und Liefergebühren.
              </p>
            </div>

            <div className="space-y-3">
              {formData.deliveryZones.map((zone, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex flex-wrap sm:flex-nowrap items-center gap-3"
                >
                  <div className="w-24">
                    <label className="text-[10px] font-bold text-stone-500 uppercase block">PLZ</label>
                    <input
                      type="text"
                      placeholder="z.B. 50672"
                      value={zone.plz}
                      onChange={(e) => updateDeliveryZone(idx, "plz", e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs font-bold"
                    />
                  </div>

                  <div className="flex-1 min-w-[140px]">
                    <label className="text-[10px] font-bold text-stone-500 uppercase block">Stadtteil</label>
                    <input
                      type="text"
                      placeholder="z.B. Innenstadt"
                      value={zone.areaName}
                      onChange={(e) => updateDeliveryZone(idx, "areaName", e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs"
                    />
                  </div>

                  <div className="w-28">
                    <label className="text-[10px] font-bold text-stone-500 uppercase block">Min. Bestellwert (€)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={zone.minOrder}
                      onChange={(e) => updateDeliveryZone(idx, "minOrder", e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold"
                    />
                  </div>

                  <div className="w-24">
                    <label className="text-[10px] font-bold text-stone-500 uppercase block">Liefergebühr (€)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={zone.deliveryFee}
                      onChange={(e) => updateDeliveryZone(idx, "deliveryFee", e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs"
                    />
                  </div>

                  {formData.deliveryZones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDeliveryZone(idx)}
                      className="text-stone-400 hover:text-rose-600 p-2 mt-3 sm:mt-0 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addDeliveryZone}
                className="w-full py-2.5 border-2 border-dashed border-stone-300 hover:border-orange-500 hover:bg-orange-50/40 rounded-xl text-xs font-bold text-stone-600 hover:text-orange-700 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Weiteres Liefergebiet (PLZ) hinzufügen</span>
              </button>
            </div>

            <div className="pt-4 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-bold text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Zurück</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="bg-stone-900 hover:bg-black text-white font-bold py-3 px-6 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer"
              >
                <span>Weiter zur Speisekarte</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SCHRITT 3: Speisekarte */}
        {step === 3 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-soft space-y-5">
            <div>
              <h2 className="text-lg font-bold text-stone-900">3. Speisekarte initialisieren</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Wähle eine getestete Gastro-Vorlage oder lade eine eigene CSV-Liste hoch.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, menuSource: "template" })}
                className={`p-4 rounded-2xl border text-left transition ${
                  formData.menuSource === "template"
                    ? "border-orange-600 bg-orange-50/50 ring-1 ring-orange-500/30"
                    : "border-stone-200 hover:bg-stone-50"
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center mb-2">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="font-bold text-sm text-stone-900">Gastro-Vorlage nutzen</div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  1-Klick Start mit fertigen Pizzen, Pasta oder Bowls
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, menuSource: "csv" })}
                className={`p-4 rounded-2xl border text-left transition ${
                  formData.menuSource === "csv"
                    ? "border-orange-600 bg-orange-50/50 ring-1 ring-orange-500/30"
                    : "border-stone-200 hover:bg-stone-50"
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-2">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div className="font-bold text-sm text-stone-900">Eigene CSV einfügen</div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  Import aus Excel / POS-Kassensystem
                </div>
              </button>
            </div>

            {formData.menuSource === "template" ? (
              <div className="space-y-3 pt-2">
                {[
                  {
                    id: "template_pizzeria",
                    name: "Italienische Pizzeria & Trattoria",
                    desc: "Pizza Margherita, Diavola, Penne all'Arrabbiata & San Pellegrino (inkl. 7%/19% MwSt & Allergenen)",
                    icon: "🍕",
                  },
                  {
                    id: "template_imbiss_burger",
                    name: "Burger & Döner Imbiss Express",
                    desc: "Smash Burger, Döner Kebab, Dürüm, Pommes frites & Coca-Cola (inkl. Saucen-Auswahl)",
                    icon: "🍔",
                  },
                  {
                    id: "template_asia_wok",
                    name: "Asia Wok & Nudel-Küche",
                    desc: "Gebratene Nudeln, Ente, Gelbes Thai-Curry, Frühlingsrollen & Mango-Lassi",
                    icon: "🥢",
                  },
                ].map((tpl) => (
                  <label
                    key={tpl.id}
                    onClick={() => setFormData({ ...formData, templateId: tpl.id })}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                      formData.templateId === tpl.id
                        ? "border-orange-600 bg-orange-50/60"
                        : "border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    <span className="text-2xl">{tpl.icon}</span>
                    <div className="flex-1">
                      <div className="font-bold text-sm text-stone-900">{tpl.name}</div>
                      <div className="text-xs text-stone-500 mt-0.5">{tpl.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <div className="text-xs text-stone-500">
                  Format: <code className="bg-stone-100 px-1 py-0.5 rounded text-[11px]">Kategorie;Nummer;Name;Beschreibung;Preis;MwSt;Allergene</code>
                </div>
                <textarea
                  rows={7}
                  value={formData.csvContent}
                  onChange={(e) => setFormData({ ...formData, csvContent: e.target.value })}
                  className="w-full font-mono text-xs p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
                />
              </div>
            )}

            <div className="pt-4 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs font-bold text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Zurück</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="bg-stone-900 hover:bg-black text-white font-bold py-3 px-6 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer"
              >
                <span>Weiter zur Vorschau</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SCHRITT 4: Vorschau & Scharfschalten */}
        {step === 4 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-soft space-y-6">
            <div>
              <h2 className="text-lg font-bold text-stone-900">4. Zusammenfassung & Live-Schaltung</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Überprüfe die Einstellungen. Mit Klick auf den Button wird das Restaurant sofort für Gäste erreichbar.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs">
              <div>
                <span className="text-stone-400 block font-semibold">Restaurant:</span>
                <span className="font-bold text-stone-900 text-sm">{formData.name}</span>
                <span className="text-stone-500 block">{formData.street}, {formData.plz} {formData.city}</span>
              </div>

              <div>
                <span className="text-stone-400 block font-semibold">Inhaber &amp; Login:</span>
                <span className="font-bold text-stone-900">{formData.ownerName}</span>
                <span className="text-stone-600 font-mono block">{formData.email}</span>
                <span className="text-stone-500 block">Passwort: •••••••• (selbst festgelegt)</span>
              </div>

              <div>
                <span className="text-stone-400 block font-semibold">Liefergebiete:</span>
                <span className="font-bold text-stone-900">{formData.deliveryZones.length} Postleitzahlen hinterlegt</span>
              </div>

              <div>
                <span className="text-stone-400 block font-semibold">Speisekarte:</span>
                <span className="font-bold text-stone-900">
                  {formData.menuSource === "template" ? "Branchenvorlage ausgewählt" : "Eigene CSV-Liste"}
                </span>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-xs font-bold text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Zurück</span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold py-3.5 px-8 rounded-xl text-sm flex items-center gap-2 shadow-sm transition active:scale-[0.99] cursor-pointer"
              >
                {submitting ? (
                  <span>Wird angelegt...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Restaurant jetzt scharfschalten & aktivieren</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* SCHRITT 5: ERFOLG */}
        {step === 5 && createdResult && (
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-stone-200 shadow-soft text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
                Erfolgreich online geschaltet
              </span>
              <h2 className="text-2xl font-black text-stone-900 mt-3">
                {createdResult.restaurant?.name} ist startklar!
              </h2>
              <p className="text-xs text-stone-500 mt-2 max-w-md mx-auto">
                Das Restaurant ist ab sofort unter der eigenen Webadresse erreichbar. Gäste können sofort bestellen.
              </p>
            </div>

            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 max-w-md mx-auto text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500">Live-URL für Gäste:</span>
                <span className="font-mono font-bold text-orange-600">{createdResult.liveUrl}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Artikel auf der Karte:</span>
                <span className="font-bold text-stone-800">{createdResult.restaurant?.items?.length} Gerichte &amp; Getränke</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Liefergebiete:</span>
                <span className="font-bold text-stone-800">{createdResult.restaurant?.deliveryZones?.length} PLZ-Zonen</span>
              </div>
              {createdResult.initialLogin && (
                <div className="pt-2 mt-2 border-t border-stone-200 bg-orange-50/60 p-3 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-orange-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
                      <span>Inhaber-Login (Sofort einsatzbereit):</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const txt = `E-Mail: ${createdResult.initialLogin.email}\nPasswort: ${createdResult.initialLogin.password}`;
                        navigator.clipboard.writeText(txt);
                        setCopiedLogin(true);
                        setTimeout(() => setCopiedLogin(false), 3000);
                      }}
                      className="text-[10px] font-bold text-orange-700 bg-white border border-orange-200 hover:bg-orange-100 px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition"
                    >
                      {copiedLogin ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Kopiert!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-stone-600" />
                          <span>Kopieren</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-stone-600">Inhaber:</span>
                    <span className="font-bold text-stone-900">{createdResult.initialLogin.name || formData.ownerName}</span>
                  </div>
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-stone-600">E-Mail:</span>
                    <span className="font-bold text-stone-900">{createdResult.initialLogin.email}</span>
                  </div>
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-stone-600">Passwort:</span>
                    <span className="font-bold text-stone-900">{createdResult.initialLogin.password}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 max-w-md mx-auto">
              <Link
                href={createdResult.liveUrl}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition"
              >
                <span>Zur Gäste-Speisekarte</span>
                <ExternalLink className="w-4 h-4" />
              </Link>

              <Link
                href={createdResult.adminUrl}
                className="flex-1 bg-stone-900 hover:bg-black text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition"
              >
                <ChefHat className="w-4 h-4 text-orange-400" />
                <span>Zum Küchen-Dashboard</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
