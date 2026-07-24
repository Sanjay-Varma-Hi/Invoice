import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Invoice from "@/models/Invoice";
import { InvoiceValidationSchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const searchReceivedFrom = searchParams.get("searchReceivedFrom");
    const searchItemName = searchParams.get("searchItemName");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    let filter: any = {};

    if (searchReceivedFrom) {
      filter.receivedFrom = { $regex: searchReceivedFrom, $options: "i" };
    }

    if (searchItemName) {
      filter["items.itemName"] = { $regex: searchItemName, $options: "i" };
    }

    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) {
        filter.date.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        filter.date.$lte = endOfDay;
      }
    }

    const invoices = await Invoice.find(filter).sort({ date: -1, createdAt: -1 });
    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error("GET Invoices Error:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const validation = InvoiceValidationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    const newInvoice = new Invoice({
      date: validation.data.date,
      receivedFrom: validation.data.receivedFrom,
      receivedFromAddress: validation.data.receivedFromAddress || "",
      receivedFromId: validation.data.receivedFromId || "",
      items: validation.data.items,
    });

    await newInvoice.save();
    return NextResponse.json(newInvoice, { status: 201 });
  } catch (error: any) {
    console.error("POST Invoice Error:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
