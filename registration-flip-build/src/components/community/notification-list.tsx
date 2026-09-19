'use client';

import * as React from 'react';
import { ArrowUpRight, RotateCcw } from 'lucide-react';
import { AnimatePresence, motion, type Transition } from 'motion/react';

const notifications = [
  {
    id: 1,
    title: 'Validation system',
    subtitle: 'Revisión y certificación',
    detail:
      'Cuando te contactemos te pediremos todo el ZIP de tu plataforma para que nuestros expertos agentes de IA lo analicen después de tu pago según a lo que se amerite, donde luego de que se analice todo se procederá a proveerte la certificación de tu creación de IA.',
  },
  {
    id: 2,
    title: "I wonder what's in the certificate.",
    subtitle: 'Contenido y seguridad del certificado',
    detail:
      'El certificado contará con una parte donde las personas podrán acceder a tu plataforma a través de un enlace y también tendrá code de validación y firmas post-cuánticas como Dilithium-5 para que nadie ni una computadora cuántica vulnere tu certificado o plataforma. También tendrá un apartado de todo lo que contiene lo que desarrollaste, todo precisamente para que si cambias algo ya no sirva el certificado.',
  },
  {
    id: 3,
    title: 'Notification process',
    subtitle: 'Seguimiento diario',
    detail:
      'Te enviaremos todos los días por medio de WhatsApp o Gmail, según a lo que prefieras, una notificación de en qué proceso va.',
  },
  {
    id: 4,
    title: 'Payment Model',
    subtitle: 'Pago y validación criptográfica',
    detail:
      'El pago se realizará por medio de una cuenta bancaria, donde para que no seas estafado cuando nos provees tu code te daremos un code criptográfico que debe ser igual al que te entregó el formulario cuando subiste la idea de tu creación de IA. Si no ves que es el mismo no debes responder a ese mensaje; pero si es el mismo seguiremos con el proceso correspondiente al pago y solicitud.',
  },
];

const transition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 26,
};

const getCardVariants = (i: number) => ({
  collapsed: {
    marginTop: i === 0 ? 0 : -44,
    scaleX: 1 - i * 0.05,
  },
  expanded: {
    marginTop: i === 0 ? 0 : 4,
    scaleX: 1,
  },
});

const textSwitchTransition: Transition = {
  duration: 0.22,
  ease: 'easeInOut',
};

const notificationTextVariants = {
  collapsed: { opacity: 1, y: 0, pointerEvents: 'auto' as const },
  expanded: { opacity: 0, y: -16, pointerEvents: 'none' as const },
};

const viewAllTextVariants = {
  collapsed: { opacity: 0, y: 16, pointerEvents: 'none' as const },
  expanded: { opacity: 1, y: 0, pointerEvents: 'auto' as const },
};

function NotificationList() {
  const [selected, setSelected] = React.useState<number | null>(null);

  return (
    <motion.div
      className="hashcod-notification-list"
      data-animate-ui-notification-list="official-adapted"
      initial="collapsed"
      whileHover="expanded"
    >
      <div className="hashcod-notification-stack">
        {notifications.map((notification, i) => {
          const open = selected === notification.id;
          return (
            <motion.button
              type="button"
              key={notification.id}
              className="hashcod-notification-card"
              variants={getCardVariants(i)}
              transition={transition}
              style={{ zIndex: notifications.length - i }}
              aria-expanded={open}
              onClick={() =>
                setSelected((current) =>
                  current === notification.id ? null : notification.id,
                )
              }
            >
              <span className="hashcod-notification-card-top">
                <span className="hashcod-notification-title">
                  {notification.title}
                </span>
                <span className="hashcod-notification-count">
                  <RotateCcw aria-hidden="true" />
                  <span>{notification.id}</span>
                </span>
              </span>
              <span className="hashcod-notification-subtitle">
                {notification.subtitle}
              </span>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.span
                    className="hashcod-notification-detail"
                    initial={{ opacity: 0, height: 0, y: -8 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -8 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                  >
                    {notification.detail}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      <div className="hashcod-notification-footer">
        <div className="hashcod-notification-badge">{notifications.length}</div>
        <span className="hashcod-notification-footer-switch">
          <motion.span
            className="hashcod-notification-footer-label"
            variants={notificationTextVariants}
            transition={textSwitchTransition}
          >
            Información del proceso
          </motion.span>
          <motion.span
            className="hashcod-notification-footer-label hashcod-notification-footer-expanded"
            variants={viewAllTextVariants}
            transition={textSwitchTransition}
          >
            Ver las 4 <ArrowUpRight aria-hidden="true" />
          </motion.span>
        </span>
      </div>
    </motion.div>
  );
}

export { NotificationList };
