import { parseFlexibleNumber } from "./parse-number.js";

export type SignalTipo = "COMPRA" | "VENDA";

export type ParsedSignal = {
  tipo: SignalTipo;
  ativo: string;
  entrada: number;
  alvo: number;
  stop: number;
};

export type ParseSignalResult =
  | { ok: true; signal: ParsedSignal }
  | { ok: false; error: string };

const LINE_ATIVO = /^Ativo:\s*(.+)$/i;
const LINE_ENTRADA = /^Entrada:\s*(.+)$/i;
const LINE_ALVO = /^Alvo:\s*(.+)$/i;
const LINE_STOP = /^Stop:\s*(.+)$/i;

const detectTipo = (firstLine: string): SignalTipo => {
  const u = firstLine.trim().toUpperCase();
  if (u.includes("VENDA")) {
    return "VENDA";
  }
  return "COMPRA";
};

export const parseSignalText = (raw: string): ParseSignalResult => {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { ok: false, error: "Texto do sinal vazio" };
  }

  const tipo = detectTipo(lines[0]);

  let ativo: string | undefined;
  let entradaRaw: string | undefined;
  let alvoRaw: string | undefined;
  let stopRaw: string | undefined;

  for (const line of lines) {
    let m = line.match(LINE_ATIVO);
    if (m) {
      ativo = m[1].trim();
      continue;
    }
    m = line.match(LINE_ENTRADA);
    if (m) {
      entradaRaw = m[1].trim();
      continue;
    }
    m = line.match(LINE_ALVO);
    if (m) {
      alvoRaw = m[1].trim();
      continue;
    }
    m = line.match(LINE_STOP);
    if (m) {
      stopRaw = m[1].trim();
    }
  }

  if (!ativo) {
    return { ok: false, error: "Campo 'Ativo' não encontrado" };
  }
  if (!entradaRaw || !alvoRaw || !stopRaw) {
    return {
      ok: false,
      error: "Campos Entrada, Alvo e Stop são obrigatórios",
    };
  }

  const entrada = parseFlexibleNumber(entradaRaw);
  const alvo = parseFlexibleNumber(alvoRaw);
  const stop = parseFlexibleNumber(stopRaw);

  if (entrada === null || alvo === null || stop === null) {
    return { ok: false, error: "Valores numéricos inválidos em Entrada, Alvo ou Stop" };
  }

  return {
    ok: true,
    signal: { tipo, ativo, entrada, alvo, stop },
  };
};

/** Risco por unidade (preço): |entrada - stop| na direção do trade. */
export const riscoPorUnidade = (signal: ParsedSignal): number | null => {
  if (signal.tipo === "COMPRA") {
    const d = signal.entrada - signal.stop;
    return d > 0 ? d : null;
  }

  const d = signal.stop - signal.entrada;
  return d > 0 ? d : null;
};

export type QuantityResult =
  | {
      ok: true;
      quantidade: number;
      riscoPorUnidade: number;
      quantidadeBruta: number;
      /** quantidade × |entrada − stop| em R$ (risco efetivo com o lote arredondado). */
      riscoReal: number;
    }
  | { ok: false; error: string };

/**
 * quantidade = RISCO_FINANCEIRO / risco_por_unidade, arredondada para múltiplos de 100 (por baixo).
 */
export const calcularQuantidade = (
  signal: ParsedSignal,
  riscoFinanceiro: number,
): QuantityResult => {
  if (!Number.isFinite(riscoFinanceiro) || riscoFinanceiro <= 0) {
    return { ok: false, error: "RISCO_FINANCEIRO inválido ou não configurado" };
  }

  const risco = riscoPorUnidade(signal);
  if (risco === null) {
    return {
      ok: false,
      error:
        signal.tipo === "COMPRA"
          ? "Para compra, Entrada deve ser maior que Stop"
          : "Para venda, Stop deve ser maior que Entrada",
    };
  }

  const quantidadeBruta = riscoFinanceiro / risco;
  const quantidade = Math.floor(quantidadeBruta / 100) * 100;

  if (quantidade <= 0) {
    return {
      ok: false,
      error:
        "Quantidade calculada inferior a 100 unidades; aumente RISCO_FINANCEIRO ou revise o sinal",
    };
  }

  const riscoReal = quantidade * risco;

  return {
    ok: true,
    quantidade,
    riscoPorUnidade: risco,
    quantidadeBruta,
    riscoReal,
  };
};

const fmtMoney = (n: number) =>
  n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtInt = (n: number) =>
  n.toLocaleString("pt-BR", { maximumFractionDigits: 0 });

export const formatarMensagemTelegram = (
  signal: ParsedSignal,
  q: QuantityResult & { ok: true },
  riscoFinanceiro: number,
): string => {
  const isCompra = signal.tipo === "COMPRA";
  const tipoEmoji = isCompra ? "🟢" : "🔴";
  const tipoLabel = isCompra ? "COMPRA" : "VENDA";
  const acaoEmoji = isCompra ? "📈" : "📉";

  const linhas = [
    `${acaoEmoji} <b>${tipoLabel}</b>`,
    `${tipoEmoji} <b>Ativo: ${signal.ativo}</b>`,
    "━━━━━━━━━━━━━━━",
    "",
    "📋 <b>Parâmetros da operação:</b>",
    `   💼 Qtd:    ${fmtInt(q.quantidade)}`,
    `   🔵 Entrada:  R$ ${fmtMoney(signal.entrada)}`,
    `   🛑 Stop:     R$ ${fmtMoney(signal.stop)}`,
    `   ✅ Alvo:     R$ ${fmtMoney(signal.alvo)}`,
    "",
    "━━━━━━━━━━━━━━━",
    "📊 <b>Gestão de risco:</b>",
    `   💼 Qtd. operação:    ${fmtInt(q.quantidade)} unidades`,
    `   💰 Risco financeiro: R$ ${fmtMoney(riscoFinanceiro)}`,
    `   📏 Risco/unidade:    R$ ${fmtMoney(q.riscoPorUnidade)}`,
    `   ⚠️  Risco real:       R$ ${fmtMoney(q.riscoReal)}`,
    `   🔢 Qtd. bruta:       ${fmtInt(Math.round(q.quantidadeBruta))} unidades`,
  ];

  return linhas.join("\n");
};
