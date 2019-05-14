import mongoose from "mongoose";

const valueSchema = {
  type: String,
  required: true
};

const configSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  values: {
    type: [valueSchema],
    required: true
  }
});

export default mongoose.model("Config", configSchema);
