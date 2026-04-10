import { NextRequest, NextResponse } from "next/server";
import {
  calcularFirmaCECA,
  eurosToCentimos,
  generarNumOperacion,
} from "@/lib/tpv";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { totalEuros } = body as { totalEuros: number };

    if (!totalEuros || totalEuros <= 0) {
      return NextResponse.json({ error: "Importe inválido" }, { status: 400 });
    }

    const baseUrl      = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const Num_operacion = generarNumOperacion();
    const Importe       = eurosToCentimos(totalEuros);
    const URL_OK        = `${baseUrl}/checkout/ok`;
    const URL_NOK       = `${baseUrl}/checkout/nok`;

    const Firma = calcularFirmaCECA({ Num_operacion, Importe, URL_OK, URL_NOK });

    return NextResponse.json({
      endpoint:      process.env.CECA_ENDPOINT,
      MerchantID:    process.env.CECA_MERCHANT_ID,
      AcquirerBIN:   process.env.CECA_ACQUIRER_BIN,
      TerminalID:    process.env.CECA_TERMINAL_ID,
      Num_operacion,
      Importe,
      TipoMoneda:    "978",
      Exponente:     "2",
      Cifrado:       "SHA2",
      Pago_soportado:"SSL",
      Idioma:        "1",
      URL_OK,
      URL_NOK,
      Firma,
    });
  } catch (err) {
    console.error("[TPV crear-pago]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
