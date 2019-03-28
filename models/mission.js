import mongoose from "mongoose";

const missonSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  kind: {
    type: String,
    required: true
  },
  // MINER ID
  kindId: {
    type: Number,
    required: true
  },
  accepted: {
    type: Boolean,
    default: false
  },
  completed: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  limitDate: {
    type: Date,
    required: true,
    default: Date.now
  }
});

export default mongoose.model("Misson", missonSchema);
