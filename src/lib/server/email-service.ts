import { Order, Restaurant } from "../../types/restaurant";
import { formatEuro } from "../calculations";

export interface EmailResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  error?: string;
}

/**
 * Versendet eine Transaktions-Bestellbestätigung an den Gast und das Restaurant via Resend
 */
export async function sendOrderConfirmationEmails(
  order: Order,
  restaurant: Restaurant
): Promise<{ customerEmail: EmailResult; restaurantEmail: EmailResult }> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "bestellung@resend.dev";

  const customerSubject = `Bestellbestätigung #${order.orderNumber} – ${restaurant.name}`;
  const restaurantSubject = `🚨 Neue Bestellung eingegangen: #${order.orderNumber} (${formatEuro(order.calculation.total)})`;

  const emailHtml = generateOrderConfirmationHtml(order, restaurant);

  // 1. E-Mail an den Gast
  let customerResult: EmailResult = { success: true, simulated: true };
  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${restaurant.name} <${fromEmail}>`,
          to: [order.customer.email],
          subject: customerSubject,
          html: emailHtml,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        customerResult = { success: true, messageId: data.id };
      } else {
        customerResult = { success: false, error: data.message };
      }
    } catch (e: any) {
      customerResult = { success: false, error: e.message };
    }
  } else {
    console.log(`[E-Mail Simulation] An Gast (${order.customer.email}): ${customerSubject}`);
  }

  // 2. Benachrichtigung an das Restaurant
  let restaurantResult: EmailResult = { success: true, simulated: true };
  if (resendApiKey && restaurant.email) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `Gastro Bestellsystem <${fromEmail}>`,
          to: [restaurant.email],
          subject: restaurantSubject,
          html: emailHtml,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        restaurantResult = { success: true, messageId: data.id };
      } else {
        restaurantResult = { success: false, error: data.message };
      }
    } catch (e: any) {
      restaurantResult = { success: false, error: e.message };
    }
  } else {
    console.log(`[E-Mail Simulation] An Restaurant (${restaurant.email}): ${restaurantSubject}`);
  }

  return { customerEmail: customerResult, restaurantEmail: restaurantResult };
}

function generateOrderConfirmationHtml(order: Order, restaurant: Restaurant): string {
  const isDelivery = order.orderType === "delivery";
  const itemsRows = order.items
    .map(
      (it) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">
        <strong>${it.quantity}x #${it.number} ${it.name}</strong><br>
        ${it.selectedSize ? `<span style="font-size: 12px; color: #666;">${it.selectedSize.name}</span><br>` : ""}
        ${it.selectedExtras.length > 0 ? `<span style="font-size: 11px; color: #888;">+ ${it.selectedExtras.map((e) => e.name).join(", ")}</span><br>` : ""}
        ${it.comment ? `<span style="font-size: 11px; color: #c2410c; font-style: italic;">"${it.comment}"</span>` : ""}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; vertical-align: top; font-weight: bold;">
        ${formatEuro(it.totalPrice)}
      </td>
    </tr>
  `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1c1917; background-color: #fbfaf8; padding: 20px; line-height: 1.5;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e7e5e4; padding: 24px;">
          <div style="text-align: center; border-bottom: 2px solid #ea580c; padding-bottom: 16px; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 24px; color: #ea580c;">${restaurant.name}</h1>
            <p style="margin: 4px 0 0 0; color: #78716c; font-size: 13px;">Bestellbestätigung #${order.orderNumber}</p>
          </div>

          <p>Hallo <strong>${order.customer.name}</strong>,</p>
          <p>vielen Dank für deine Bestellung! Deine Bestellung ist eingegangen und wird frisch zubereitet.</p>

          <div style="background: #fff7ed; border-radius: 8px; padding: 12px 16px; margin: 16px 0; border: 1px solid #fdba74;">
            <p style="margin: 0; font-size: 14px; font-weight: bold; color: #9a3412;">
              ${isDelivery ? "🚚 Lieferung" : "🏪 Abholung"} • ${order.paymentMethod === "cash" ? "Barzahlung" : "Online bezahlt"}
            </p>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #7c2d12;">
              Wunschzeit: ${order.desiredTime.type === "scheduled" ? order.desiredTime.timeSlot : "So schnell wie möglich"}
            </p>
            ${isDelivery ? `<p style="margin: 4px 0 0 0; font-size: 13px; color: #7c2d12;">Adresse: ${order.customer.street} ${order.customer.houseNumber}, ${order.customer.plz} ${order.customer.city}</p>` : ""}
          </div>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
            <thead>
              <tr style="background: #f5f5f4; text-align: left;">
                <th style="padding: 8px;">Artikel</th>
                <th style="padding: 8px; text-align: right;">Preis</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div style="border-top: 2px solid #e7e5e4; padding-top: 12px; font-size: 13px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>Zwischensumme:</span>
              <span>${formatEuro(order.calculation.subtotal)}</span>
            </div>
            ${isDelivery ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>Liefergebühr:</span>
              <span>${formatEuro(order.calculation.deliveryFee)}</span>
            </div>` : ""}
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: #78716c; margin-top: 6px;">
              <span>enthaltene 7% MwSt.:</span>
              <span>${formatEuro(order.calculation.vat7)}</span>
            </div>
            ${order.calculation.vat19 > 0 ? `
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: #78716c;">
              <span>enthaltene 19% MwSt.:</span>
              <span>${formatEuro(order.calculation.vat19)}</span>
            </div>` : ""}
            <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; margin-top: 10px; border-top: 1px solid #e7e5e4; padding-top: 8px;">
              <span>Gesamtbetrag:</span>
              <span style="color: #ea580c;">${formatEuro(order.calculation.total)}</span>
            </div>
          </div>

          <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #e7e5e4; font-size: 11px; color: #a8a29e; text-align: center;">
            <p style="margin: 0;">${restaurant.name} • ${restaurant.address.street}, ${restaurant.address.plz} ${restaurant.address.city}</p>
            <p style="margin: 2px 0 0 0;">Telefon: ${restaurant.phone} • E-Mail: ${restaurant.email}</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
