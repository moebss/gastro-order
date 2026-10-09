import { NextRequest, NextResponse } from "next/server";
import { authenticateAdminUser } from "@/lib/server/users-store";
import { createSessionToken } from "@/lib/server/auth-session";
import { ALL_RESTAURANTS } from "@/data/restaurants";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, error: "Bitte gib eine E-Mail-Adresse ein." },
        { status: 400 }
      );
    }

    const user = await authenticateAdminUser(email, password);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Ungültige E-Mail-Adresse oder falsches Passwort." },
        { status: 401 }
      );
    }

    const token = createSessionToken({
      userId: user.id,
      email: user.email,
      restaurantId: user.restaurantId,
      role: user.role,
    });

    const restaurant = ALL_RESTAURANTS.find((r) => r.id === user.restaurantId);

    const response = NextResponse.json({
      success: true,
      user,
      token,
      restaurant: restaurant || null,
    });

    // HTTP-only Cookie für browserbasierte Admin-Requests
    response.cookies.set("gastro_admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 Tage
      path: "/",
    });

    return response;
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
