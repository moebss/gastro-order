export interface OpeningSlot {
  from: string; // "11:30"
  to: string;   // "14:30"
}

export interface OpeningHour {
  day: number; // 0 = Sonntag, 1 = Montag ... 6 = Samstag
  dayName: string;
  isOpen: boolean;
  slots: OpeningSlot[];
}

export interface DeliveryZone {
  plz: string;
  areaName: string;
  minOrder: number; // in Euro z.B. 15.00
  deliveryFee: number; // in Euro z.B. 1.50
  estimatedMinutes: number; // z.B. 35
}

export interface ItemSize {
  id: string;
  name: string; // z.B. "Normal Ø 28cm", "Familie Ø 40cm"
  price: number; // Absoluter Preis für diese Größe
}

export interface Extra {
  id: string;
  name: string; // z.B. "Extra Mozzarella", "Knoblauch"
  price: number;
}

export interface ExtraGroup {
  id: string;
  name: string; // z.B. "Wähle deine Extras", "Sauce"
  required: boolean;
  multiple: boolean;
  minSelections?: number;
  maxSelections?: number;
  extras: Extra[];
}

export interface MenuItem {
  id: string;
  categoryId: string;
  number: string; // z.B. "12", "14a"
  name: string;
  description: string;
  basePrice: number; // Standardpreis
  vatRate: 7 | 19; // 7% Speisen, 19% Getränke
  allergens: string[]; // z.B. ["A", "G"]
  image?: string;
  isSoldOut: boolean;
  order: number;
  sizes: ItemSize[];
  extraGroups: ExtraGroup[];
}

export interface Category {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  order: number;
  active: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  address: {
    street: string;
    plz: string;
    city: string;
  };
  phone: string;
  email: string;
  logo: string;
  heroImage: string;
  accentColor: string;
  active: boolean;
  deliveryZones: DeliveryZone[];
  openingHours: OpeningHour[];
  categories: Category[];
  items: MenuItem[];
}

export interface CartExtraItem {
  id: string;
  groupId: string;
  groupName: string;
  name: string;
  price: number;
}

export interface CartItem {
  cartLineId: string; // eindeutige Zeilen-ID
  itemId: string;
  categoryName?: string;
  number: string;
  name: string;
  selectedSize?: ItemSize;
  selectedExtras: CartExtraItem[];
  comment?: string;
  unitPrice: number;
  quantity: number;
  vatRate: 7 | 19;
  totalPrice: number;
}

export interface CustomerData {
  name: string;
  phone: string;
  email: string;
  street: string;
  houseNumber: string;
  plz: string;
  city: string;
  comment: string;
}

export interface DesiredTime {
  type: "asap" | "scheduled";
  timeSlot?: string; // z.B. "19:15"
}

export type OrderType = "delivery" | "pickup";
export type PaymentMethod = "cash" | "online";

export interface OrderCalculation {
  subtotal: number;
  deliveryFee: number;
  total: number;
  vat7: number;
  vat19: number;
  foodNet: number;
  drinkOrDeliveryNet: number;
  isMinOrderReached: boolean;
  minOrderDelta: number;
  minOrderRequired: number;
}

export interface Order {
  id: string;
  restaurantId: string;
  orderNumber: string;
  orderType: OrderType;
  customer: CustomerData;
  desiredTime: DesiredTime;
  paymentMethod: PaymentMethod;
  paymentStatus?: "pending" | "paid" | "failed" | "canceled";
  molliePaymentId?: string;
  mollieCheckoutUrl?: string;
  guestAccessToken?: string;
  items: CartItem[];
  calculation: OrderCalculation;
  status: "new" | "preparing" | "delivering" | "ready" | "completed" | "cancelled";
  createdAt: string;
}
