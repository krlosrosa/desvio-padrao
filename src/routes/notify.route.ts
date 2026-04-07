import { Router } from "express";
import { env } from "../config/env.js";
import { sendMessage } from "../services/telegram.service.js";
import {
  calcularQuantidade,
  formatarMensagemTelegram,
  parseSignalText,
} from "../utils/signal.js";
import { payloadToText } from "../utils/payload-to-text.js";

export const notifyRouter = Router();

notifyRouter.post("/notify", async (req, res, next) => {
  try {
    const parsed = payloadToText(req.body);

    if (!parsed.ok) {
      res.status(400).json({ ok: false, error: parsed.error });
      return;
    }

    const signalParsed = parseSignalText(parsed.text);

    if (!signalParsed.ok) {
      res.status(400).json({ ok: false, error: signalParsed.error });
      return;
    }

    const q = calcularQuantidade(signalParsed.signal, env.RISCO_FINANCEIRO);

    if (!q.ok) {
      res.status(400).json({ ok: false, error: q.error });
      return;
    }

    const texto = formatarMensagemTelegram(
      signalParsed.signal,
      q,
      env.RISCO_FINANCEIRO,
    );

    await sendMessage({
      chatId: env.TELEGRAM_CHAT_ID,
      text: texto,
    });

    res.status(200).json({
      ok: true,
      quantidade: q.quantidade,
      riscoPorUnidade: q.riscoPorUnidade,
      riscoReal: q.riscoReal,
    });
  } catch (err) {
    next(err);
  }
});
