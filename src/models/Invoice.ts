import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInvoiceItem {
  itemId: string;
  itemName: string;
  quantity: number;
}

export interface IInvoice extends Document {
  date: Date;
  receivedFrom: string;
  receivedFromAddress?: string;
  receivedFromId?: string;
  items: IInvoiceItem[];
  pdfReference?: string; // Base64 PDF data string
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>({
  itemId: { type: String, required: true },
  itemName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
});

const InvoiceSchema: Schema<IInvoice> = new Schema(
  {
    date: { type: Date, required: true, default: Date.now },
    receivedFrom: { type: String, required: true, trim: true },
    receivedFromAddress: { type: String, default: "" },
    receivedFromId: { type: String },
    items: { type: [InvoiceItemSchema], required: true },
    pdfReference: { type: String },
  },
  { timestamps: true }
);

const Invoice: Model<IInvoice> =
  mongoose.models.Invoice || mongoose.model<IInvoice>("Invoice", InvoiceSchema);

export default Invoice;
