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
  kindId: {
    type: Number
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
  startDate: {
    type: Date,
    default: Date.now
  },
  limitDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  acceptedDate: {
    type: Date
  },
  refusedDate: {
    type: Date
  }
});

export default mongoose.model("Misson", missonSchema);
