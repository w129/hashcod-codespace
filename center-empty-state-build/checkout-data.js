export function formatCedula(value) {
  const d = String(value).replace(/\D/g, '').slice(0, 11);
  return d.length > 10 ? `${d.slice(0, 3)}-${d.slice(3, 10)}-${d.slice(10)}`
    : d.length > 3 ? `${d.slice(0, 3)}-${d.slice(3)}` : d;
}

export function checkoutOrder({ yearly = false, rd = true, cedula = '', fiscal = false } = {}) {
  const identity = formatCedula(cedula);
  const total = yearly ? 192 : 20;
  const amount = `US$${total.toFixed(2)}`;
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
  ].join('\n');
  return { amount, total, valid, href: valid ? `https://wa.me/18294721257?text=${encodeURIComponent(message)}` : undefined };
}
