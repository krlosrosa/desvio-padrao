/** Limite de caracteres de uma mensagem no Telegram. */
const TELEGRAM_MAX_MESSAGE_LENGTH = 4096;

export type PayloadToTextResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

const truncateForTelegram = (text: string): string => {
  if (text.length <= TELEGRAM_MAX_MESSAGE_LENGTH) {
    return text;
  }

  const suffix = "\n…[truncado]";
  return (
    text.slice(0, TELEGRAM_MAX_MESSAGE_LENGTH - suffix.length) + suffix
  );
};

/**
 * Converte o corpo da requisição (qualquer JSON, texto ou objeto de form) em string para o Telegram.
 */
export const payloadToText = (body: unknown): PayloadToTextResult => {
  if (body === undefined) {
    return { ok: false, error: "Corpo da requisição ausente" };
  }

  if (body === null) {
    return { ok: false, error: "Payload não pode ser nulo" };
  }

  if (Buffer.isBuffer(body)) {
    const decoded = body.toString("utf8").trim();
    if (decoded.length === 0) {
      return { ok: false, error: "Corpo binário vazio" };
    }
    return { ok: true, text: truncateForTelegram(decoded) };
  }

  if (typeof body === "string") {
    const trimmed = body.trim();
    if (trimmed.length === 0) {
      return { ok: false, error: "Texto vazio" };
    }
    return { ok: true, text: truncateForTelegram(trimmed) };
  }

  if (typeof body === "number" || typeof body === "boolean") {
    return { ok: true, text: truncateForTelegram(String(body)) };
  }

  if (typeof body === "bigint") {
    return { ok: true, text: truncateForTelegram(body.toString()) };
  }

  if (typeof body === "object") {
    try {
      const serialized = JSON.stringify(body, null, 2);
      if (serialized === undefined) {
        return { ok: false, error: "Não foi possível serializar o payload" };
      }
      return { ok: true, text: truncateForTelegram(serialized) };
    } catch {
      return { ok: false, error: "Payload não serializável" };
    }
  }

  return { ok: true, text: truncateForTelegram(String(body)) };
};
