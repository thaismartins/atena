import express from "express";
const router = express.Router();

import interactionHistoryController from "../controllers/interactionHistory";

router.get("/room", async (req, res) => {
  const messages = await interactionHistoryController.saveByRoomId(
    "Aa6fSXib23WpHjof7"
  );
  res.json(messages);
});

export default router;
