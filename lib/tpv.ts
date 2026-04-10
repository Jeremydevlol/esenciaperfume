import crypto from "crypto";

/**
 * Calcula la firma SHA-256 para el TPV Virtual de Cecabank.
 * Cadena a firmar:
 *   Clave + MerchantID + AcquirerBIN + TerminalID +
 *   Num_operacion + Importe + TipoMoneda + Exponente + "SHA2" + URL_OK + URL_NOK
 */
export function calcularFirmaCECA(params: {
  Num_operacion: string;
  Importe: string;     // céntimos, sin decimales, ej: "4999" = 49,99 €
  URL_OK: string;
  URL_NOK: string;
}): string {
  const clave        = process.env.CECA_ENCRYPTION_KEY!;
  const merchantID   = process.env.CECA_MERCHANT_ID!;
  const acquirerBIN  = process.env.CECA_ACQUIRER_BIN!;
  const terminalID   = process.env.CECA_TERMINAL_ID!;

  const cadena =
    clave +
    merchantID +
    acquirerBIN +
    terminalID +
    params.Num_operacion +
    params.Importe +
    "978" +   // TipoMoneda — EUR
    "2" +     // Exponente
    "SHA2" +  // Cifrado
    params.URL_OK +
    params.URL_NOK;

  return crypto.createHash("sha256").update(cadena).digest("hex");
}

/** Convierte importe en euros (número) a céntimos string sin decimales */
export function eurosToCentimos(euros: number): string {
  return Math.round(euros * 100).toString();
}

/** Genera un Num_operacion único (máx 50 chars, alfanumérico) */
export function generarNumOperacion(): string {
  const ts    = Date.now().toString(36).toUpperCase();          // timestamp base-36
  const rand  = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `EP${ts}${rand}`.slice(0, 50);
}
