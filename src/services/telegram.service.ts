import axios, { isAxiosError } from "axios";
import { env } from "../config/env.js";

export type SendMessageParams = {
  chatId: string;
  text: string;
};

type TelegramSendMessageResponse = {
  ok: boolean;
  description?: string;
};

export const sendMessage = async ({
  chatId,
  text,
}: SendMessageParams): Promise<void> => {
  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    const { data } = await axios.post<TelegramSendMessageResponse>(
      url,
      { chat_id: chatId, text },
      { timeout: 15_000 },
    );

    if (!data.ok) {
      throw new Error(data.description ?? "Falha ao enviar mensagem ao Telegram");
    }
  } catch (err) {
    if (isAxiosError(err)) {
      const telegramError =
        err.response?.data &&
        typeof err.response.data === "object" &&
        "description" in err.response.data
          ? String((err.response.data as { description?: string }).description)
          : undefined;
      throw new Error(telegramError ?? err.message);
    }
    throw err;
  }
};
