export type OrderStatus =
  | "new"
  | "preparing"
  | "delivering"
  | "ready"
  | "completed"
  | "cancelled";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Neu eingegangen",
  preparing: "In Zubereitung",
  delivering: "Unterwegs zum Gast",
  ready: "Abholbereit an der Theke",
  completed: "Abgeschlossen",
  cancelled: "Storniert",
};

/**
 * Erlaubte Statusübergänge nach betriebswirtschaftlicher Gastro-Logik
 */
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ["preparing", "cancelled"],
  preparing: ["delivering", "ready", "cancelled"],
  delivering: ["completed", "cancelled"],
  ready: ["completed", "cancelled"],
  completed: [], // Terminal
  cancelled: [], // Terminal
};

export function canTransitionStatus(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
  orderType: "delivery" | "pickup"
): { allowed: boolean; reason?: string } {
  if (currentStatus === nextStatus) {
    return { allowed: true };
  }

  const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(nextStatus)) {
    return {
      allowed: false,
      reason: `Ungültiger Statusübergang von „${ORDER_STATUS_LABELS[currentStatus]}“ zu „${ORDER_STATUS_LABELS[nextStatus]}“.`,
    };
  }

  // Zusätzliche Plausibilitätsprüfung für Lieferart
  if (orderType === "pickup" && nextStatus === "delivering") {
    return {
      allowed: false,
      reason: "Eine Abholbestellung kann nicht den Status „Unterwegs zum Gast“ annehmen.",
    };
  }

  if (orderType === "delivery" && nextStatus === "ready") {
    return {
      allowed: false,
      reason: "Eine Lieferbestellung nimmt den Status „Unterwegs“, nicht „Abholbereit“ an.",
    };
  }

  return { allowed: true };
}
