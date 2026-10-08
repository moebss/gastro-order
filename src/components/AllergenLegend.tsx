"use client";

import React, { useState } from "react";
import { ALLERGENS } from "../data/allergens";
import { ChevronDown, ChevronUp, AlertCircle } from "lucide-react";

export function AllergenLegend() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <footer className="mt-16 pt-8 border-t border-stone-200 text-stone-500 text-xs">
      {/* Allergen Accordion */}
      <div className="bg-stone-50 rounded-2xl p-4 sm:p-5 border border-stone-200/80 mb-6">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between font-bold text-stone-800 text-sm cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            <span>Kennzeichnung von Allergenen & Zusatzstoffen (LMIV)</span>
          </div>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-stone-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-stone-500" />
          )}
        </button>

        {isOpen && (
          <div className="mt-4 pt-4 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {ALLERGENS.map((allergen) => (
              <div key={allergen.code} className="flex items-start gap-2">
                <span className="w-5 h-5 rounded bg-stone-200 font-mono font-bold text-[10px] text-stone-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {allergen.code}
                </span>
                <div>
                  <div className="font-semibold text-stone-800">
                    {allergen.name}
                  </div>
                  <div className="text-[11px] text-stone-400 leading-tight">
                    {allergen.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rechtliche Hinweise & Links */}
      <div className="text-center space-y-2 text-stone-400 text-[11px]">
        <p>
          Alle Preise verstehen sich in Euro (€) inklusive der gesetzlichen Mehrwertsteuer (7% auf Speisen, 19% auf Getränke und Liefergebühren).
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap text-stone-600">
          <span className="hover:underline cursor-pointer">Impressum</span>
          <span>•</span>
          <span className="hover:underline cursor-pointer">Datenschutz</span>
          <span>•</span>
          <span className="hover:underline cursor-pointer">AGB</span>
          <span>•</span>
          <span className="hover:underline cursor-pointer">Widerrufsbelehrung</span>
        </div>
        <p className="pt-2 text-stone-400">
          © {new Date().getFullYear()} Pizzeria Bella Napoli • Powered by Gastro-Bestellsystem
        </p>
      </div>
    </footer>
  );
}
