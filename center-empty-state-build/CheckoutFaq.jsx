import React from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from './animate-ui/accordion-radix';
import './checkout-faq.css';

// Questions a buyer asks before paying. Every answer restates what the checkout itself already says.
const ITEMS = [
  {
    title: '¿Qué recibo al pagar Hashcod Pro?',
    content: 'Acceso a la Toolbook, permiso de IA, la Prueba Sellada de Objeto y Tiempo (PSOT), uso de las herramientas y 25 solicitudes al mes. El plan cuesta US$2,000 al mes, o US$19,200 al año con 20 % de descuento.',
  },
  {
    title: '¿Cómo funciona el pago?',
    content: 'Pulsas el botón y se abre WhatsApp con tu pedido ya escrito. Un asesor de Hashcod te responde con las instrucciones de pago. Al confirmar tu pago, te envía un código de 6 dígitos que escribes aquí para activar tu suscripción.',
  },
  {
    title: '¿Es seguro? ¿Piden datos de tarjeta?',
    content: 'No pedimos datos de tarjeta. Nunca compartas contraseñas por WhatsApp. El código de activación caduca en 15 minutos y solo funciona en la sesión donde hiciste el pedido.',
  },
  {
    title: '¿Para qué piden mi cédula?',
    content: 'Solo para coordinar la facturación en República Dominicana. Se incluye en el mensaje de WhatsApp únicamente si eliges ese país y no se guarda en la plataforma.',
  },
  {
    title: '¿Qué es la PSOT y tiene valor legal?',
    content: 'La Prueba Sellada de Objeto y Tiempo es un registro que Hashcod emite con la huella de tu archivo y la fecha y hora exactas, para demostrar que existía tal cual en ese momento. Es una prueba de la plataforma: no es una firma ni un certificado digital cualificado de una entidad autorizada por el INDOTEL.',
  },
  {
    title: '¿Puedo cancelar cuando quiera?',
    content: 'Sí. La suscripción se puede cancelar cuando quieras, y la confirmación del pago es directa por WhatsApp con un asesor.',
  },
  {
    title: '¿Quién está detrás de Hashcod?',
    content: 'Hashcod opera en hashcodcodespace.dev con RNC 402-0936929-3 y Registro Mercantil 3323LV-PF. Si tienes dudas antes de pagar, puedes escribirle al asesor por WhatsApp; no tienes que pagar para preguntar.',
  },
  {
    title: '¿Puedo entrar sin pagar?',
    content: 'Sí, con "Entrar Gratis" puedes explorar la presentación y los planes. Toolbook, herramientas, nube y PSOT requieren un código de pago válido.',
  },
];

export default function CheckoutFaq() {
  return (
    <section className="hco-faq" aria-labelledby="hco-faq-title">
      <h2 id="hco-faq-title" className="hco-faq-title">Preguntas frecuentes</h2>
      <Accordion type="single" collapsible className="w-full">
        {ITEMS.map((item, index) => (
          <AccordionItem key={item.title} value={`item-${index + 1}`}>
            <AccordionTrigger showArrow>{item.title}</AccordionTrigger>
            <AccordionContent keepRendered={false}>{item.content}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
