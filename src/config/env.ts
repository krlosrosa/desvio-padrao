import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1, "TELEGRAM_BOT_TOKEN é obrigatório"),
  TELEGRAM_CHAT_ID: z.string().min(1, "TELEGRAM_CHAT_ID é obrigatório"),
  /** Valor em R$ que você aceita perder se o stop for atingido (base do cálculo da quantidade). */
  RISCO_FINANCEIRO: z.coerce.number().positive("RISCO_FINANCEIRO deve ser um número positivo"),
  PORT: z.coerce.number().int().positive().default(3000),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);
