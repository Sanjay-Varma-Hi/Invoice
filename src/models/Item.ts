import mongoose, { Schema, Document, Model } from "mongoose";

export interface IItem extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema: Schema<IItem> = new Schema(
  {
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const Item: Model<IItem> =
  mongoose.models.RestaurantItem || mongoose.model<IItem>("RestaurantItem", ItemSchema);

export default Item;
