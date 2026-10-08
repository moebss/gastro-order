import React from "react";
import Link from "next/link";
import { ArrowLeft, Building } from "lucide-react";

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-stone-100/70 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-soft space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Zurück zur Speisekarte</span>
          </Link>
          <span className="text-xs text-stone-400 font-mono">Angaben gem. § 5 DDG</span>
        </div>

        <div>
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center mb-3">
            <Building className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-black text-stone-900">Impressum & Anbieterkennzeichnung</h1>
          <p className="text-xs text-stone-500 mt-1">
            Rechtliche Pflichtangaben für das Online-Bestellsystem.
          </p>
        </div>

        <div className="text-xs text-stone-600 leading-relaxed space-y-5 border-t border-stone-100 pt-6">
          <div>
            <h3 className="font-bold text-stone-900 mb-1">Dienstanbieter der Plattform:</h3>
            <p>GastroOrder Solutions Plattform (Musteranbieter)</p>
            <p>Musterstraße 42, 50672 Köln, Deutschland</p>
            <p>E-Mail: support@gastro-order-system.de | Telefon: +49 (0) 221 123456</p>
          </div>

          <div>
            <h3 className="font-bold text-stone-900 mb-1">Verantwortlicher Restaurant-Partner:</h3>
            <p>
              Vertragspartner für die Zubereitung, Kennzeichnung und Auslieferung der Speisen ist das jeweils ausgewählte Restaurant (z.B. Pizzeria Bella Napoli, Venloer Str. 42, 50823 Köln).
            </p>
          </div>

          <div>
            <h3 className="font-bold text-stone-900 mb-1">EU-Streitschlichtung & Verbraucherstreitbeilegung:</h3>
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noreferrer" className="text-orange-600 underline">
                https://ec.europa.eu/consumers/odr
              </a>. Wir sind weder verpflichtet noch bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
