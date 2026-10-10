export function formatCedula(value) {
  const d = String(value).replace(/\D/g, '').slice(0, 11);
  return d.length > 10 ? `${d.slice(0, 3)}-${d.slice(3, 10)}-${d.slice(10)}`
    : d.length > 3 ? `${d.slice(0, 3)}-${d.slice(3)}` : d;
}

// Hashcod Pro prices in USD. Yearly is twelve months with the 20% annual discount. The first payment to
// tokenize is a one-time charge on top of the subscription.
export const PLAN_PRICES = Object.freeze({ monthly: 20, yearly: 192 });
export const FIRST_TOKENIZATION_PAYMENT = 2000;
// Price of each PSOT certificate (proof of registration), in Dominican pesos. It is a separate charge and
// is never added to the USD total.
export const CERTIFICATE_PRICE_DOP = 500;

export function formatUsd(value, decimals = 0) {
  return 'US$' + Number(value).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function formatDop(value, decimals = 0) {
  return 'RD$' + Number(value).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function checkoutOrder({ yearly = false, rd = true, cedula = '', fiscal = false, reference = '' } = {}) {
  const identity = formatCedula(cedula);
  const plan = yearly ? PLAN_PRICES.yearly : PLAN_PRICES.monthly;
  const total = plan + FIRST_TOKENIZATION_PAYMENT;
  const planAmount = formatUsd(plan, 2), firstAmount = formatUsd(FIRST_TOKENIZATION_PAYMENT, 2), amount = formatUsd(total, 2);
  const valid = !rd || identity.replace(/\D/g, '').length === 11;
  const message = [
    'Hola, quiero suscribirme a Hashcod Pro.',
    `Plan: ${yearly ? 'Anual' : 'Mensual'}`,
    `Período: ${yearly ? '1 año' : '1 mes'}`,
    ...(yearly ? ['Descuento anual: 20%'] : []),
    `Suscripción: ${planAmount}`,
    `Primer pago para tokenizar: ${firstAmount}`,
    `Total: ${amount}`,
    `Certificado PSOT (precio por certificado, aparte): ${formatDop(CERTIFICATE_PRICE_DOP, 2)}`,
    `País de facturación: ${rd ? 'República Dominicana' : 'Otro país'}`,
    ...(rd && identity ? [`Cédula: ${identity}`] : []),
    `Comprobante fiscal: ${fiscal ? 'Sí' : 'No'}`,
    ...(reference ? [`Referencia de activación: ${reference}`] : []),
  ].join('\n');
  return { amount, planAmount, firstAmount, certificateAmount: formatDop(CERTIFICATE_PRICE_DOP, 2), total, valid, href: valid ? `https://wa.me/18294721257?text=${encodeURIComponent(message)}` : undefined };
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
