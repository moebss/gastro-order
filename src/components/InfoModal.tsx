"use client";

import React from "react";
import { X, Clock, MapPin, Phone, Mail, Bike } from "lucide-react";
import { useCart } from "../context/CartContext";
import { formatEuro } from "../lib/calculations";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InfoModal({ isOpen, onClose }: InfoModalProps) {
  const { restaurant } = useCart();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-float border border-stone-200 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div>
            <h2 className="text-xl font-bold text-stone-900">
              {restaurant.name}
            </h2>
            <p className="text-xs text-stone-500">
              Restaurant-Infos, Öffnungszeiten & Liefergebiete
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Adresse & Kontakt */}
        <div className="mt-5 space-y-2 text-xs text-stone-700 bg-stone-50 p-4 rounded-xl">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-600 flex-shrink-0" />
            <span>
              {restaurant.address.street}, {restaurant.address.plz}{" "}
              {restaurant.address.city}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-orange-600 flex-shrink-0" />
            <a
              href={`tel:${restaurant.phone}`}
              className="hover:underline font-medium"
            >
              {restaurant.phone}
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-orange-600 flex-shrink-0" />
            <a
              href={`mailto:${restaurant.email}`}
              className="hover:underline"
            >
              {restaurant.email}
            </a>
          </div>
        </div>

        {/* Öffnungszeiten */}
        <div className="mt-5">
          <h3 className="text-sm font-bold text-stone-900 mb-2.5 flex items-center gap-2">
            <Clock className="w-4 h-4 text-stone-600" />
            <span>Öffnungs- & Lieferzeiten</span>
          </h3>
          <div className="space-y-1.5 text-xs text-stone-600">
            {restaurant.openingHours.map((h) => (
              <div
                key={h.day}
                className="flex justify-between py-1 border-b border-stone-100 last:border-0"
              >
                <span className="font-semibold text-stone-800">{h.dayName}</span>
                <span>
                  {h.isOpen
                    ? h.slots.map((s) => `${s.from}–${s.to} Uhr`).join(" & ")
                    : "Ruhetag"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Liefergebiete & Mindestbestellwerte */}
        <div className="mt-6 pt-5 border-t border-stone-100">
          <h3 className="text-sm font-bold text-stone-900 mb-2.5 flex items-center gap-2">
            <Bike className="w-4 h-4 text-orange-600" />
            <span>Liefergebiete & Konditionen</span>
          </h3>
          <div className="space-y-2 text-xs">
            {restaurant.deliveryZones.map((zone) => (
              <div
                key={zone.plz}
                className="p-3 bg-stone-50 rounded-xl flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-stone-900">
                    PLZ {zone.plz} ({zone.areaName})
                  </span>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    Lieferzeit ca. {zone.estimatedMinutes} Min.
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-stone-800">
                    Min. {formatEuro(zone.minOrder)}
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Gebühr: {formatEuro(zone.deliveryFee)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 bg-stone-900 hover:bg-black text-white font-bold rounded-xl text-xs transition cursor-pointer"
        >
          Schließen
        </button>
      </div>
    </div>
  );
}
