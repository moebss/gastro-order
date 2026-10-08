"use client";

import React, { useState, useEffect } from "react";
import { Restaurant, MenuItem, Order } from "../types/restaurant";
import { Header } from "./Header";
import { CategoryNav } from "./CategoryNav";
import { MenuItemCard } from "./MenuItemCard";
import { ItemCustomizerModal } from "./ItemCustomizerModal";
import { CartDrawer, MobileCartBar } from "./CartDrawer";
import { CheckoutView } from "./CheckoutView";
import { OrderSuccessView } from "./OrderSuccessView";
import { InfoModal } from "./InfoModal";
import { AllergenLegend } from "./AllergenLegend";
import { CartProvider, useCart } from "../context/CartContext";
import { formatEuro } from "../lib/calculations";
import { Clock, Bike, MapPin, Sparkles, Star } from "lucide-react";

function RestaurantGuestAppInner() {
  const { restaurant, isLoaded, addItem, setIsCartOpen } = useCart();
  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    restaurant.categories[0]?.id || ""
  );
  const [selectedItemForModal, setSelectedItemForModal] =
    useState<MenuItem | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [currentView, setCurrentView] = useState<"menu" | "checkout" | "success">(
    "menu"
  );
  const [lastCompletedOrder, setLastCompletedOrder] = useState<Order | null>(null);

  // Scroll spy für Kategorien
  useEffect(() => {
    if (currentView !== "menu") return;

    const handleScroll = () => {
      const scrollPos = window.scrollY + 180;
      for (const cat of restaurant.categories) {
        const el = document.getElementById(cat.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveCategoryId(cat.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [currentView, restaurant.categories]);

  const handleSelectCategory = (catId: string) => {
    setActiveCategoryId(catId);
    const target = document.getElementById(catId);
    if (target) {
      const offset = 120;
      const targetPos = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: targetPos, behavior: "smooth" });
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: `${restaurant.accentColor || "#ea580c"} transparent transparent transparent` }}
          />
          <span className="text-xs font-semibold text-stone-500">
            Lade Speisekarte von {restaurant.name}...
          </span>
        </div>
      </div>
    );
  }

  if (currentView === "checkout") {
    return (
      <CheckoutView
        onBackToMenu={() => setCurrentView("menu")}
        onOrderComplete={(order) => {
          setLastCompletedOrder(order);
          setCurrentView("success");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    );
  }

  if (currentView === "success" && lastCompletedOrder) {
    return (
      <OrderSuccessView
        order={lastCompletedOrder}
        onNewOrder={() => {
          setLastCompletedOrder(null);
          setCurrentView("menu");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    );
  }

  const defaultZone = restaurant.deliveryZones[0];

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      <Header onOpenInfo={() => setIsInfoOpen(true)} />

      {/* Hero Banner */}
      <section className="relative bg-white border-b border-stone-200 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold"
                style={{
                  backgroundColor: `${restaurant.accentColor || "#ea580c"}15`,
                  color: restaurant.accentColor || "#ea580c",
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{restaurant.tagline}</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight leading-tight">
                {restaurant.name}
              </h2>

              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                Frisch zubereitet, heiß geliefert oder kontaktlos zur Abholung bereitgestellt in {restaurant.address.city}.
              </p>

              {/* Service Badges */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-stone-600">
                {defaultZone && (
                  <div className="flex items-center gap-1.5 bg-stone-100 px-2.5 py-1 rounded-lg">
                    <Bike className="w-3.5 h-3.5" style={{ color: restaurant.accentColor }} />
                    <span>Lieferung ab {formatEuro(defaultZone.minOrder)}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 bg-stone-100 px-2.5 py-1 rounded-lg">
                  <Clock className="w-3.5 h-3.5" style={{ color: restaurant.accentColor }} />
                  <span>ca. {defaultZone ? defaultZone.estimatedMinutes : 35} Min.</span>
                </div>
                <div className="flex items-center gap-1.5 bg-stone-100 px-2.5 py-1 rounded-lg">
                  <MapPin className="w-3.5 h-3.5" style={{ color: restaurant.accentColor }} />
                  <span>{restaurant.address.street}, {restaurant.address.city}</span>
                </div>
              </div>
            </div>

            {restaurant.heroImage && (
              <div className="relative rounded-2xl overflow-hidden shadow-float max-h-52 md:max-h-60 md:w-80 flex-shrink-0">
                <img
                  src={restaurant.heroImage}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white text-xs">
                  <div className="flex items-center gap-1 text-amber-400 font-bold mb-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>4.9 von 5 Sternen</span>
                    <span className="text-stone-300 font-normal">(verifizierte Gäste)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Kategorieneinschub-Navigation */}
      <CategoryNav
        categories={restaurant.categories}
        activeCategoryId={activeCategoryId}
        onSelectCategory={handleSelectCategory}
      />

      {/* Speisekarte */}
      <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-10">
        {restaurant.categories.map((category) => {
          const itemsInCategory = restaurant.items.filter(
            (item) => item.categoryId === category.id
          );

          if (itemsInCategory.length === 0) return null;

          return (
            <section
              key={category.id}
              id={category.id}
              className="scroll-mt-32 space-y-4"
            >
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-xs sm:text-sm text-stone-500 mt-1">
                    {category.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                {itemsInCategory.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onSelect={(it) => setSelectedItemForModal(it)}
                  />
                ))}
              </div>
            </section>
          );
        })}

        <AllergenLegend />
      </main>

      <ItemCustomizerModal
        item={selectedItemForModal}
        onClose={() => setSelectedItemForModal(null)}
        onAddToCart={(configured) => addItem(configured)}
      />

      <CartDrawer
        onProceedToCheckout={() => {
          setCurrentView("checkout");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      <MobileCartBar onOpen={() => setIsCartOpen(true)} />

      <InfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />
    </div>
  );
}

export function RestaurantGuestApp({ restaurant }: { restaurant: Restaurant }) {
  return (
    <CartProvider initialRestaurant={restaurant}>
      <RestaurantGuestAppInner />
    </CartProvider>
  );
}
