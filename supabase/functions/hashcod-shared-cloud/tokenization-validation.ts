export function contact(body: any) {
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  if (email.length > 254 || !/^[^\s@\x00-\x1f\x7f]+@[^\s@\x00-\x1f\x7f]+\.[^\s@\x00-\x1f\x7f]+$/.test(email)) throw Object.assign(new Error('Introduce un correo válido.'), { status: 400 });
  const digits = phone.replace(/\D/g, '');
  if (phone.length > 32 || !/^\+?[\d ()-]+$/.test(phone) || digits.length < 7 || digits.length > 15) throw Object.assign(new Error('Introduce un teléfono válido con código de país.'), { status: 400 });
  return { email, phone };
}
export function adminKey(value: unknown) {
  if (typeof value !== 'string' || !value.trim() || value.length > 8192 || value.includes('\0')) throw Object.assign(new Error('Clave incorrecta.'), { status: 403 });
  return value.trim();
}
