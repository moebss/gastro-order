import { NextResponse } from "next/server";
import { ALL_RESTAURANTS } from "@/data/restaurants";

export async function GET() {
  return NextResponse.json({
    success: true,
    restaurants: ALL_RESTAURANTS,
  });
}
