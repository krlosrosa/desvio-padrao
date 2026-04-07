import { Router } from "express";
import { env } from "../config/env.js";
import { sendMessage } from "../services/telegram.service.js";
import { payloadToText } from "../utils/payload-to-text.js";

export const notifyRouter = Router();

notifyRouter.post("/notify", async (req, res, next) => {
  try {
    const parsed = payloadToText(req.body);

    if (!parsed.ok) {
      res.status(400).json({ ok: false, error: parsed.error });
      return;
    }

    await sendMessage({
      chatId: env.TELEGRAM_CHAT_ID,
      text: parsed.text,
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
});
