"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import {
  CartItem,
  OrderType,
  PaymentMethod,
  CustomerData,
  DesiredTime,
  OrderCalculation,
  DeliveryZone,
  Restaurant,
} from "../types/restaurant";
import { calculateOrderSummary, roundToCents } from "../lib/calculations";
import { RESTAURANT_BELLA_NAPOLI } from "../data/restaurants";

interface CartContextType {
  restaurant: Restaurant;
  setRestaurant: (restaurant: Restaurant) => void;
  items: CartItem[];
  orderType: OrderType;
  selectedPlz: string;
  customer: CustomerData;
  desiredTime: DesiredTime;
  paymentMethod: PaymentMethod;
  isCartOpen: boolean;
  itemCount: number;
  calculation: OrderCalculation;
  isLoaded: boolean;
  addItem: (
    itemData: Omit<CartItem, "cartLineId" | "totalPrice">
  ) => void;
  updateQuantity: (cartLineId: string, delta: number) => void;
  removeItem: (cartLineId: string) => void;
  clearCart: () => void;
  setOrderType: (type: OrderType) => void;
  setSelectedPlz: (plz: string) => void;
  setCustomer: React.Dispatch<React.SetStateAction<CustomerData>>;
  setDesiredTime: (time: DesiredTime) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setIsCartOpen: (open: boolean) => void;
}

const initialCustomer: CustomerData = {
  name: "",
  phone: "",
  email: "",
  street: "",
  houseNumber: "",
  plz: "",
  city: "",
  comment: "",
};

const initialTime: DesiredTime = {
  type: "asap",
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({
  children,
  initialRestaurant = RESTAURANT_BELLA_NAPOLI,
}: {
  children: React.ReactNode;
  initialRestaurant?: Restaurant;
}) {
  const [restaurant, setRestaurant] = useState<Restaurant>(initialRestaurant);
  const [items, setItems] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>("delivery");
  const [selectedPlz, setSelectedPlz] = useState<string>(
    initialRestaurant.deliveryZones[0]?.plz || ""
  );
  const [customer, setCustomer] = useState<CustomerData>({
    ...initialCustomer,
    plz: initialRestaurant.deliveryZones[0]?.plz || "",
    city: initialRestaurant.address.city || "",
  });
  const [desiredTime, setDesiredTime] = useState<DesiredTime>(initialTime);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Mandanten-spezifischer LocalStorage-Key
  const storageKey = `gastro_cart_${restaurant.id}_v2`;

  // Beim Wechsel des Restaurants Daten aus dem jeweiligen Mandantenspeicher laden
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.items)) setItems(parsed.items);
        else setItems([]);
        if (parsed.orderType) setOrderType(parsed.orderType);
        if (parsed.selectedPlz) setSelectedPlz(parsed.selectedPlz);
        if (parsed.customer) setCustomer((prev) => ({ ...prev, ...parsed.customer }));
        if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod);
      } else {
        setItems([]);
        const defaultPlz = restaurant.deliveryZones[0]?.plz || "";
        setSelectedPlz(defaultPlz);
        setCustomer((prev) => ({
          ...prev,
          plz: defaultPlz,
          city: restaurant.address.city,
        }));
      }
    } catch (e) {
      console.warn("Fehler beim Laden des Mandanten-Warenkorbs:", e);
      setItems([]);
    } finally {
      setIsLoaded(true);
    }
  }, [restaurant.id, storageKey]);

  // Im mandantenspezifischen LocalStorage sichern
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const dataToSave = {
        items,
        orderType,
        selectedPlz,
        customer,
        paymentMethod,
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    } catch (e) {
      console.warn("Fehler beim Speichern des Warenkorbs:", e);
    }
  }, [items, orderType, selectedPlz, customer, paymentMethod, isLoaded, storageKey]);

  // Wenn PLZ geändert wird, selectedPlz synchronisieren
  useEffect(() => {
    if (customer.plz) {
      setSelectedPlz(customer.plz.trim());
    }
  }, [customer.plz]);

  const addItem = (itemData: Omit<CartItem, "cartLineId" | "totalPrice">) => {
    const extraKey = (itemData.selectedExtras || [])
      .map((e) => e.id)
      .sort()
      .join("_");
    const sizeKey = itemData.selectedSize?.id || "standard";
    const commentKey = (itemData.comment || "").trim().toLowerCase();
    const lineKey = `${itemData.itemId}-${sizeKey}-${extraKey}-${commentKey}`;

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((it) => it.cartLineId === lineKey);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        const existing = updated[existingIndex];
        const newQty = existing.quantity + itemData.quantity;
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          totalPrice: roundToCents(existing.unitPrice * newQty),
        };
        return updated;
      } else {
        const newItem: CartItem = {
          ...itemData,
          cartLineId: lineKey,
          totalPrice: roundToCents(itemData.unitPrice * itemData.quantity),
        };
        return [...prevItems, newItem];
      }
    });
  };

  const updateQuantity = (cartLineId: string, delta: number) => {
    setItems((prevItems) => {
      return prevItems
        .map((item) => {
          if (item.cartLineId !== cartLineId) return item;
          const nextQty = item.quantity + delta;
          if (nextQty <= 0) return null;
          return {
            ...item,
            quantity: nextQty,
            totalPrice: roundToCents(item.unitPrice * nextQty),
          };
        })
        .filter((it): it is CartItem => it !== null);
    });
  };

  const removeItem = (cartLineId: string) => {
    setItems((prevItems) => prevItems.filter((i) => i.cartLineId !== cartLineId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const calculation = useMemo(() => {
    return calculateOrderSummary(
      items,
      orderType,
      selectedPlz,
      restaurant.deliveryZones
    );
  }, [items, orderType, selectedPlz, restaurant.deliveryZones]);

  return (
    <CartContext.Provider
      value={{
        restaurant,
        setRestaurant,
        items,
        orderType,
        selectedPlz,
        customer,
        desiredTime,
        paymentMethod,
        isCartOpen,
        itemCount,
        calculation,
        isLoaded,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        setOrderType,
        setSelectedPlz,
        setCustomer,
        setDesiredTime,
        setPaymentMethod,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
