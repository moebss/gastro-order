import { NextRequest, NextResponse } from "next/server";
import {
  setSimulatorPaymentStatus,
  processMollieWebhook,
  getMolliePayment,
} from "../../../../lib/server/mollie-service";

export async function POST(req: NextRequest) {
  try {
    const { paymentId, status } = await req.json();

    if (!paymentId || !status) {
      return NextResponse.json(
        { success: false, error: "Fehlende Parameter." },
        { status: 400 }
      );
    }

    setSimulatorPaymentStatus(paymentId, status);
    const webhookResult = await processMollieWebhook(paymentId);
    const payment = await getMolliePayment(paymentId);

    return NextResponse.json({
      success: true,
      orderId: payment?.metadata?.orderId,
      status,
      isDuplicate: webhookResult.isDuplicate,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
