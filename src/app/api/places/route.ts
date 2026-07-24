import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Place from "@/models/Place";
import { PlaceValidationSchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("search");

    let filter = {};
    if (query) {
      filter = { name: { $regex: query, $options: "i" } };
    }

    const places = await Place.find(filter).sort({ name: 1 });
    return NextResponse.json(places);
  } catch (error: any) {
    console.error("GET Places Error:", error);
    return NextResponse.json({ error: "Failed to fetch places" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const validation = PlaceValidationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    const newPlace = new Place({
      name: validation.data.name,
      address: validation.data.address || "",
    });

    await newPlace.save();
    return NextResponse.json(newPlace, { status: 201 });
  } catch (error: any) {
    console.error("POST Place Error:", error);
    return NextResponse.json({ error: "Failed to create place" }, { status: 500 });
  }
}
