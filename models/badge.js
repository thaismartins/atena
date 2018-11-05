import mongoose from "mongoose";

const badgeSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  level: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  lastUpdate: {
    type: Date,
    required: true,
    default: Date.now
  }
});

export default mongoose.model("Badge", badgeSchema);
