import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function DatenschutzPage() {
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
          <span className="text-xs text-stone-400 font-mono">DSGVO EU</span>
        </div>

        <div>
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center mb-3">
            <Shield className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-black text-stone-900">Datenschutzerklärung</h1>
          <p className="text-xs text-stone-500 mt-1">
            Transparente Datenverarbeitung nach Art. 13 & 14 DSGVO.
          </p>
        </div>

        <div className="text-xs text-stone-600 leading-relaxed space-y-5 border-t border-stone-100 pt-6">
          <section className="space-y-1.5">
            <h3 className="font-bold text-stone-900">1. Datensparsamkeit & Zweckbindung</h3>
            <p>
              Wir erheben personenbezogene Daten (Name, Telefonnummer, E-Mail-Adresse, Lieferadresse) ausschließlich für die Erfüllung des Kaufvertrags und die ordnungsgemäße Zustellung der bestellten Speisen und Getränke (Art. 6 Abs. 1 lit. b DSGVO). Es ist keine Registrierung oder Anlage eines dauerhaften Kundenkontos erforderlich.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-bold text-stone-900">2. Keine Tracking-Cookies</h3>
            <p>
              Diese Plattform setzt <strong>keine Tracking- oder Marketing-Cookies</strong> ein. Der lokale Speicher (LocalStorage / SessionStorage) dient ausschließlich technischen Zwecken, wie dem Zwischenspeichern deines Warenkorbs während des Bestellvorgangs.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-bold text-stone-900">3. Zahlungsabwicklung über Mollie</h3>
            <p>
              Wählst du eine Online-Zahlung (PayPal, Kreditkarte, Apple Pay, SEPA, Wero), werden die Zahlungsdaten verschlüsselt an unseren Zahlungsdienstleister Mollie B.V. (Keizersgracht 126, 1015 CW Amsterdam, Niederlande) weitergeleitet. Wir speichern zu keinem Zeitpunkt sensible Kreditkartendaten auf unseren Servern.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-bold text-stone-900">4. Hosting & Rechenzentrumsstandort</h3>
            <p>
              Alle Server und Datenbanken befinden sich in zertifizierten Rechenzentren innerhalb der Europäischen Union (Region Frankfurt am Main). Eine unzulässige Drittlandübermittlung findet nicht statt.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-bold text-stone-900">5. Deine Betroffenenrechte</h3>
            <p>
              Du hast das Recht auf unentgeltliche Auskunft über deine gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck der Datenverarbeitung sowie ein Recht auf Berichtigung, Sperrung oder Löschung dieser Daten (Art. 15–20 DSGVO).
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
