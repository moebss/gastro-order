"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ALL_RESTAURANTS } from "../../data/restaurants";
import { Restaurant, Order, MenuItem } from "../../types/restaurant";
import { formatEuro } from "../../lib/calculations";
import { playNewOrderChime } from "../../lib/audio-bell";
import {
  ORDER_STATUS_LABELS,
  OrderStatus,
} from "../../lib/server/order-status-machine";
import {
  ShoppingBag,
  Bell,
  BellOff,
  Printer,
  CheckCircle2,
  Clock,
  Bike,
  Store,
  Phone,
  MapPin,
  RefreshCw,
  LogOut,
  Sliders,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Lock,
  Pause,
  Play,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Ban,
  Receipt,
  UtensilsCrossed,
  Plus,
  Code,
  Copy,
  Globe,
  Check,
  Users,
  UserPlus,
  Key,
  ShieldCheck,
  Trash2,
} from "lucide-react";

export default function AdminPage() {
  // Auth Zustand
  const [currentUser, setCurrentUser] = useState<{
    email: string;
    restaurantId: string;
  } | null>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  // Admin Navigation
  const [activeTab, setActiveTab] = useState<
    "orders" | "menu" | "settings" | "analytics" | "integration" | "users"
  >("orders");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  // Benutzer / Team Zustand
  const [teamUsers, setTeamUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"restaurant_owner" | "restaurant_staff">("restaurant_staff");
  const [userSuccessMessage, setUserSuccessMessage] = useState<string | null>(null);
  const [userErrorMessage, setUserErrorMessage] = useState<string | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Bestellungen Zustand
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastOrderCount, setLastOrderCount] = useState(0);

  // Ausgewählte Bon-Bestellung für Druck
  const [printOrder, setPrintOrder] = useState<Order | null>(null);

  // Aktives Restaurant
  const currentRestaurant =
    ALL_RESTAURANTS.find((r) => r.id === currentUser?.restaurantId) ||
    ALL_RESTAURANTS[0];

  // Lokale Speisekarten-Kopie für Live-Änderungen
  const [menuItems, setMenuItems] = useState<MenuItem[]>(
    currentRestaurant.items
  );
  const [menuMessage, setMenuMessage] = useState<string | null>(null);

  // Wenn Restaurant wechselt, Menü aktualisieren
  useEffect(() => {
    if (currentRestaurant) {
      setMenuItems([...currentRestaurant.items]);
      setMollieKeyInput(currentRestaurant.mollieApiKey || "");
    }
  }, [currentRestaurant]);

  const [mollieKeyInput, setMollieKeyInput] = useState(
    currentRestaurant.mollieApiKey || ""
  );
  const [mollieKeySaved, setMollieKeySaved] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const handleTestConnection = async () => {
    setIsTestingKey(true);
    setTestError(null);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/mollie-test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: mollieKeyInput,
          restaurantId: currentRestaurant.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult(data);
      } else {
        setTestError(data.error || "Verbindungstest fehlgeschlagen.");
      }
    } catch (e: any) {
      setTestError(e.message || "Netzwerkfehler.");
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleSaveMollieKey = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: currentUser.restaurantId,
          mollieApiKey: mollieKeyInput,
        }),
      });
      const data = await res.json();
      if (data.success) {
        currentRestaurant.mollieApiKey = mollieKeyInput;
        setMollieKeySaved(true);
        setTimeout(() => setMollieKeySaved(false), 3000);
      }
    } catch (e) {
      alert("Fehler beim Speichern des API-Schlüssels.");
    }
  };

  // Login Funktion
  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError(null);

    if (loginEmail === "bella@bella-napoli.de" || loginEmail === "bella") {
      setCurrentUser({
        email: "bella@bella-napoli.de",
        restaurantId: "rest_bella_napoli_01",
      });
    } else if (loginEmail === "napoli@pizzeria-napoli-horrem.de" || loginEmail === "napoli" || loginEmail === "horrem") {
      setCurrentUser({
        email: "info@pizzeria-napoli-horrem.de",
        restaurantId: "rest_napoli_horrem_03",
      });
    } else if (loginEmail === "wok@golden-wok.de" || loginEmail === "wok") {
      setCurrentUser({
        email: "wok@golden-wok.de",
        restaurantId: "rest_golden_wok_02",
      });
    } else {
      setLoginError("Ungültige Zugangsdaten. Bitte nutze die Schnell-Logins.");
    }
  };

  const handleQuickLogin = (restaurantId: string) => {
    if (restaurantId === "rest_bella_napoli_01") {
      setCurrentUser({
        email: "bella@bella-napoli.de",
        restaurantId: "rest_bella_napoli_01",
      });
    } else if (restaurantId === "rest_napoli_horrem_03") {
      setCurrentUser({
        email: "info@pizzeria-napoli-horrem.de",
        restaurantId: "rest_napoli_horrem_03",
      });
    } else {
      setCurrentUser({
        email: "wok@golden-wok.de",
        restaurantId: "rest_golden_wok_02",
      });
    }
  };

  // Bestellungen vom Server abrufen
  const fetchOrders = async (silent = false) => {
    if (!currentUser) return;
    if (!silent) setIsLoadingOrders(true);

    try {
      const res = await fetch(
        `/api/admin/orders?restaurantId=${currentUser.restaurantId}`
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        // Signalton bei NEUER Bestellung
        const newOrdersCount = data.orders.filter(
          (o: Order) => o.status === "new"
        ).length;

        if (
          lastOrderCount > 0 &&
          newOrdersCount > lastOrderCount &&
          soundEnabled
        ) {
          playNewOrderChime();
        }

        setLastOrderCount(newOrdersCount);
        setOrders(data.orders);
      }
    } catch (e) {
      console.warn("Fehler beim Abrufen der Bestellungen:", e);
    } finally {
      if (!silent) setIsLoadingOrders(false);
    }
  };

  // Initial & Auto-Refresh alle 10 Sekunden
  useEffect(() => {
    if (currentUser) {
      fetchOrders();
      const interval = setInterval(() => {
        fetchOrders(true);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [currentUser, soundEnabled, lastOrderCount]);

  // Benutzer für das aktuelle Restaurant laden
  const fetchUsers = async () => {
    if (!currentUser) return;
    setIsLoadingUsers(true);
    try {
      const res = await fetch(`/api/admin/users?restaurantId=${currentUser.restaurantId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setTeamUsers(data.users);
      }
    } catch (e) {
      console.warn("Fehler beim Laden der Benutzer:", e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (currentUser && activeTab === "users") {
      fetchUsers();
    }
  }, [currentUser, activeTab]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newUserEmail || !newUserName) return;
    setIsCreatingUser(true);
    setUserErrorMessage(null);
    setUserSuccessMessage(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUserEmail,
          name: newUserName,
          password: newUserPassword || "start123",
          restaurantId: currentUser.restaurantId,
          role: newUserRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUserSuccessMessage(`Zugang für '${newUserEmail}' erfolgreich angelegt!`);
        setNewUserEmail("");
        setNewUserName("");
        setNewUserPassword("");
        fetchUsers();
      } else {
        setUserErrorMessage(data.error || "Fehler beim Anlegen des Benutzers.");
      }
    } catch (e: any) {
      setUserErrorMessage(e.message || "Netzwerkfehler");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!currentUser || !confirm("Diesen Zugang wirklich entfernen?")) return;
    try {
      const res = await fetch(
        `/api/admin/users?userId=${userId}&restaurantId=${currentUser.restaurantId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        alert(data.error || "Fehler beim Löschen");
      }
    } catch (e) {
      alert("Fehler beim Löschen des Benutzers");
    }
  };

  // Status einer Bestellung ändern
  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (!currentUser) return;

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          newStatus,
          restaurantId: currentUser.restaurantId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      } else {
        alert(`Statuswechsel nicht erlaubt: ${data.error}`);
      }
    } catch (e: any) {
      alert("Netzwerkfehler beim Aktualisieren des Status.");
    }
  };

  // 1-Klick Ausverkauft Umschalter
  const handleToggleSoldOut = async (item: MenuItem) => {
    if (!currentUser) return;
    const nextSoldOut = !item.isSoldOut;

    try {
      const res = await fetch("/api/admin/menu", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: currentUser.restaurantId,
          itemId: item.id,
          isSoldOut: nextSoldOut,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMenuItems((prev) =>
          prev.map((it) =>
            it.id === item.id ? { ...it, isSoldOut: nextSoldOut } : it
          )
        );
        setMenuMessage(
          `„${item.name}“ ist jetzt ${nextSoldOut ? "ALS AUSVERKAUFT MARKIERT" : "WIEDER VERFÜGBAR"}.`
        );
        setTimeout(() => setMenuMessage(null), 3500);
      }
    } catch (e) {
      alert("Fehler beim Aktualisieren des Artikels.");
    }
  };

  // Preis anpassen
  const handleUpdatePrice = async (itemId: string, newPrice: number) => {
    if (!currentUser || newPrice <= 0) return;

    try {
      const res = await fetch("/api/admin/menu", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: currentUser.restaurantId,
          itemId,
          basePrice: newPrice,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMenuItems((prev) =>
          prev.map((it) =>
            it.id === itemId ? { ...it, basePrice: newPrice } : it
          )
        );
        setMenuMessage(`Neuer Preis von ${formatEuro(newPrice)} gespeichert.`);
        setTimeout(() => setMenuMessage(null), 3000);
      }
    } catch (e) {
      alert("Fehler beim Speichern des Preises.");
    }
  };

  // Bestellannahme pausieren / fortsetzen
  const handleTogglePause = async () => {
    if (!currentUser) return;
    const nextActive = !currentRestaurant.active;

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: currentUser.restaurantId,
          active: nextActive,
        }),
      });

      const data = await res.json();
      if (data.success) {
        currentRestaurant.active = nextActive;
        alert(
          nextActive
            ? "Bestellannahme wieder geöffnet!"
            : "Bestellannahme wurde pausiert. Gäste sehen den Pausenhinweis."
        );
      }
    } catch (e) {
      alert("Fehler beim Ändern der Einstellung.");
    }
  };

  // Filterung der Bestellungen
  const filteredOrders = orders.filter((o) => {
    if (statusFilter === "all") return true;
    return o.status === statusFilter;
  });

  const countByStatus = {
    all: orders.length,
    new: orders.filter((o) => o.status === "new").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    delivering: orders.filter((o) => o.status === "delivering" || o.status === "ready").length,
    completed: orders.filter((o) => o.status === "completed").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  // Statistiken
  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.calculation.total, 0);
  const avgOrderValue =
    orders.length > 0 ? totalRevenue / (orders.length || 1) : 0;

  // -------------------------------------------------------------
  // LOGIN SCREEN
  // -------------------------------------------------------------
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-600 text-white flex items-center justify-center text-3xl mx-auto shadow-xl shadow-orange-600/30 mb-4">
            🍽️
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Restaurant Admin Portal
          </h2>
          <p className="mt-1 text-xs text-stone-400">
            Mandantenfähige Verwaltung für Küchen & Betreiber
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-stone-800/90 border border-stone-700/80 py-8 px-6 shadow-2xl rounded-3xl sm:px-10 space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1">
                  E-Mail Adresse
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@restaurant.de"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider">
                    Passwort
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      alert(
                        "Passwort-Reset: Ein Link wurde an deine E-Mail gesendet (Demo)."
                      )
                    }
                    className="text-xs text-orange-400 hover:underline"
                  >
                    Passwort vergessen?
                  </button>
                </div>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {loginError && (
                <p className="text-xs text-rose-400 font-medium">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-orange-600/30 transition-all text-sm cursor-pointer"
              >
                Anmelden
              </button>
            </form>

            {/* Schnell-Login für Demo */}
            <div className="pt-4 border-t border-stone-700/70">
              <span className="block text-center text-xs text-stone-400 font-semibold mb-3 uppercase tracking-wider">
                1-Klick Schnell-Login (Demo)
              </span>

              <div className="grid grid-cols-1 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleQuickLogin("rest_napoli_horrem_03")}
                  className="flex items-center justify-between p-3 rounded-xl bg-stone-900/80 hover:bg-stone-700/60 border border-red-500/30 hover:border-red-500/60 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🍕</span>
                    <div>
                      <span className="font-bold text-xs text-stone-200 block">
                        Pizzeria Napoli Horrem
                      </span>
                      <span className="text-[10px] text-red-400 font-mono">
                        Kerpen-Horrem
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-500" />
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin("rest_bella_napoli_01")}
                  className="flex items-center justify-between p-3 rounded-xl bg-stone-900/80 hover:bg-stone-700/60 border border-stone-700 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🍕</span>
                    <div>
                      <span className="font-bold text-xs text-stone-200 block">
                        Pizzeria Bella Napoli
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        Köln-Ehrenfeld
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-500" />
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin("rest_golden_wok_02")}
                  className="flex items-center justify-between p-3 rounded-xl bg-stone-900/80 hover:bg-stone-700/60 border border-stone-700 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🥢</span>
                    <div>
                      <span className="font-bold text-xs text-stone-200 block">
                        Golden Wok Asia Express
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        Düsseldorf-Flingern
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-500" />
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/admin/onboarding"
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/40 text-orange-400 font-bold text-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Neues Restaurant anlegen (Onboarding)</span>
              </Link>
            </div>

            <div className="text-center pt-1">
              <Link
                href="/"
                className="text-xs text-stone-400 hover:text-white underline underline-offset-2"
              >
                Zurück zur Kunden-Ansicht
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // EINGELOGGTER ADMIN BEREICH
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-stone-100 flex flex-col pb-16">
      {/* Admin Top Bar */}
      <header className="bg-stone-900 text-white border-b border-stone-800 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{currentRestaurant.logo}</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-base sm:text-lg">
                  {currentRestaurant.name}
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-800 border border-stone-700 text-orange-400 font-bold">
                  ADMIN
                </span>
              </div>
              <p className="text-xs text-stone-400">
                {currentRestaurant.address.street}, {currentRestaurant.address.city}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Signalton Umschalter */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playNewOrderChime();
              }}
              title={soundEnabled ? "Signalton aktiv" : "Signalton stumm"}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                soundEnabled
                  ? "bg-stone-800 text-emerald-400 border border-emerald-500/30"
                  : "bg-stone-800 text-stone-500 border border-stone-700"
              }`}
            >
              {soundEnabled ? (
                <>
                  <Bell className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="hidden md:inline">Signalton an</span>
                </>
              ) : (
                <>
                  <BellOff className="w-4 h-4 text-stone-500" />
                  <span className="hidden md:inline">Stumm</span>
                </>
              )}
            </button>

            {/* Test Gong Button */}
            <button
              onClick={() => playNewOrderChime()}
              className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 text-xs rounded-xl font-medium cursor-pointer hidden sm:inline"
              title="Gastro-Glockenton testen"
            >
              Gong testen
            </button>

            {/* Aktualisieren */}
            <button
              onClick={() => fetchOrders(false)}
              className="p-2 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 rounded-xl transition cursor-pointer"
              title="Bestellungen jetzt aktualisieren"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoadingOrders ? "animate-spin" : ""}`}
              />
            </button>

            {/* Neuer Mandant anlegen */}
            <Link
              href="/admin/onboarding"
              className="hidden md:flex items-center gap-1.5 text-xs text-orange-400 hover:text-white bg-stone-800 hover:bg-stone-700 px-3 py-2 rounded-xl border border-stone-700 transition"
              title="Neues Restaurant anlegen"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Neuer Mandant</span>
            </Link>

            {/* Link zum Store */}
            <Link
              href={`/r/${currentRestaurant.slug}`}
              target="_blank"
              className="hidden sm:flex items-center gap-1 text-xs text-stone-300 hover:text-white bg-stone-800 px-2.5 py-2 rounded-xl border border-stone-700"
            >
              <span>Speisekarte ansehen</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            {/* Abmelden */}
            <button
              onClick={() => setCurrentUser(null)}
              className="p-2 text-stone-400 hover:text-rose-400 rounded-xl transition cursor-pointer"
              title="Abmelden"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-6xl mx-auto px-4 flex gap-2 border-t border-stone-800/80 pt-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("orders")}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === "orders"
                ? "border-orange-500 text-white"
                : "border-transparent text-stone-400 hover:text-stone-200"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Bestellungen</span>
            {countByStatus.new > 0 && (
              <span className="w-5 h-5 rounded-full bg-orange-600 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                {countByStatus.new}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("menu")}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === "menu"
                ? "border-orange-500 text-white"
                : "border-transparent text-stone-400 hover:text-stone-200"
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Speisekarte & Preise</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === "settings"
                ? "border-orange-500 text-white"
                : "border-transparent text-stone-400 hover:text-stone-200"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Öffnungszeiten & Zonen</span>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === "analytics"
                ? "border-orange-500 text-white"
                : "border-transparent text-stone-400 hover:text-stone-200"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Auswertung & Umsatz</span>
          </button>

          <button
            onClick={() => setActiveTab("integration")}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === "integration"
                ? "border-orange-500 text-white"
                : "border-transparent text-stone-400 hover:text-stone-200"
            }`}
          >
            <Code className="w-4 h-4 text-orange-400" />
            <span>Website-Einbindung</span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === "users"
                ? "border-orange-500 text-white"
                : "border-transparent text-stone-400 hover:text-stone-200"
            }`}
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Team & Logins</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-6 w-full flex-1">
        {/* ========================================================= */}
        {/* TAB 1: BESTELLUNGEN (LIVE MONITOR) */}
        {/* ========================================================= */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === "all"
                    ? "bg-stone-900 text-white shadow-xs"
                    : "bg-white text-stone-600 hover:bg-stone-200 border border-stone-200"
                }`}
              >
                Alle ({countByStatus.all})
              </button>

              <button
                onClick={() => setStatusFilter("new")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === "new"
                    ? "bg-orange-600 text-white shadow-xs"
                    : "bg-white text-orange-700 hover:bg-orange-50 border border-orange-200"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                <span>Neu ({countByStatus.new})</span>
              </button>

              <button
                onClick={() => setStatusFilter("preparing")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === "preparing"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-white text-amber-800 hover:bg-amber-50 border border-amber-200"
                }`}
              >
                In Zubereitung ({countByStatus.preparing})
              </button>

              <button
                onClick={() => setStatusFilter("delivering")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === "delivering"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white text-blue-800 hover:bg-blue-50 border border-blue-200"
                }`}
              >
                Unterwegs / Bereit ({countByStatus.delivering})
              </button>

              <button
                onClick={() => setStatusFilter("completed")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === "completed"
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200"
                }`}
              >
                Abgeschlossen ({countByStatus.completed})
              </button>
            </div>

            {/* Bestellkarten Grid */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 text-stone-400">
                <ShoppingBag className="w-12 h-12 stroke-1 mx-auto mb-3 text-stone-300" />
                <h3 className="font-bold text-base text-stone-800">
                  Keine Bestellungen in dieser Kategorie
                </h3>
                <p className="text-xs text-stone-400 mt-1">
                  Neue Kundenbestellungen erscheinen automatisch alle 10 Sekunden.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.map((order) => {
                  const isNew = order.status === "new";
                  const isDelivery = order.orderType === "delivery";

                  return (
                    <div
                      key={order.id}
                      className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between shadow-soft ${
                        isNew
                          ? "border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/20"
                          : "border-stone-200"
                      }`}
                    >
                      <div>
                        {/* Header der Karte */}
                        <div className="flex items-start justify-between pb-3 border-b border-stone-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-sm text-stone-900">
                                #{order.orderNumber}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  order.status === "new"
                                    ? "bg-orange-500 text-white animate-pulse"
                                    : order.status === "preparing"
                                    ? "bg-amber-100 text-amber-900"
                                    : order.status === "delivering" || order.status === "ready"
                                    ? "bg-blue-100 text-blue-900"
                                    : order.status === "completed"
                                    ? "bg-emerald-100 text-emerald-900"
                                    : "bg-rose-100 text-rose-900"
                                }`}
                              >
                                {ORDER_STATUS_LABELS[order.status as OrderStatus]}
                              </span>
                            </div>

                            <p className="text-[11px] text-stone-400 mt-0.5">
                              {new Date(order.createdAt).toLocaleTimeString("de-DE", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              Uhr •{" "}
                              {isDelivery ? "🚚 Lieferung" : "🏪 Abholung"}
                            </p>
                          </div>

                          {/* Bon Drucken Button */}
                          <button
                            onClick={() => setPrintOrder(order)}
                            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition cursor-pointer"
                            title="Bon drucken (58mm/80mm)"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Gast-Informationen */}
                        <div className="py-2.5 text-xs text-stone-700 space-y-1">
                          <div className="font-bold text-stone-900 flex items-center justify-between">
                            <span>{order.customer.name}</span>
                            <a
                              href={`tel:${order.customer.phone}`}
                              className="text-orange-600 hover:underline flex items-center gap-1 font-semibold text-[11px]"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{order.customer.phone}</span>
                            </a>
                          </div>

                          {isDelivery && (
                            <p className="text-stone-500 text-[11px]">
                              {order.customer.street} {order.customer.houseNumber},{" "}
                              {order.customer.plz} {order.customer.city}
                            </p>
                          )}

                          {order.customer.comment && (
                            <p className="text-[11px] bg-amber-50 text-amber-900 p-1.5 rounded italic">
                              Hinweis: {order.customer.comment}
                            </p>
                          )}

                          <div className="flex items-center gap-1 text-[11px] text-stone-500 pt-0.5">
                            <Clock className="w-3 h-3 text-stone-400" />
                            <span>
                              Wunschzeit:{" "}
                              {order.desiredTime.type === "scheduled"
                                ? order.desiredTime.timeSlot
                                : "So schnell wie möglich"}
                            </span>
                          </div>
                        </div>

                        {/* Positionen */}
                        <div className="py-2 border-t border-stone-100 space-y-1 text-xs">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between items-start">
                              <div>
                                <span className="font-bold text-stone-900">
                                  {it.quantity}x
                                </span>{" "}
                                <span className="text-stone-800">{it.name}</span>
                                {it.selectedSize && (
                                  <span className="text-[11px] text-stone-400 block pl-4">
                                    {it.selectedSize.name}
                                  </span>
                                )}
                                {it.selectedExtras.length > 0 && (
                                  <span className="text-[10px] text-stone-400 block pl-4">
                                    +{it.selectedExtras.map((e) => e.name).join(", ")}
                                  </span>
                                )}
                              </div>
                              <span className="font-semibold text-stone-800">
                                {formatEuro(it.totalPrice)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Footer & Status Aktionen */}
                      <div className="pt-3 border-t border-stone-100 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-stone-500">
                            {order.paymentMethod === "cash"
                              ? "Bar bei Übergabe"
                              : "Online bezahlt (Mollie)"}
                          </span>
                          <span className="font-extrabold text-sm text-stone-900">
                            {formatEuro(order.calculation.total)}
                          </span>
                        </div>

                        {/* Workflow Action Buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          {order.status === "new" && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(order.id, "preparing")}
                                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-3 rounded-xl text-xs transition cursor-pointer"
                              >
                                👨‍🍳 In Zubereitung
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(order.id, "cancelled")}
                                className="px-2.5 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold cursor-pointer"
                              >
                                Stornieren
                              </button>
                            </>
                          )}

                          {order.status === "preparing" && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(
                                  order.id,
                                  isDelivery ? "delivering" : "ready"
                                )
                              }
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-xl text-xs transition cursor-pointer"
                            >
                              {isDelivery ? "🚴 Als Unterwegs markieren" : "🛍️ Als Abholbereit markieren"}
                            </button>
                          )}

                          {(order.status === "delivering" || order.status === "ready") && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, "completed")}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs transition cursor-pointer"
                            >
                              ✓ Bestellung abschließen
                            </button>
                          )}

                          {order.status === "completed" && (
                            <span className="w-full text-center py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg">
                              ✓ Vollständig ausgeliefert
                            </span>
                          )}

                          {order.status === "cancelled" && (
                            <span className="w-full text-center py-1.5 text-xs font-bold text-rose-700 bg-rose-50 rounded-lg">
                              ✕ Storniert
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: SPEISEKARTE & PREISE BEARBEITEN */}
        {/* ========================================================= */}
        {activeTab === "menu" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-stone-200 shadow-soft">
              <div>
                <h2 className="text-lg font-bold text-stone-900">
                  Speisekarten- & Preisverwaltung
                </h2>
                <p className="text-xs text-stone-500">
                  Passe Preise direkt an oder schalte ausverkaufte Artikel mit 1 Klick stumm.
                </p>
              </div>

              {menuMessage && (
                <div className="px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{menuMessage}</span>
                </div>
              )}
            </div>

            {/* Artikelliste */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between shadow-soft ${
                    item.isSoldOut
                      ? "border-rose-300 bg-rose-50/20"
                      : "border-stone-200"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                            #{item.number}
                          </span>
                          <h3 className="font-bold text-sm text-stone-900">
                            {item.name}
                          </h3>
                        </div>
                        <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      {/* 1-Klick Ausverkauft Toggle */}
                      <button
                        onClick={() => handleToggleSoldOut(item)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          item.isSoldOut
                            ? "bg-rose-600 text-white shadow-xs"
                            : "bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200"
                        }`}
                      >
                        {item.isSoldOut ? (
                          <>
                            <Ban className="w-3.5 h-3.5" />
                            <span>Ausverkauft</span>
                          </>
                        ) : (
                          <span>Verfügbar</span>
                        )}
                      </button>
                    </div>

                    {/* Preisanpassung */}
                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                      <span className="text-stone-500 font-medium">Grundpreis:</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.10"
                          min="0.50"
                          defaultValue={item.basePrice}
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val !== item.basePrice) {
                              handleUpdatePrice(item.id, val);
                            }
                          }}
                          className="w-20 px-2 py-1 rounded-lg border border-stone-300 font-bold text-right text-stone-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                        <span className="font-bold text-stone-700">€</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: EINSTELLUNGEN & LIEFERGEBIETE */}
        {/* ========================================================= */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            {/* Notfall-Pause Schalter */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-soft flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span>Bestellannahme Pausieren</span>
                </h3>
                <p className="text-xs text-stone-500 mt-1 max-w-lg">
                  Wenn die Küche überlastet ist, kannst du den Shop vorübergehend schließen. Gäste sehen eine verständliche Pausen-Nachricht.
                </p>
              </div>

              <button
                onClick={handleTogglePause}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
                  currentRestaurant.active
                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                {currentRestaurant.active ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Jetzt pausieren</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Wieder öffnen</span>
                  </>
                )}
              </button>
            </div>

            {/* Liefergebiete */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-soft space-y-4">
              <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
                <Bike className="w-5 h-5 text-orange-600" />
                <span>Liefergebiete & Mindestbestellwerte</span>
              </h3>

              <div className="divide-y divide-stone-100 text-xs">
                {currentRestaurant.deliveryZones.map((z) => (
                  <div
                    key={z.plz}
                    className="py-3 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-stone-900">
                        PLZ {z.plz} ({z.areaName})
                      </span>
                      <p className="text-stone-400 text-[11px]">
                        Geschätzte Lieferzeit: {z.estimatedMinutes} Min.
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-stone-900">
                        Min. {formatEuro(z.minOrder)}
                      </div>
                      <div className="text-stone-500 text-[11px]">
                        Gebühr: {formatEuro(z.deliveryFee)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Öffnungszeiten */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-soft space-y-4">
              <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-stone-700" />
                <span>Hinterlegte Öffnungs- & Küchenzeiten</span>
              </h3>

              <div className="divide-y divide-stone-100 text-xs">
                {currentRestaurant.openingHours.map((h) => (
                  <div
                    key={h.day}
                    className="py-2.5 flex justify-between items-center"
                  >
                    <span className="font-semibold text-stone-800">
                      {h.dayName}
                    </span>
                    <span className="text-stone-600">
                      {h.isOpen
                        ? h.slots.map((s) => `${s.from}–${s.to} Uhr`).join(" & ")
                        : "Ruhetag"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Online-Zahlung & Mollie-Konto */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-soft space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    <span>Mollie Online-Zahlung (PayPal, Apple Pay, Karte)</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 max-w-xl leading-relaxed">
                    Hinterlege deinen persönlichen Mollie-API-Schlüssel, damit Einnahmen aus Online-Bestellungen direkt und ohne Umwege auf dein Restaurant-Bankkonto überwiesen werden.
                  </p>
                </div>

                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                    mollieKeyInput.startsWith("live_")
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : mollieKeyInput.startsWith("test_")
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-stone-100 text-stone-600 border-stone-200"
                  }`}
                >
                  {mollieKeyInput.startsWith("live_")
                    ? "Live-Konto aktiv"
                    : mollieKeyInput.startsWith("test_")
                    ? "Test-Modus"
                    : "Simulator aktiv"}
                </span>
              </div>

              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Mollie API-Schlüssel (beginnt mit live_ oder test_)
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="password"
                      placeholder="live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={mollieKeyInput}
                      onChange={(e) => setMollieKeyInput(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-mono bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={isTestingKey}
                        onClick={handleTestConnection}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                      >
                        {isTestingKey ? (
                          <span>Prüfe...</span>
                        ) : (
                          <>
                            <span>⚡ Verbindung testen</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveMollieKey}
                        className="bg-stone-900 hover:bg-black text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        {mollieKeySaved ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span>Gespeichert!</span>
                          </>
                        ) : (
                          <span>Speichern</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Testergebnis Anzeige */}
                {testResult && (
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-2.5 animate-fadeIn">
                    <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>Verbindung zu Mollie erfolgreich hergestellt!</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-emerald-900 bg-white/80 p-3 rounded-xl border border-emerald-200/80">
                      <div>
                        <span className="text-emerald-700 block font-semibold">Zahlungsempfänger:</span>
                        <span className="font-bold">{testResult.organizationName}</span>
                      </div>
                      <div>
                        <span className="text-emerald-700 block font-semibold">Auszahlungskonto (IBAN):</span>
                        <span className="font-mono font-bold">{testResult.ibanMasked}</span>
                      </div>
                      <div>
                        <span className="text-emerald-700 block font-semibold">Bank:</span>
                        <span>{testResult.bankName}</span>
                      </div>
                      <div>
                        <span className="text-emerald-700 block font-semibold">Auszahlungsplan:</span>
                        <span className="font-semibold">{testResult.payoutSchedule}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1.5">
                        Freigeschaltete Online-Zahlungsarten für Gäste:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(testResult.methods || []).map((m: any) => (
                          <span
                            key={m.id}
                            className="bg-white text-emerald-900 font-bold px-2.5 py-1 rounded-lg border border-emerald-200 text-[10px] flex items-center gap-1 shadow-2xs"
                          >
                            <span>{m.icon || "✓"}</span>
                            <span>{m.name}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-[11px] text-emerald-800 pt-1 leading-relaxed">
                      💡 <strong>Finanzieller Ablauf:</strong> Wenn ein Gast auf deiner Website online bestellt, bucht Mollie den Betrag direkt auf dein Geschäftskonto. Die Plattform hat zu keinem Zeitpunkt Zugriff auf dein Geld.
                    </p>
                  </div>
                )}

                {testError && (
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{testError}</span>
                  </div>
                )}

                <div className="text-[11px] text-stone-500 space-y-1 pt-1 border-t border-stone-200/60">
                  <p className="font-semibold text-stone-700">So findest du deinen Schlüssel:</p>
                  <ol className="list-decimal list-inside space-y-0.5 text-stone-600">
                    <li>Logge dich auf <a href="https://www.mollie.com/dashboard" target="_blank" rel="noreferrer" className="text-orange-600 underline">mollie.com</a> in dein Restaurant-Konto ein.</li>
                    <li>Klicke im Menü auf <strong>Entwickler ➔ API-Schlüssel</strong>.</li>
                    <li>Kopiere den <strong>Live API-Schlüssel</strong> und füge ihn hier ein.</li>
                  </ol>
                  <p className="text-[10px] text-stone-400 pt-1">
                    Ohne eigenen Schlüssel läuft das System automatisch im sicheren Entwickler-Simulator.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: AUSWERTUNG & UMSATZ */}
        {/* ========================================================= */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-soft">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wide">
                  Gesamtumsatz
                </span>
                <div className="text-2xl font-black text-stone-900 mt-1">
                  {formatEuro(totalRevenue)}
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  Aus {orders.length} Bestellungen
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-soft">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wide">
                  Ø Bestellwert
                </span>
                <div className="text-2xl font-black text-stone-900 mt-1">
                  {formatEuro(avgOrderValue)}
                </div>
                <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                  Solider Gastro-Warenkorb
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-soft">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wide">
                  Offene Bestellungen
                </span>
                <div className="text-2xl font-black text-orange-600 mt-1">
                  {countByStatus.new + countByStatus.preparing}
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  Aktuell in der Zubereitung
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: WEBSITE-EINBINDUNG & WIDGETS */}
        {/* ========================================================= */}
        {activeTab === "integration" && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-soft">
              <div className="flex items-start justify-between gap-4 pb-6 border-b border-stone-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                    Integration & Go-Live
                  </span>
                  <h2 className="text-xl font-black text-stone-900 mt-2">
                    Wie Gäste auf deiner bestehenden Website bestellen
                  </h2>
                  <p className="text-xs text-stone-500 mt-1 max-w-2xl leading-relaxed">
                    Du musst keine neue Website bauen. Integriere das Bestellsystem einfach in deine bestehende Website (WordPress, Wix, Jimdo, Squarespace, Webflow oder reines HTML).
                  </p>
                </div>

                <div className="hidden sm:flex items-center gap-2">
                  <a
                    href={`/r/${currentRestaurant.slug}`}
                    target="_blank"
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
                  >
                    <span>Live-Karte testen</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Direkte URL */}
              <div className="mt-6 p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Deine direkte Gäste-Webadresse:
                  </span>
                  <span className="font-mono font-bold text-xs sm:text-sm text-stone-900 break-all">
                    {typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}
                    /r/{currentRestaurant.slug}
                  </span>
                </div>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/r/${currentRestaurant.slug}`;
                    navigator.clipboard.writeText(url);
                    setCopiedSnippet("direct-url");
                    setTimeout(() => setCopiedSnippet(null), 2500);
                  }}
                  className="bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  {copiedSnippet === "direct-url" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Kopiert!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>URL kopieren</span>
                    </>
                  )}
                </button>
              </div>

              {/* Die 3 Integrations-Optionen */}
              <div className="mt-8 space-y-6">
                {/* OPTION 1: Floating Widget Button */}
                <div className="p-5 rounded-2xl border border-stone-200 hover:border-orange-300 transition space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs">
                        1
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-stone-900">
                          Schwebender Bestellbutton (Empfohlen ⭐)
                        </h3>
                        <p className="text-[11px] text-stone-500">
                          Fügt auf dem Smartphone unten rechts einen festen, pulsierenden Button „🛍️ Online bestellen“ ein.
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Höchste Conversion
                    </span>
                  </div>

                  <div className="relative">
                    <pre className="bg-stone-900 text-stone-200 text-[11px] font-mono p-3.5 rounded-xl overflow-x-auto">
{`<script
  src="${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/embed.js"
  data-restaurant="${currentRestaurant.slug}"
  data-color="${currentRestaurant.accentColor || "#ea580c"}"
  data-label="Online bestellen"
  data-position="right">
</script>`}
                    </pre>
                    <button
                      onClick={() => {
                        const origin = window.location.origin;
                        const code = `<script src="${origin}/embed.js" data-restaurant="${currentRestaurant.slug}" data-color="${currentRestaurant.accentColor || "#ea580c"}" data-label="Online bestellen" data-position="right"></script>`;
                        navigator.clipboard.writeText(code);
                        setCopiedSnippet("widget");
                        setTimeout(() => setCopiedSnippet(null), 2500);
                      }}
                      className="absolute top-2.5 right-2.5 bg-stone-800 hover:bg-stone-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg border border-stone-700 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copiedSnippet === "widget" ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Kopiert!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Code kopieren</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-stone-400">
                    Einfach vor dem schließenden &lt;/body&gt;-Tag oder in die Einstellungen deiner Website (z. B. WordPress Header/Footer Plugin, Wix Custom Code) einfügen.
                  </p>
                </div>

                {/* OPTION 2: iFrame Einbettung */}
                <div className="p-5 rounded-2xl border border-stone-200 hover:border-orange-300 transition space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        2
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-stone-900">
                          Direkte iFrame-Einbettung in Unterseite
                        </h3>
                        <p className="text-[11px] text-stone-500">
                          Bettet den kompletten Bestellablauf direkt auf z. B. <code className="bg-stone-100 px-1 py-0.5 rounded">mein-restaurant.de/speisekarte</code> ein.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <pre className="bg-stone-900 text-stone-200 text-[11px] font-mono p-3.5 rounded-xl overflow-x-auto">
{`<iframe
  src="${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/r/${currentRestaurant.slug}"
  width="100%"
  height="900"
  style="border:none;border-radius:16px;max-width:100%;"
  allow="payment"
  loading="lazy">
</iframe>`}
                    </pre>
                    <button
                      onClick={() => {
                        const origin = window.location.origin;
                        const code = `<iframe src="${origin}/r/${currentRestaurant.slug}" width="100%" height="900" style="border:none;border-radius:16px;max-width:100%;" allow="payment" loading="lazy"></iframe>`;
                        navigator.clipboard.writeText(code);
                        setCopiedSnippet("iframe");
                        setTimeout(() => setCopiedSnippet(null), 2500);
                      }}
                      className="absolute top-2.5 right-2.5 bg-stone-800 hover:bg-stone-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg border border-stone-700 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copiedSnippet === "iframe" ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Kopiert!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Code kopieren</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-stone-400">
                    Wichtig: Der Parameter <code className="text-stone-300">allow="payment"</code> ist enthalten, damit Apple Pay und Online-Zahlungen im iframe zuverlässig funktionieren.
                  </p>
                </div>

                {/* OPTION 3: Eigene Subdomain (CNAME) */}
                <div className="p-5 rounded-2xl border border-stone-200 hover:border-orange-300 transition space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                      3
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-stone-900">
                        Eigene Subdomain (z. B. bestellen.mein-restaurant.de)
                      </h3>
                      <p className="text-[11px] text-stone-500">
                        Perfekt für Gastronomen mit eigener Domain. Maximale Professionalität und Markenbindung.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-2">
                    <div className="font-semibold text-stone-800">
                      So richtest du deine Subdomain ein:
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-stone-600 text-[11px]">
                      <li>Öffne die DNS-Verwaltung deines Domain-Anbieters (Strato, Ionos, GoDaddy, Hetzner etc.).</li>
                      <li>Erstelle einen neuen <strong>CNAME-Eintrag</strong>:</li>
                      <li className="font-mono bg-white p-2 rounded border border-stone-200 text-stone-800">
                        Hostname: <span className="font-bold">bestellen</span> &nbsp;|&nbsp; Ziel: <span className="font-bold">cname.deine-plattform.de</span>
                      </li>
                      <li>Sobald der Eintrag aktiv ist, antwortet das Bestellsystem unter deiner Restaurant-Domain.</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: TEAM & LOGINS (MANDANTEN-BENUTZERVERWALTUNG) */}
        {/* ========================================================= */}
        {activeTab === "users" && (
          <div className="space-y-6">
            {/* Header & Mandantenschutz Info */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-black text-stone-900">
                    Mitarbeiter- & Betreiber-Zugänge
                  </h2>
                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mandanten-Isolation aktiv</span>
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  Verwalte hier alle Logins für <strong className="text-stone-800">{currentRestaurant.name}</strong>. 
                  Alle Zugänge sind technisch strikt isoliert und haben 0% Zugriff auf andere Restaurants.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-stone-500 bg-stone-100 px-3 py-1.5 rounded-xl font-mono">
                  Tenant-ID: {currentRestaurant.id}
                </span>
              </div>
            </div>

            {/* Formular: Neuen Zugang anlegen */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-orange-600" />
                <span>Neuen Mitarbeiter-Zugang anlegen</span>
              </h3>

              {userSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{userSuccessMessage}</span>
                </div>
              )}

              {userErrorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <span className="font-bold">Fehler:</span>
                  <span>{userErrorMessage}</span>
                </div>
              )}

              <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                    Name / Funktion
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="z. B. Ali (Schichtleiter)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                    E-Mail Adresse
                  </label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="mitarbeiter@restaurant.de"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                    Passwort (Initial)
                  </label>
                  <input
                    type="text"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="z. B. secret2026"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                    Rolle & Berechtigung
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e: any) => setNewUserRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white"
                  >
                    <option value="restaurant_staff">Küchen-Personal (Bestellungen & Bon)</option>
                    <option value="restaurant_owner">Inhaber (Vollzugriff & Finanzen)</option>
                  </select>
                </div>

                <div className="md:col-span-4 flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isCreatingUser}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isCreatingUser ? "Wird angelegt..." : "Zugang jetzt erstellen"}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Liste aktiver Benutzer */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-stone-600" />
                  <span>Aktive Zugänge für {currentRestaurant.name}</span>
                </h3>
                <button
                  onClick={fetchUsers}
                  className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? "animate-spin" : ""}`} />
                  <span>Neu laden</span>
                </button>
              </div>

              {isLoadingUsers ? (
                <div className="py-8 text-center text-xs text-stone-400">
                  Lade Benutzerdaten...
                </div>
              ) : teamUsers.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400">
                  Keine Mitarbeiter-Zugänge für dieses Restaurant angelegt.
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {teamUsers.map((user) => (
                    <div
                      key={user.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/50 px-2 rounded-xl transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center font-bold text-xs text-stone-700 uppercase">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-stone-900">
                              {user.name}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                user.role === "restaurant_owner"
                                  ? "bg-purple-100 text-purple-700 border border-purple-200"
                                  : "bg-blue-100 text-blue-700 border border-blue-200"
                              }`}
                            >
                              {user.role === "restaurant_owner" ? "Inhaber" : "Küchenpersonal"}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500 font-mono">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-stone-400">
                          Erstellt: {new Date(user.createdAt).toLocaleDateString("de-DE")}
                        </span>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                          title="Zugang löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sicherheits-Architektur Erklärungskarte */}
            <div className="bg-stone-900 text-stone-100 p-6 rounded-3xl border border-stone-800 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Wie ist die Sicherheit garantiert?</span>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                Jeder Benutzer wird fest mit der <code>restaurant_id</code> verknüpft. Sobald er sich im Admin-Portal anmeldet, 
                erlaubt der Server und die PostgreSQL-Datenbank (Row Level Security) ausschließlich Lese- und Schreibzugriff 
                auf Datensätze dieses einen Restaurants. Ein versehentlicher Zugriff auf andere Betriebe ist architektonisch 
                zu 100% ausgeschlossen.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* 80mm / 58mm BON-DRUCK MODAL VORSCHAU */}
      {/* ========================================================= */}
      {printOrder && (
        <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-orange-600" />
                <span>Küchenbon Druckansicht (80mm)</span>
              </h3>
              <button
                onClick={() => setPrintOrder(null)}
                className="text-stone-400 hover:text-stone-700 text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Bon Inhalt */}
            <div className="my-4 p-4 bg-stone-50 rounded-xl border border-stone-300 font-mono text-xs leading-tight text-stone-900">
              <div className="text-center pb-2 border-b border-dashed border-stone-400">
                <p className="font-bold uppercase">{currentRestaurant.name}</p>
                <p>BON #{printOrder.orderNumber}</p>
                <p>{new Date(printOrder.createdAt).toLocaleString("de-DE")}</p>
              </div>

              <div className="py-2 border-b border-dashed border-stone-400">
                <p className="font-bold uppercase">
                  {printOrder.orderType === "delivery"
                    ? ">>> LIEFERUNG <<<"
                    : ">>> ABHOLUNG <<<"}
                </p>
                <p>Kunde: {printOrder.customer.name}</p>
                <p>Tel: {printOrder.customer.phone}</p>
                {printOrder.orderType === "delivery" && (
                  <p>
                    Adresse: {printOrder.customer.street}{" "}
                    {printOrder.customer.houseNumber}, {printOrder.customer.plz}{" "}
                    {printOrder.customer.city}
                  </p>
                )}
                {printOrder.customer.comment && (
                  <p className="font-bold">Hinweis: {printOrder.customer.comment}</p>
                )}
              </div>

              <div className="py-2 border-b border-dashed border-stone-400 space-y-1">
                {printOrder.items.map((it, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between font-bold">
                      <span>
                        {it.quantity}x #{it.number} {it.name}
                      </span>
                      <span>{formatEuro(it.totalPrice)}</span>
                    </div>
                    {it.selectedSize && (
                      <div className="text-[10px] pl-2">{it.selectedSize.name}</div>
                    )}
                    {it.selectedExtras.map((e, ei) => (
                      <div key={ei} className="text-[10px] pl-2">
                        + {e.name}
                      </div>
                    ))}
                    {it.comment && (
                      <div className="text-[10px] pl-2 italic">** {it.comment} **</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="py-2 space-y-0.5">
                <div className="flex justify-between font-bold text-sm">
                  <span>GESAMTSUMME:</span>
                  <span>{formatEuro(printOrder.calculation.total)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>enthaltene 7% MwSt.:</span>
                  <span>{formatEuro(printOrder.calculation.vat7)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>enthaltene 19% MwSt.:</span>
                  <span>{formatEuro(printOrder.calculation.vat19)}</span>
                </div>
                <div className="pt-1 font-bold">
                  <span>
                    Zahlart:{" "}
                    {printOrder.paymentMethod === "cash"
                      ? "BARZAHLUNG"
                      : "ONLINE BEZAHLT"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-stone-900 hover:bg-black text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Bon Drucken</span>
              </button>
              <button
                onClick={() => setPrintOrder(null)}
                className="px-4 py-2.5 border border-stone-200 text-stone-600 rounded-xl text-xs font-semibold hover:bg-stone-50 cursor-pointer"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
