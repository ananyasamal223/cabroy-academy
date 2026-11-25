import mongoose from "mongoose";

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  courses: [{ type: String, trim: true, maxlength: 160 }],
  active: { type: Boolean, default: true },
  lastRoutedAt: { type: Date, default: null },
});

export default mongoose.model("CrmTeam", schema);
