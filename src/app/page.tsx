"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ALL_RESTAURANTS } from "../data/restaurants";
import { RestaurantGuestApp } from "../components/RestaurantGuestApp";
import {
  Store,
  Layers,
  ShieldCheck,
  ArrowRight,
  Database,
  ExternalLink,
  Code2,
  Sparkles,
} from "lucide-react";
import { formatEuro } from "../lib/calculations";

export default function HomePage() {
  const [selectedSlug, setSelectedSlug] = useState<string>("pizzeria-bella-napoli");
  const [mode, setMode] = useState<"direct_store" | "tenant_hub">("direct_store");

  const currentRestaurant =
    ALL_RESTAURANTS.find((r) => r.slug === selectedSlug) ||
    ALL_RESTAURANTS[0];

  return (
    <div>
      {/* Top Multi-Tenant Switcher Bar (Für Demo & Tests) */}
      <div className="bg-stone-900 text-stone-200 border-b border-stone-800 px-4 py-2 text-xs">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 font-bold text-white bg-stone-800 px-2.5 py-1 rounded-lg border border-stone-700">
              <Layers className="w-3.5 h-3.5 text-orange-400" />
              <span>Multi-Tenant Mandanten-Wechsler:</span>
            </span>

            {/* Switcher Tabs */}
            <div className="flex items-center gap-1.5">
              {ALL_RESTAURANTS.map((rest) => {
                const isActive = rest.slug === selectedSlug;
                return (
                  <button
                    key={rest.id}
                    onClick={() => {
                      setSelectedSlug(rest.slug);
                      setMode("direct_store");
                    }}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? "bg-orange-600 text-white shadow-xs"
                        : "bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white"
                    }`}
                  >
                    <span>{rest.logo}</span>
                    <span className="hidden md:inline">{rest.name}</span>
                    <span className="md:hidden">{rest.name.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode(mode === "direct_store" ? "tenant_hub" : "direct_store")}
              className="text-stone-300 hover:text-white flex items-center gap-1 underline underline-offset-2 transition-colors cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>{mode === "direct_store" ? "Mandanten-Info & RLS" : "Zurück zum Store"}</span>
            </button>

            <Link
              href={`/r/${currentRestaurant.slug}`}
              className="bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white px-2.5 py-1 rounded-lg flex items-center gap-1 text-[11px] font-mono border border-stone-700"
              title="Direkte Mandanten-URL aufrufen"
            >
              <span>/r/{currentRestaurant.slug}</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {mode === "tenant_hub" ? (
        /* Mandanten-Übersicht & Datenbank-Architektur View */
        <div className="min-h-screen bg-stone-100 py-10 px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-soft">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Meilenstein 2: Datenbank & Mandantenfähigkeit (RLS)</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900">
                Multi-Tenant Architektur & Speisekarten-Trennung
              </h1>
              <p className="text-stone-600 text-sm mt-2 leading-relaxed">
                Jedes Restaurant ist ein vollkommen isolierter Mandant mit eigener ID (<code className="text-xs bg-stone-100 px-1.5 py-0.5 rounded text-orange-700">restaurant_id</code>). Über PostgreSQL Row-Level-Security (RLS) ist garantiert, dass Betreiber und Gäste ausschließlich Zugriff auf die Daten ihres Mandanten haben.
              </p>

              {/* 2 Mandanten im Vergleich */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {ALL_RESTAURANTS.map((rest) => (
                  <div
                    key={rest.id}
                    className="p-5 rounded-2xl border border-stone-200 bg-stone-50 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{rest.logo}</span>
                        <div>
                          <h3 className="font-bold text-stone-900 text-base">
                            {rest.name}
                          </h3>
                          <span className="text-xs text-stone-400 font-mono">
                            ID: {rest.id}
                          </span>
                        </div>
                      </div>
                      <span
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: rest.accentColor }}
                        title="Akzentfarbe"
                      />
                    </div>

                    <p className="text-xs text-stone-600">{rest.tagline}</p>

                    <div className="text-xs text-stone-500 space-y-1 pt-2 border-t border-stone-200">
                      <div>
                        <strong>Standort:</strong> {rest.address.street}, {rest.address.plz} {rest.address.city}
                      </div>
                      <div>
                        <strong>Kategorien:</strong>{" "}
                        {rest.categories.map((c) => c.name).join(", ")}
                      </div>
                      <div>
                        <strong>Speisen & Getränke:</strong> {rest.items.length} Positionen
                      </div>
                    </div>

                    <div className="pt-2">
                      <Link
                        href={`/r/${rest.slug}`}
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90 cursor-pointer"
                        style={{ backgroundColor: rest.accentColor }}
                      >
                        <span>Speisekarte als Gast öffnen</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RLS & Tabellen Spezifikation */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-soft space-y-4">
              <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-orange-600" />
                <span>PostgreSQL Datenmodell & RLS-Sicherheitsregeln</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="font-bold block text-stone-900 mb-1">1. Tabellen</span>
                  <p className="text-stone-500">
                    <code className="text-[11px]">restaurants</code>, <code className="text-[11px]">categories</code>, <code className="text-[11px]">items</code>, <code className="text-[11px]">item_sizes</code>, <code className="text-[11px]">extras</code>, <code className="text-[11px]">orders</code>
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="font-bold block text-stone-900 mb-1">2. RLS Betreiber</span>
                  <p className="text-stone-500">
                    Nur eigene Datensätze veränderbar: <code className="text-[10px]">USING (restaurant_id = get_auth_restaurant_id())</code>
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="font-bold block text-stone-900 mb-1">3. RLS Gäste</span>
                  <p className="text-stone-500">
                    Öffentliche Speisekarten aktiv, Bestellungen nur mit geheimem Gast-Token abrufbar.
                  </p>
                </div>
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => setMode("direct_store")}
                  className="bg-stone-900 hover:bg-black text-white font-bold py-2.5 px-5 rounded-xl text-xs transition cursor-pointer"
                >
                  Zurück zur aktiven Speisekarte ({currentRestaurant.name})
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Aktiver Restaurant Store (wechselbar) */
        <RestaurantGuestApp key={currentRestaurant.id} restaurant={currentRestaurant} />
      )}
    </div>
  );
}
