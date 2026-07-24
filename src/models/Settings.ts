import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISettings extends Document {
  restaurantName: string;
  logo?: string; // Base64 data URI
  address: string;
  phone: string;
  footerMessage: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema: Schema<ISettings> = new Schema(
  {
    restaurantName: { type: String, required: true, default: "My Restaurant" },
    logo: { type: String }, // Base64 image
    address: { type: String, required: true, default: "123 Main Street" },
    phone: { type: String, required: true, default: "555-0199" },
    footerMessage: { type: String, required: true, default: "Thank You" },
  },
  { timestamps: true }
);

const Settings: Model<ISettings> =
  mongoose.models.RestaurantSettings || mongoose.model<ISettings>("RestaurantSettings", SettingsSchema);

export default Settings;
