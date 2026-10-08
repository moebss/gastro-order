"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Sparkles, CheckCircle2, ShoppingBag } from "lucide-react";

export default function DemoExternalWebsitePage() {
  const [origin, setOrigin] = useState("http://localhost:3000");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);

      // Skript für den Floating Button dynamisch laden, genau wie auf einer echten WordPress-Seite:
      const existingScript = document.getElementById("gastro-demo-embed-script");
      if (!existingScript) {
        const s = document.createElement("script");
        s.id = "gastro-demo-embed-script";
        s.src = `${window.location.origin}/embed.js`;
        s.setAttribute("data-restaurant", "pizzeria-bella-napoli");
        s.setAttribute("data-color", "#ea580c");
        s.setAttribute("data-label", "🍕 Pizza online bestellen");
        s.setAttribute("data-position", "right");
        document.body.appendChild(s);
      }
    }

    return () => {
      // Cleanup des Buttons beim Verlassen der Seite
      const btn = document.querySelector(".gastro-order-widget-btn");
      if (btn) btn.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 font-sans selection:bg-orange-500 selection:text-white">
      {/* Simulations-Banner */}
      <div className="bg-amber-500 text-stone-950 px-4 py-2 text-xs font-black flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2 max-w-4xl mx-auto w-full justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>
              LIVE-DEMO: Das hier simuliert die bestehende WordPress- oder Wix-Website eines Restaurants.
            </span>
          </div>
          <Link
            href="/admin"
            className="bg-stone-950 text-white px-3 py-1 rounded-lg text-[11px] font-bold hover:bg-stone-800 transition"
          >
            Zurück zum Admin-Portal
          </Link>
        </div>
      </div>

      {/* Simulierter WordPress-Header */}
      <header className="border-b border-stone-800 bg-stone-950/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🍕</span>
            <div>
              <div className="font-serif font-black text-lg text-white tracking-wide">
                Trattoria Bella Napoli
              </div>
              <div className="text-[10px] text-stone-400 uppercase tracking-widest">
                Köln-Ehrenfeld • Seit 1984
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs text-stone-300 font-medium">
            <span className="text-white hover:text-orange-400 cursor-pointer">Startseite</span>
            <span className="hover:text-orange-400 cursor-pointer">Über uns</span>
            <span className="hover:text-orange-400 cursor-pointer">Galerie</span>
            <span className="hover:text-orange-400 cursor-pointer">Kontakt</span>
            {/* Navigations-Button zur Speisekarte */}
            <a
              href={`${origin}/r/pizzeria-bella-napoli`}
              target="_blank"
              rel="noreferrer"
              className="bg-orange-600 hover:bg-orange-700 text-white px-3.5 py-2 rounded-full font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Speisekarte & Bestellen</span>
            </a>
          </nav>
        </div>
      </header>

      {/* Hero-Bereich der Restaurant-Website */}
      <section className="relative py-20 px-4 text-center max-w-4xl mx-auto">
        <span className="text-xs font-bold text-orange-400 uppercase tracking-widest bg-orange-950/60 border border-orange-800/60 px-3 py-1 rounded-full">
          Echte Steinofenpizza aus Neapel
        </span>
        <h1 className="text-3xl sm:text-5xl font-serif font-black text-white mt-4 tracking-tight leading-tight">
          Traditionelles Handwerk trifft auf frische Zutaten.
        </h1>
        <p className="text-sm sm:text-base text-stone-400 mt-4 max-w-2xl mx-auto leading-relaxed">
          Willkommen auf der Homepage von Mario & Team. Genießen Sie knusprige Holzofenpizza, handgemachte Pasta und erlesene Weine mitten in Köln.
        </p>

        {/* Hinweis auf den schwebenden Button */}
        <div className="mt-8 p-4 bg-stone-800/80 rounded-2xl border border-stone-700 max-w-lg mx-auto text-xs text-stone-300 text-left flex items-start gap-3 shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white block">
              Schau unten rechts auf deinen Bildschirm:
            </span>
            <span className="text-stone-400 text-[11px] leading-relaxed">
              Dort schwebt jetzt der Button <strong className="text-orange-400">„🍕 Pizza online bestellen ➔“</strong>. Er wurde durch eine einzige Zeile JavaScript auf dieser Seite erzeugt und leitet den Gast direkt in das Bestellsystem!
            </span>
          </div>
        </div>
      </section>

      {/* Eingebetteter iFrame Bereich (Möglichkeit 2) */}
      <section className="max-w-5xl mx-auto px-4 py-12 border-t border-stone-800">
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-950/60 border border-blue-800/60 px-3 py-1 rounded-full">
            Möglichkeit 2: Direkt eingebettet (iFrame)
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-3">
            Unsere Speisekarte direkt auf der Seite
          </h2>
          <p className="text-xs text-stone-400 mt-1 max-w-xl mx-auto">
            Unten siehst du das vollständige Bestellsystem als responsiver iFrame eingebettet. Du kannst hier direkt Artikel anklicken und testen:
          </p>
        </div>

        {/* Der eigentliche iFrame */}
        <div className="bg-white rounded-3xl overflow-hidden border-4 border-stone-700 shadow-2xl">
          <iframe
            src={`${origin}/r/pizzeria-bella-napoli`}
            title="Online Speisekarte"
            width="100%"
            height="850"
            className="w-full border-none"
            allow="payment"
            loading="lazy"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-800 py-8 px-4 text-center text-xs text-stone-500">
        <p>© 2026 Trattoria Bella Napoli (Simulierte Kunden-Website)</p>
      </footer>
    </div>
  );
}
