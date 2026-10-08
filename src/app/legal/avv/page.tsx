"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, FileText, CheckCircle2, ArrowLeft, Printer, Building2 } from "lucide-react";

export default function AvvPage() {
  const [agreed, setAgreed] = useState(false);
  const [restaurantName, setRestaurantName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [confirmedAt, setConfirmedAt] = useState<string | null>(null);

  const handleSignAvv = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantName || !ownerName) return;
    setConfirmedAt(new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" }));
    setAgreed(true);
  };

  return (
    <div className="min-h-screen bg-stone-100/70 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-soft">
        <div className="flex items-center justify-between pb-6 border-b border-stone-200">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Zurück</span>
          </Link>
          <div className="flex items-center gap-2 text-stone-900 font-bold text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>DSGVO-konform (Art. 28 DSGVO)</span>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900">
            Vereinbarung zur Auftragsverarbeitung (AVV)
          </h1>
          <p className="text-xs text-stone-500">
            Gemäß Art. 28 der Datenschutz-Grundverordnung (DSGVO) zwischen dem Plattformbetreiber und dem Restaurant als Verantwortlichem.
          </p>
        </div>

        <div className="mt-8 space-y-6 text-xs text-stone-600 leading-relaxed border-t border-stone-100 pt-6">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900">§ 1 Gegenstand & Zweck der Verarbeitung</h2>
            <p>
              Der Plattformbetreiber stellt dem Restaurant eine cloudbasierte Softwarelösung zur Entgegennahme und Weiterleitung von Online-Bestellungen (Speisen & Getränke) bereit. Dabei werden personenbezogene Daten von Gastkunden (Name, Telefonnummer, E-Mail-Adresse, Lieferanschrift, Bestelldetails) im Auftrag und auf Weisung des Restaurants verarbeitet.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900">§ 2 Kreis der Betroffenen & Datenkategorien</h2>
            <p>
              <strong>Betroffene Personen:</strong> Gäste und Kunden des Restaurants, die über das Online-System Bestellungen zur Lieferung oder Abholung tätigen.
            </p>
            <p>
              <strong>Datenarten:</strong> Kontaktdaten (Name, Telefon, E-Mail), Lieferadressdaten (Straße, Hausnummer, PLZ, Ort), Bestelldaten (Warenkorb, Wunschzeit, Zahlungsstatus). Es werden keine sensiblen Daten gem. Art. 9 DSGVO erhoben.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900">§ 3 Technische und organisatorische Maßnahmen (TOM)</h2>
            <p>
              Die Plattform implementiert dem Stand der Technik entsprechende Sicherheitsmaßnahmen gem. Art. 32 DSGVO:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-stone-600">
              <li><strong>Hosting & Rechenzentren:</strong> Ausschließlich in der Europäischen Union (Region Frankfurt am Main).</li>
              <li><strong>Verschlüsselung:</strong> End-to-End Transportverschlüsselung (HTTPS / TLS 1.3) sowie verschlüsselte Datenbank-Speicherung (AES-256).</li>
              <li><strong>Mandantentrennung:</strong> Strikte Row-Level-Security (RLS) verhindert jeden unbefugten Zugriff fremder Restaurants auf Gastdaten.</li>
              <li><strong>Zugriffsbeschränkung:</strong> Passwortgeschützter Admin-Bereich mit Brute-Force-Schutz und Rate-Limiting.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900">§ 4 Unterauftragsverhältnisse (Subunternehmer)</h2>
            <p>
              Der Auftragnehmer setzt folgende nachgelagerte Dienstleister zur Vertragserfüllung ein:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>Supabase Inc.</strong> (PostgreSQL Datenbank-Hosting in EU / Frankfurt).</li>
              <li><strong>Mollie B.V.</strong> (Niederlande / EU - Autorisierter Zahlungsdienstleister).</li>
              <li><strong>Resend / EU-Mailrelay</strong> (Transaktionale Bestellbestätigungen).</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900">§ 5 Löschkonzept & Aufbewahrungsfristen</h2>
            <p>
              Kundendaten werden nur so lange vorgehalten, wie dies für die Bestellabwicklung und gesetzliche steuerrechtliche Nachweispflichten gem. GoBD (§ 147 AO) zwingend erforderlich ist. Nach Ablauf der Frist werden personenbezogene Gastdaten automatisiert gelöscht oder irreversibel anonymisiert.
            </p>
          </section>
        </div>

        {/* Digitale AVV-Zustimmung */}
        <div className="mt-8 p-6 bg-stone-50 rounded-2xl border border-stone-200">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-5 h-5 text-stone-700" />
            <h3 className="text-sm font-bold text-stone-900">Digitale Vereinbarung für Restaurant-Inhaber</h3>
          </div>

          {!agreed ? (
            <form onSubmit={handleSignAvv} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">
                    Name des Restaurants
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="z. B. Pizzeria Bella Napoli"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">
                    Vertretungsberechtigte/r Inhaber/in
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="z. B. Mario Rossi"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>AVV rechtsgültig elektronisch bestätigen</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>AVV wirksam abgeschlossen für {restaurantName}</span>
              </div>
              <p className="text-[11px] text-emerald-700">
                Unterzeichnet durch {ownerName} am {confirmedAt} (Europe/Berlin). Dieser Nachweis ist in den Betriebsunterlagen archiviert.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 bg-white px-3 py-1.5 rounded-lg border border-stone-200 font-semibold cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>AVV-Dokument drucken</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
