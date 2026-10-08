import React from "react";
import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";

export default function AgbPage() {
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
          <span className="text-xs text-stone-400 font-mono">BGB Konform</span>
        </div>

        <div>
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center mb-3">
            <Scale className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-black text-stone-900">
            Allgemeine Geschäftsbedingungen & Widerruf
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Gültig für Bestellungen über das Online-Bestellsystem.
          </p>
        </div>

        <div className="text-xs text-stone-600 leading-relaxed space-y-5 border-t border-stone-100 pt-6">
          <section className="space-y-1.5">
            <h3 className="font-bold text-stone-900">§ 1 Geltungsbereich & Vertragsschluss</h3>
            <p>
              Diese Geschäftsbedingungen gelten für alle Bestellungen von Speisen und Getränken über dieses System. Durch Klicken auf den Button „Zahlungspflichtig bestellen“ bzw. „Verbindlich bestellen“ gibt der Kunde ein verbindliches Angebot zum Abschluss eines Kaufvertrags ab. Der Vertrag kommt mit der Auftragsbestätigung und Weiterleitung in die Restaurantküche zustande.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-bold text-stone-900">§ 2 Preise, Liefergebühren & Mehrwertsteuer</h3>
            <p>
              Alle angegebenen Preise sind Endpreise in Euro inklusive der jeweils geltenden gesetzlichen Mehrwertsteuer (7 % für gelieferte Speisen, 19 % für Getränke und Liefergebühren). Eventuelle Mindestbestellwerte und Liefergebühren werden vor Abschluss der Bestellung transparent ausgewiesen.
            </p>
          </section>

          <section className="space-y-1.5 bg-amber-50/70 p-4 rounded-2xl border border-amber-200">
            <h3 className="font-bold text-amber-900">
              § 3 Gesetzliche Belehrung zum Ausschluss des Widerrufsrechts
            </h3>
            <p className="text-amber-800">
              Gemäß <strong>§ 312g Abs. 2 Nr. 2 BGB</strong> besteht das Widerrufsrecht <em>nicht</em> bei Verträgen zur Lieferung von Waren, die schnell verderben können oder deren Verfallsdatum schnell überschritten würde (wie frisch zubereitete warme Speisen, Pizzen, Salate und offene Getränke). Bereits in die Zubereitung übergebene Bestellungen können daher nicht widerrufen werden.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-bold text-stone-900">§ 4 Fälligkeit & Zahlung</h3>
            <p>
              Die Zahlung erfolgt nach Wahl des Kunden entweder online über den Zahlungsdienstleister Mollie (PayPal, Apple Pay, Kreditkarte, SEPA, Wero) vor der Zubereitung oder in bar bei der Übergabe der Ware an der Haustür bzw. im Restaurant.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
