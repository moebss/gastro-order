import { NextRequest, NextResponse } from "next/server";
import {
  getUsersForRestaurant,
  createAdminUser,
  deleteAdminUser,
  UserRole,
} from "../../../../lib/server/users-store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get("restaurantId");
    const isPlatformAdmin = searchParams.get("isPlatformAdmin") === "true";

    if (!restaurantId && !isPlatformAdmin) {
      return NextResponse.json(
        { success: false, error: "restaurantId erforderlich" },
        { status: 400 }
      );
    }

    const users = await getUsersForRestaurant(restaurantId || "", isPlatformAdmin);
    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Fehler beim Laden der Benutzer" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, restaurantId, role } = body;

    if (!email || !name || !restaurantId) {
      return NextResponse.json(
        { success: false, error: "E-Mail, Name und restaurantId sind Pflichtfelder" },
        { status: 400 }
      );
    }

    const newUser = await createAdminUser({
      email,
      password: password || "start123",
      name,
      restaurantId,
      role: (role as UserRole) || "restaurant_staff",
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Fehler beim Erstellen des Benutzers" },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const requesterRestaurantId = searchParams.get("restaurantId") || "";
    const isPlatformAdmin = searchParams.get("isPlatformAdmin") === "true";

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId erforderlich" },
        { status: 400 }
      );
    }

    await deleteAdminUser(userId, requesterRestaurantId, isPlatformAdmin);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Fehler beim Löschen des Benutzers" },
      { status: 403 }
    );
  }
}
