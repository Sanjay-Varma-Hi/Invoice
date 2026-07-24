import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { SettingsValidationSchema } from "@/lib/validation";

export async function GET() {
  try {
    await dbConnect();
    let settings = await Settings.findOne();

    if (!settings) {
      // Seed default settings on first access
      settings = new Settings({
        restaurantName: "My Restaurant",
        logo: "",
        address: "123 Main Street, Cityville",
        phone: "555-0199",
        footerMessage: "Thank You! Please visit again.",
      });
      await settings.save();
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("GET Settings Error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const validation = SettingsValidationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    const updatedSettings = await Settings.findOneAndUpdate(
      {},
      {
        restaurantName: validation.data.restaurantName,
        logo: validation.data.logo || "",
        address: validation.data.address,
        phone: validation.data.phone,
        footerMessage: validation.data.footerMessage,
      },
      { new: true, upsert: true }
    );

    return NextResponse.json(updatedSettings);
  } catch (error: any) {
    console.error("PUT Settings Error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
