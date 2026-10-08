import { NextRequest, NextResponse } from "next/server";
import { processMollieWebhook } from "../../../../lib/server/mollie-service";

export async function POST(req: NextRequest) {
  try {
    let paymentId: string | null = null;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      paymentId = formData.get("id") as string;
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      paymentId = body.id;
    } else {
      // Fallback auf URL search param oder Text
      const text = await req.text();
      const params = new URLSearchParams(text);
      paymentId = params.get("id");
    }

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: "Keine Zahlungs-ID (id) übermittelt." },
        { status: 400 }
      );
    }

    const result = await processMollieWebhook(paymentId);

    // Mollie erwartet 200 OK
    return NextResponse.json({
      success: true,
      paymentId,
      status: result.status,
      isDuplicate: result.isDuplicate,
    });
  } catch (error: any) {
    console.error("Mollie Webhook Fehler:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
