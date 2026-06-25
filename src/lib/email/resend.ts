import { Resend } from "resend";

// Lazy init — evita crash en build cuando RESEND_API_KEY no está disponible
let _resend: Resend | null = null;
export function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY ?? "placeholder");
  return _resend;
}

export const FROM = process.env.EMAIL_FROM ?? "Mar Boutique <hola@mar-boutique.com>";
export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").filter(Boolean);
