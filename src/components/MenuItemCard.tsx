"use client";

import React from "react";
import { MenuItem } from "../types/restaurant";
import { formatEuro } from "../lib/calculations";
import { Plus, Ban } from "lucide-react";

interface MenuItemCardProps {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
}

export function MenuItemCard({ item, onSelect }: MenuItemCardProps) {
  const hasOptions = item.sizes.length > 0 || item.extraGroups.length > 0;
  const isSoldOut = item.isSoldOut;

  return (
    <article
      onClick={() => {
        if (!isSoldOut) onSelect(item);
      }}
      className={`group relative bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 transition-all flex flex-col justify-between ${
        isSoldOut
          ? "opacity-60 cursor-not-allowed bg-stone-50"
          : "hover:border-orange-500/50 hover:shadow-soft cursor-pointer active:scale-[0.99]"
      }`}
    >
      <div className="flex gap-4">
        {/* Text information */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200">
              Nr. {item.number}
            </span>
            {item.vatRate === 19 && (
              <span className="text-[10px] text-stone-400 font-medium">
                inkl. 19% MwSt.
              </span>
            )}
            {isSoldOut && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                <Ban className="w-3 h-3" /> Ausverkauft
              </span>
            )}
          </div>

          <h3 className="font-bold text-base sm:text-lg text-stone-900 group-hover:text-orange-600 transition-colors">
            {item.name}
          </h3>

          <p className="text-xs sm:text-sm text-stone-500 mt-1 line-clamp-2 leading-relaxed">
            {item.description}
          </p>

          {/* Allergen codes */}
          {item.allergens.length > 0 && (
            <div className="flex items-center gap-1 mt-2 text-[11px] text-stone-400">
              <span className="font-medium">Allergene:</span>
              <div className="flex gap-1 flex-wrap">
                {item.allergens.map((code) => (
                  <span
                    key={code}
                    className="px-1.5 py-0.2 bg-stone-100 text-stone-600 rounded text-[10px] font-mono border border-stone-200"
                    title={`Allergen-Code: ${code}`}
                  >
                    {code}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Optional Image */}
        {item.image && (
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden flex-shrink-0 bg-stone-100 relative shadow-inner">
            <img
              src={item.image}
              alt={item.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {isSoldOut && (
              <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[1px] flex items-center justify-center">
                <span className="text-white text-xs font-bold uppercase tracking-wider bg-rose-600 px-2 py-0.5 rounded shadow">
                  Weg
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer bar with price and action button */}
      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
        <div>
          <span className="text-xs text-stone-400 font-normal">
            {hasOptions && item.sizes.length > 1 ? "ab " : ""}
          </span>
          <span className="text-base sm:text-lg font-bold text-stone-900">
            {formatEuro(item.basePrice)}
          </span>
        </div>

        <button
          disabled={isSoldOut}
          onClick={(e) => {
            e.stopPropagation();
            if (!isSoldOut) onSelect(item);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            isSoldOut
              ? "bg-stone-200 text-stone-400 cursor-not-allowed"
              : "bg-orange-50 text-orange-700 hover:bg-orange-600 hover:text-white border border-orange-200 hover:border-orange-600"
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{hasOptions ? "Anpassen" : "Hinzufügen"}</span>
        </button>
      </div>
    </article>
  );
}
