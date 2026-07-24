import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Place from "@/models/Place";
import { PlaceValidationSchema } from "@/lib/validation";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const validation = PlaceValidationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    const updatedPlace = await Place.findByIdAndUpdate(
      id,
      { 
        name: validation.data.name,
        address: validation.data.address || "",
      },
      { new: true }
    );

    if (!updatedPlace) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 });
    }

    return NextResponse.json(updatedPlace);
  } catch (error: any) {
    console.error("PUT Place Error:", error);
    return NextResponse.json({ error: "Failed to update place" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const deletedPlace = await Place.findByIdAndDelete(id);

    if (!deletedPlace) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Place deleted successfully" });
  } catch (error: any) {
    console.error("DELETE Place Error:", error);
    return NextResponse.json({ error: "Failed to delete place" }, { status: 500 });
  }
}
