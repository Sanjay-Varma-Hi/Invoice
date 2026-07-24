import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPlace extends Document {
  name: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PlaceSchema: Schema<IPlace> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, default: "" },
  },
  { timestamps: true }
);

const Place: Model<IPlace> =
  mongoose.models.RestaurantPlace || mongoose.model<IPlace>("RestaurantPlace", PlaceSchema);

export default Place;
