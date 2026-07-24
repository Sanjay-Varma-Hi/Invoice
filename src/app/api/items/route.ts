import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Item from "@/models/Item";
import { ItemValidationSchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("search");

    let filter = {};
    if (query) {
      filter = { name: { $regex: query, $options: "i" } };
    }

    const items = await Item.find(filter).sort({ name: 1 });
    return NextResponse.json(items);
  } catch (error: any) {
    console.error("GET Items Error:", error);
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const validation = ItemValidationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    const newItem = new Item({
      name: validation.data.name,
    });

    await newItem.save();
    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    console.error("POST Item Error:", error);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}
