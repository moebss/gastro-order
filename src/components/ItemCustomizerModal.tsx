"use client";

import React, { useState, useMemo, useEffect } from "react";
import { MenuItem, ItemSize, Extra, CartExtraItem } from "../types/restaurant";
import { formatEuro, calculateUnitPrice } from "../lib/calculations";
import { X, Plus, Minus, Check, AlertCircle } from "lucide-react";

interface ItemCustomizerModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (configuredItem: {
    itemId: string;
    number: string;
    name: string;
    selectedSize?: ItemSize;
    selectedExtras: CartExtraItem[];
    comment?: string;
    unitPrice: number;
    quantity: number;
    vatRate: 7 | 19;
  }) => void;
}

export function ItemCustomizerModal({
  item,
  onClose,
  onAddToCart,
}: ItemCustomizerModalProps) {
  if (!item) return null;

  // Standardmäßig erste Größe wählen (wenn vorhanden)
  const [selectedSize, setSelectedSize] = useState<ItemSize | undefined>(
    item.sizes.length > 0 ? item.sizes[0] : undefined
  );

  // Extras-Zustand: Map groupId -> Extra[]
  const [selectedExtrasMap, setSelectedExtrasMap] = useState<
    Record<string, Extra[]>
  >(() => {
    const initialMap: Record<string, Extra[]> = {};
    // Vorbelegung für Pflichtgruppen (z.B. 1. Dressing)
    item.extraGroups.forEach((grp) => {
      if (grp.required && grp.extras.length > 0) {
        initialMap[grp.id] = [grp.extras[0]];
      } else {
        initialMap[grp.id] = [];
      }
    });
    return initialMap;
  });

  const [quantity, setQuantity] = useState(1);
  const [comment, setComment] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Tastatur ESC zum Schließen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Flache Liste aller gewählten Extras
  const allSelectedExtrasList: CartExtraItem[] = useMemo(() => {
    const list: CartExtraItem[] = [];
    Object.entries(selectedExtrasMap).forEach(([groupId, extras]) => {
      const group = item.extraGroups.find((g) => g.id === groupId);
      extras.forEach((extra) => {
        list.push({
          id: extra.id,
          groupId,
          groupName: group?.name || "",
          name: extra.name,
          price: extra.price,
        });
      });
    });
    return list;
  }, [selectedExtrasMap, item.extraGroups]);

  // Dynamischer Einzelpreis
  const currentUnitPrice = useMemo(() => {
    return calculateUnitPrice(
      item.basePrice,
      selectedSize,
      allSelectedExtrasList
    );
  }, [item.basePrice, selectedSize, allSelectedExtrasList]);

  // Dynamischer Gesamtpreis für die gewählte Anzahl
  const currentTotal = useMemo(() => {
    return currentUnitPrice * quantity;
  }, [currentUnitPrice, quantity]);

  // Toggle für Extras
  const handleToggleExtra = (group: MenuItem["extraGroups"][0], extra: Extra) => {
    setValidationError(null);
    setSelectedExtrasMap((prev) => {
      const currentList = prev[group.id] || [];
      const exists = currentList.some((e) => e.id === extra.id);

      if (!group.multiple) {
        // Einzelauswahl (Radio)
        return {
          ...prev,
          [group.id]: exists && !group.required ? [] : [extra],
        };
      } else {
        // Mehrfachauswahl (Checkbox)
        if (exists) {
          return {
            ...prev,
            [group.id]: currentList.filter((e) => e.id !== extra.id),
          };
        } else {
          if (group.maxSelections && currentList.length >= group.maxSelections) {
            return prev;
          }
          return {
            ...prev,
            [group.id]: [...currentList, extra],
          };
        }
      }
    });
  };

  const handleConfirm = () => {
    // Validierung: Pflichtgruppen prüfen
    for (const group of item.extraGroups) {
      const count = (selectedExtrasMap[group.id] || []).length;
      if (group.required && count === 0) {
        setValidationError(`Bitte wähle eine Option bei „${group.name}“ aus.`);
        return;
      }
      if (group.minSelections && count < group.minSelections) {
        setValidationError(
          `Bitte wähle mindestens ${group.minSelections} Optionen bei „${group.name}“ aus.`
        );
        return;
      }
    }

    onAddToCart({
      itemId: item.id,
      number: item.number,
      name: item.name,
      selectedSize,
      selectedExtras: allSelectedExtrasList,
      comment: comment.trim() || undefined,
      unitPrice: currentUnitPrice,
      quantity,
      vatRate: item.vatRate,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-float overflow-hidden border border-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header mit Bild */}
        <div className="relative bg-stone-100 flex-shrink-0">
          {item.image && (
            <div className="h-44 sm:h-52 w-full overflow-hidden">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Schließen"
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-stone-900/70 hover:bg-stone-900 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title overlay or header text */}
          <div
            className={`p-4 sm:p-5 ${
              item.image ? "absolute bottom-0 inset-x-0 text-white" : "bg-white"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded ${
                  item.image
                    ? "bg-white/20 text-white backdrop-blur-md"
                    : "bg-orange-100 text-orange-800"
                }`}
              >
                Nr. {item.number}
              </span>
              <span
                className={`text-xs font-semibold ${
                  item.image ? "text-stone-200" : "text-stone-500"
                }`}
              >
                {item.vatRate === 7 ? "Speise (7% MwSt.)" : "Getränk (19% MwSt.)"}
              </span>
            </div>
            <h2
              className={`text-xl sm:text-2xl font-bold leading-snug ${
                item.image ? "text-white" : "text-stone-900"
              }`}
            >
              {item.name}
            </h2>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-stone-800">
          {/* Beschreibung */}
          <p className="text-sm text-stone-600 leading-relaxed">
            {item.description}
          </p>

          {/* Größen-Auswahl */}
          {item.sizes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-sm font-bold text-stone-900 uppercase tracking-wide">
                  Größe wählen
                </label>
                <span className="text-xs text-stone-500">Erforderlich</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {item.sizes.map((size) => {
                  const isChosen = selectedSize?.id === size.id;
                  return (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                        isChosen
                          ? "border-orange-600 bg-orange-50/70 text-orange-950 ring-2 ring-orange-600/20"
                          : "border-stone-200 bg-white hover:border-stone-300 text-stone-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isChosen
                              ? "border-orange-600 bg-orange-600"
                              : "border-stone-400"
                          }`}
                        >
                          {isChosen && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <span>{size.name}</span>
                      </div>
                      <span className="text-stone-900 font-bold">
                        {formatEuro(size.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Extra-Gruppen (Toppings, Dressings etc.) */}
          {item.extraGroups.map((group) => {
            const currentSelected = selectedExtrasMap[group.id] || [];
            return (
              <div key={group.id} className="pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between mb-2.5">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
                      {group.name}
                    </h3>
                    <p className="text-xs text-stone-500">
                      {group.required
                        ? "Bitte eine Option wählen"
                        : group.multiple
                        ? "Beliebig viele wählbar"
                        : "Maximal eine Option"}
                    </p>
                  </div>
                  {group.required && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                      Pflicht
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {group.extras.map((extra) => {
                    const isChecked = currentSelected.some(
                      (e) => e.id === extra.id
                    );
                    return (
                      <button
                        key={extra.id}
                        type="button"
                        onClick={() => handleToggleExtra(group, extra)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm transition-all cursor-pointer ${
                          isChecked
                            ? "border-orange-600 bg-orange-50/50 text-stone-900"
                            : "border-stone-200 bg-white hover:bg-stone-50 text-stone-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded ${
                              group.multiple ? "rounded-md" : "rounded-full"
                            } border flex items-center justify-center transition-colors ${
                              isChecked
                                ? "border-orange-600 bg-orange-600 text-white"
                                : "border-stone-300 bg-white"
                            }`}
                          >
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <span className="font-medium text-left">
                            {extra.name}
                          </span>
                        </div>
                        <span className="font-semibold text-stone-900">
                          {extra.price > 0 ? `+${formatEuro(extra.price)}` : "inklusive"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Bemerkung / Sonderwünsche */}
          <div className="pt-2 border-t border-stone-100">
            <label className="block text-sm font-bold text-stone-900 mb-1.5 uppercase tracking-wide">
              Besondere Wünsche
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="z.B. bitte knusprig backen, ohne Zwiebeln, Dressing separat..."
              maxLength={150}
              rows={2}
              className="w-full text-sm p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          {/* Validierungsfehler */}
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}
        </div>

        {/* Modal Sticky Bottom Action Bar */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex items-center gap-3 flex-shrink-0">
          {/* Menge (- 1 +) */}
          <div className="flex items-center border border-stone-300 rounded-xl bg-white shadow-xs">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Menge verringern"
              className="p-2.5 text-stone-600 hover:text-stone-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-bold text-stone-900 text-sm">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              aria-label="Menge erhöhen"
              className="p-2.5 text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Button: In den Warenkorb */}
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-orange-600/25 flex items-center justify-between transition-all transform active:scale-[0.99] cursor-pointer"
          >
            <span>In den Warenkorb</span>
            <span className="bg-orange-700/60 px-2.5 py-1 rounded-lg text-sm font-extrabold">
              {formatEuro(currentTotal)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
