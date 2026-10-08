import React from "react";
import { notFound } from "next/navigation";
import { getRestaurantBySlug, getAllRestaurants } from "../../../lib/supabase/database";
import { RestaurantGuestApp } from "../../../components/RestaurantGuestApp";
import Link from "next/link";
import { ArrowLeft, Store } from "lucide-react";

interface PageProps {
  params: {
    slug: string;
  };
}

export const dynamic = "force-dynamic";

export default async function RestaurantPage({ params }: PageProps) {
  const restaurant = await getRestaurantBySlug(params.slug);

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
          <Store className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-stone-900 mb-2">
          Restaurant nicht gefunden
        </h1>
        <p className="text-stone-500 text-sm max-w-md mb-6">
          Das Restaurant unter „{params.slug}“ ist derzeit nicht erreichbar oder existiert nicht.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-stone-900 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zur Mandanten-Auswahl</span>
        </Link>
      </div>
    );
  }

  return <RestaurantGuestApp restaurant={restaurant} />;
}
