import { z } from "zod";

export const ItemValidationSchema = z.object({
  name: z.string().min(1, "Item Name is required").trim(),
});

export const PlaceValidationSchema = z.object({
  name: z.string().min(1, "Place Name is required").trim(),
  address: z.string().optional().default(""),
});

export const SettingsValidationSchema = z.object({
  restaurantName: z.string().min(1, "Restaurant Name is required").trim(),
  logo: z.string().optional(), // Base64 data string
  address: z.string().min(1, "Address is required").trim(),
  phone: z.string().min(1, "Phone number is required").trim(),
  footerMessage: z.string().min(1, "Footer message is required").trim(),
});

export const InvoiceItemValidationSchema = z.object({
  itemId: z.string().min(1, "Item selection is required"),
  itemName: z.string().min(1, "Item Name is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export const InvoiceValidationSchema = z.object({
  date: z.preprocess((arg) => {
    if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
    return arg;
  }, z.date({ message: "Invalid Date" })),
  receivedFrom: z.string().min(1, "Received From is required").trim(),
  receivedFromAddress: z.string().optional().default(""),
  receivedFromId: z.string().optional(),
  receivedBy: z.string().optional().default(""),
  items: z.array(InvoiceItemValidationSchema).min(1, "At least one item is required"),
});
