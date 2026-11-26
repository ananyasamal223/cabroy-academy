import mongoose from "mongoose";

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  courses: [{ type: String, trim: true, maxlength: 160 }],
  active: { type: Boolean, default: true },
  deletedAt: { type: Date, default: null },
  routingWeight: { type: Number, default: 1, min: 1, max: 100, validate: Number.isInteger },
  lastRoutedAt: { type: Date, default: null },
});

export default mongoose.model("CrmTeam", schema);
