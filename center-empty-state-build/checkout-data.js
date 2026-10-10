export function formatCedula(value) {
  const d = String(value).replace(/\D/g, '').slice(0, 11);
  return d.length > 10 ? `${d.slice(0, 3)}-${d.slice(3, 10)}-${d.slice(10)}`
    : d.length > 3 ? `${d.slice(0, 3)}-${d.slice(3)}` : d;
}

// Hashcod Pro list prices in USD. Yearly is twelve months with the 20% annual discount.
export const PLAN_PRICES = Object.freeze({ monthly: 2000, yearly: 19200 });

export function formatUsd(value, decimals = 0) {
  return 'US$' + Number(value).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function checkoutOrder({ yearly = false, rd = true, cedula = '', fiscal = false, reference = '' } = {}) {
  const identity = formatCedula(cedula);
  const total = yearly ? PLAN_PRICES.yearly : PLAN_PRICES.monthly;
  const amount = formatUsd(total, 2);
  const valid = !rd || identity.replace(/\D/g, '').length === 11;
  const message = [
    'Hola, quiero suscribirme a Hashcod Pro.',
    `Plan: ${yearly ? 'Anual' : 'Mensual'}`,
    `Período: ${yearly ? '1 año' : '1 mes'}`,
    ...(yearly ? ['Descuento anual: 20%'] : []),
    `Subtotal: ${amount}`,
    `Total: ${amount}`,
    `País de facturación: ${rd ? 'República Dominicana' : 'Otro país'}`,
    ...(rd && identity ? [`Cédula: ${identity}`] : []),
    `Comprobante fiscal: ${fiscal ? 'Sí' : 'No'}`,
    ...(reference ? [`Referencia de activación: ${reference}`] : []),
  ].join('\n');
  return { amount, total, valid, href: valid ? `https://wa.me/18294721257?text=${encodeURIComponent(message)}` : undefined };
}

const REFERENCE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

// Reads the client's pasted WhatsApp order and returns the activation reference and plan, if present.
export function parseOrderMessage(text) {
  const source = typeof text === 'string' ? text.slice(0, 4000) : '';
  const labeled = source.match(/Referencia de activaci[oó]n:\s*(\S+)/i);
  const found = (labeled && labeled[1].match(REFERENCE)) || source.match(REFERENCE);
  const plan = source.match(/Plan:\s*(Anual|Mensual)/i);
  return {
    reference: found ? found[0].toLowerCase() : '',
    plan: plan ? (plan[1].toLowerCase() === 'anual' ? 'yearly' : 'monthly') : '',
  };
}

export function activationMessage(code) {
  return `Hola, tu pago de Hashcod Pro fue confirmado. Tu código de activación es: ${code}\nIntrodúcelo en "Código de verificación del pago" para activar tu suscripción. Caduca en 15 minutos y solo funciona en la sesión donde hiciste el pedido.`;
}
