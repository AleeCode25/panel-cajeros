import mongoose from "mongoose";

const ConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Config || mongoose.model("Config", ConfigSchema);