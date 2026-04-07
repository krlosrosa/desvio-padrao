import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { sendMessage } from "../services/telegram.service.js";

export const notifyBodySchema = z.object({
  message: z.string().min(1, "message não pode ser vazio").max(4096),
});

export type NotifyBody = z.infer<typeof notifyBodySchema>;

export const notifyRouter = Router();

notifyRouter.post(
  "/notify",
  validateBody(notifyBodySchema),
  async (req, res, next) => {
    try {
      const { message } = req.body as NotifyBody;

      await sendMessage({
        chatId: env.TELEGRAM_CHAT_ID,
        text: message,
      });

      res.status(200).json({ ok: true });
    } catch (err) {
      next(err);
    }
  },
);
