import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Invoice from "@/models/Invoice";
import { InvoiceValidationSchema } from "@/lib/validation";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const invoice = await Invoice.findById(id);

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error("GET Invoice ID Error:", error);
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const validation = InvoiceValidationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      id,
      {
        date: validation.data.date,
        receivedFrom: validation.data.receivedFrom,
        receivedFromAddress: validation.data.receivedFromAddress || "",
        receivedFromId: validation.data.receivedFromId || "",
        items: validation.data.items,
      },
      { new: true }
    );

    if (!updatedInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(updatedInvoice);
  } catch (error: any) {
    console.error("PUT Invoice Error:", error);
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}

// PATCH allows updating specific fields like pdfReference
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    if (body.pdfReference === undefined) {
      return NextResponse.json({ error: "pdfReference is required" }, { status: 400 });
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      id,
      { pdfReference: body.pdfReference },
      { new: true }
    );

    if (!updatedInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(updatedInvoice);
  } catch (error: any) {
    console.error("PATCH Invoice Error:", error);
    return NextResponse.json({ error: "Failed to patch invoice" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const deletedInvoice = await Invoice.findByIdAndDelete(id);

    if (!deletedInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Invoice deleted successfully" });
  } catch (error: any) {
    console.error("DELETE Invoice Error:", error);
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}
