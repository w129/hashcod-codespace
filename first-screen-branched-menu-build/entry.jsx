import React from 'react';
import { createRoot } from 'react-dom/client';
import { Rocket01Icon, Settings02Icon } from '@hugeicons/core-free-icons';
import BranchedMenu from './BranchedMenu';

const FaqIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 48 48"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M 17 4 C 9.2854554 4 3 10.284385 3 17.998047 C 3 20.214327 3.5841038 22.283367 4.5039062 24.146484 L 3.0820312 29.236328 C 2.6451621 30.796136 4.1999681 32.353712 5.7597656 31.919922 A 1.50015 1.50015 0 0 0 5.7617188 31.917969 L 10.857422 30.496094 C 12.719786 31.413923 14.784843 31.998047 17 31.998047 C 17.053808 31.998047 17.106491 31.994743 17.160156 31.994141 C 18.135569 38.764659 23.964993 43.998047 31 43.998047 C 33.215157 43.998047 35.280214 43.413923 37.142578 42.496094 L 42.238281 43.917969 A 1.50015 1.50015 0 0 0 42.240234 43.919922 C 43.799363 44.353526 45.352943 42.797417 44.917969 41.238281 L 43.496094 36.146484 C 44.415896 34.283367 45 32.214327 45 29.998047 C 45 22.284385 38.714545 16 31 16 C 30.951182 16 30.904171 16.00731 30.855469 16.007812 C 29.885594 9.2284033 24.038037 4 17 4 z M 17 7 C 22.536331 7 27.088257 11.057183 27.875 16.365234 C 25.48026 16.914944 23.322859 18.079654 21.568359 19.685547 L 18.458984 12.105469 A 1.50015 1.50015 0 0 0 16.96875 10.980469 A 1.50015 1.50015 0 0 0 16.933594 10.982422 A 1.50015 1.50015 0 0 0 15.539062 12.105469 L 11.111328 22.931641 A 1.5004805 1.5004805 0 1 0 13.888672 24.068359 L 14.734375 22 L 19.53125 22 C 18.123084 24.011538 17.236228 26.406186 17.050781 28.994141 C 17.033545 28.994218 17.01726 28.998047 17 28.998047 C 15.055106 28.998047 13.241826 28.492503 11.65625 27.609375 A 1.50015 1.50015 0 0 0 10.523438 27.474609 L 6.3632812 28.636719 L 7.5253906 24.478516 A 1.50015 1.50015 0 0 0 7.390625 23.34375 C 6.5060643 21.758765 6 19.943606 6 17.998047 C 6 11.905709 10.906545 7 17 7 z M 17.001953 16.457031 L 18.044922 19 L 15.962891 19 L 17.001953 16.457031 z M 31 19 C 37.093455 19 42 23.905709 42 29.998047 C 42 31.943606 41.493936 33.758765 40.609375 35.34375 A 1.50015 1.50015 0 0 0 40.474609 36.478516 L 41.636719 40.636719 L 37.476562 39.474609 A 1.50015 1.50015 0 0 0 36.34375 39.609375 C 34.758174 40.492503 32.944894 40.998047 31 40.998047 C 25.083419 40.998047 20.298923 36.367156 20.025391 30.521484 A 1.50015 1.50015 0 0 0 20.007812 30.152344 C 20.007096 30.100385 20 30.050181 20 29.998047 C 20 23.905709 24.906545 19 31 19 z M 31 23 C 28.256343 23 26 25.256343 26 28 L 26 31 C 26 33.45214 27.834043 35.421347 30.175781 35.832031 C 30.686527 36.597537 32.107648 38.5 35 38.5 A 1.50015 1.50015 0 1 0 35 35.5 C 34.55744 35.5 34.236092 35.194012 33.867188 34.976562 C 35.123854 34.064775 36 32.657302 36 31 L 36 28 C 36 25.256343 33.743657 23 31 23 z M 31 26 C 32.122343 26 33 26.877657 33 28 L 33 31 C 33 32.105358 32.14089 32.956402 31.042969 32.982422 A 1.50015 1.50015 0 0 0 30.960938 32.984375 C 29.860722 32.960703 29 32.106951 29 31 L 29 28 C 29 26.877657 29.877657 26 31 26 z" />
  </svg>
);

const CardIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M 2.4824219 0.5 A 0.50005 0.50005 0 0 0 2 1 L 2 9.5058594 A 0.50005 0.50005 0 0 0 2.2773438 9.953125 L 6.0117188 11.820312 L 6.0117188 15 A 0.50005 0.50005 0 0 0 6.7363281 15.447266 L 13.722656 11.953125 A 0.50005 0.50005 0 0 0 14 11.505859 L 14 3 A 0.50005 0.50005 0 0 0 13.484375 2.5 A 0.50005 0.50005 0 0 0 13.277344 2.5527344 L 10 4.1914062 L 2.7226562 0.55273438 A 0.50005 0.50005 0 0 0 2.4824219 0.5 z M 3 1.8085938 L 8.8828125 4.75 L 7.7441406 5.3203125 L 4.7304688 3.8125 A 0.50005 0.50005 0 0 0 4.4882812 3.7558594 A 0.50005 0.50005 0 0 0 4.2832031 4.7070312 L 6.625 5.8789062 L 6.2890625 6.046875 A 0.50005 0.50005 0 0 0 6.015625 6.4511719 L 4.7304688 5.8085938 A 0.50005 0.50005 0 0 0 4.4882812 5.7519531 A 0.50005 0.50005 0 0 0 4.2832031 6.703125 L 6.0117188 7.5683594 L 6.0117188 8.4648438 L 4.7304688 7.8242188 A 0.50005 0.50005 0 0 0 4.4882812 7.7675781 A 0.50005 0.50005 0 0 0 4.2832031 8.71875 L 6.0117188 9.5820312 L 6.0117188 10.703125 L 3 9.1972656 L 3 1.8085938 z M 13 3.8085938 L 13 11.197266 L 7.0117188 14.191406 L 7.0117188 11.529297 A 0.50005805 0.50005805 0 0 0 7.0117188 11.478516 L 7.0117188 9.2910156 A 0.50005814 0.50005814 0 0 0 7.0117188 9.2402344 L 7.0117188 7.2773438 A 0.50005814 0.50005814 0 0 0 7.0117188 7.2265625 L 7.0117188 6.8027344 L 7.9433594 6.3359375 L 7.9550781 6.3320312 A 0.50005821 0.50005821 0 0 0 7.9980469 6.3085938 L 10.154297 5.2324219 A 0.50005825 0.50005825 0 0 0 10.304688 5.15625 L 13 3.8085938 z M 11.496094 5.7558594 A 0.50005 0.50005 0 0 0 11.269531 5.8125 L 8.2792969 7.3085938 A 0.50005814 0.50005814 0 0 0 8.7265625 8.203125 L 11.716797 6.7070312 A 0.50005 0.50005 0 0 0 11.496094 5.7558594 z M 11.496094 7.7519531 A 0.50005 0.50005 0 0 0 11.269531 7.8085938 L 8.2792969 9.3046875 A 0.50005828 0.50005828 0 1 0 8.7265625 10.199219 L 11.716797 8.703125 A 0.50005 0.50005 0 0 0 11.496094 7.7519531 z M 11.496094 9.7675781 A 0.50005 0.50005 0 0 0 11.269531 9.8242188 L 8.2792969 11.320312 A 0.5000585 0.5000585 0 1 0 8.7265625 12.214844 L 11.716797 10.71875 A 0.50005 0.50005 0 0 0 11.496094 9.7675781 z" />
  </svg>
);

const WorkspaceIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M 3 3 C 2.447 3 2 3.448 2 4 L 2 15 C 2 15.28 2.1167344 15.531891 2.3027344 15.712891 L 2.3007812 15.712891 C 2.3007812 15.712891 5.9432969 19.73275 7.4042969 21.34375 C 7.7832969 21.76175 8.3227187 22 8.8867188 22 L 20 22 C 21.105 22 22 21.105 22 20 L 22 6.7324219 C 22 6.2594219 21.833344 5.8024063 21.527344 5.4414062 C 20.868344 4.6624063 19.753906 3.34375 19.753906 3.34375 C 19.753906 3.34375 19.752953 3.358375 19.751953 3.359375 C 19.568953 3.143375 19.305 3 19 3 L 3 3 z M 4 5 L 18 5 L 18 14 L 15 14 C 14.236 12.849 12.671 12.011 11 12 C 9.315 12 7.526 12.986 7 14 L 4 14 L 4 5 z M 11 12 A 3 3 0 0 0 11 6 A 3 3 0 0 0 11 12 z M 7.0234375 14 L 14.976562 14 C 15.609562 14.838 16 15.869 16 17 L 6 17 C 6 15.869 6.3904375 14.838 7.0234375 14 z" />
  </svg>
);

const TextCardIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 64 64"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M 16 15 C 12.691 15 10 17.691 10 21 L 10 43 C 10 46.309 12.691 49 16 49 L 48 49 C 51.309 49 54 46.309 54 43 L 54 21 C 54 17.691 51.309 15 48 15 L 16 15 z M 16 19 L 48 19 C 49.103 19 50 19.897 50 21 L 50 22.039062 L 14 22.039062 L 14 21 C 14 19.897 14.897 19 16 19 z M 14 26.039062 L 50 26.039062 L 50 43 C 50 44.103 49.103 45 48 45 L 16 45 C 14.897 45 14 44.103 14 43 L 14 26.039062 z" />
  </svg>
);

const DocumentsIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M 5 1 C 3.9 1 3 1.9 3 3 L 3 17 L 5 17 L 5 3 L 17 3 L 17 1 L 5 1 z M 9 5 C 7.9 5 7 5.9 7 7 L 7 21 C 7 22.1 7.9 23 9 23 L 20 23 C 21.1 23 22 22.1 22 21 L 22 10 L 17 5 L 9 5 z M 9 7 L 16 7 L 16 11 L 20 11 L 20 21 L 9 21 L 9 7 z M 11 13 L 11 15 L 18 15 L 18 13 L 11 13 z M 11 17 L 11 19 L 18 19 L 18 17 L 11 17 z" />
  </svg>
);

const items = [
  {
    label: 'Inicio',
    children: [
      { value: 'faq', label: 'FAQ', icon: FaqIcon },
      { value: 'card', label: 'Card', icon: CardIcon },
      { value: 'workspace', label: 'Workspace', icon: WorkspaceIcon },
      { value: 'text-card', label: 'Text Card', icon: TextCardIcon },
      { value: 'documents', label: 'Documents', icon: DocumentsIcon },
      { value: 'quick', label: 'Inicio rápido', icon: Rocket01Icon },
      { value: 'config', label: 'Configuración', icon: Settings02Icon }
    ]
  },
  {
    label: 'Componentes',
    children: [
      { value: 'buttons', label: 'Botones' },
      { value: 'overlays', label: 'Capas' }
    ]
  }
];

function navigate(value, item) {
  try {
    const url = new URL(window.location.href);
    url.hash = value;
    history.replaceState(history.state, '', url.pathname + url.search + url.hash);
  } catch (_) {}

  try {
    window.dispatchEvent(new CustomEvent('hashcod:first-screen-branched-menu-select', {
      detail: { value, item }
    }));
  } catch (_) {}
}


const CALENDAR_WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

const calendarIso = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const calendarSameDay = (left, right) =>
  Boolean(left && right) &&
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const calendarDayText = (date) =>
  date.toLocaleDateString('es-DO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

function CalendarExample() {
  const [today, setToday] = React.useState(() => new Date());
  const [visibleMonth, setVisibleMonth] = React.useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selected, setSelected] = React.useState(() => today);

  React.useEffect(() => {
    let currentDay = today;
    let timer;
    const refresh = () => {
      const now = new Date();
      if (!calendarSameDay(now, currentDay)) {
        const previousDay = currentDay;
        currentDay = now;
        setToday(now);
        // Follow today across midnight without replacing a user's chosen date/month.
        setSelected(current => calendarSameDay(current, previousDay) ? now : current);
        setVisibleMonth(current =>
          current.getFullYear() === previousDay.getFullYear() && current.getMonth() === previousDay.getMonth()
            ? new Date(now.getFullYear(), now.getMonth(), 1)
            : current
        );
      }
      window.clearTimeout(timer);
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timer = window.setTimeout(refresh, Math.max(1, midnight.getTime() - now.getTime() + 50));
    };
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('pageshow', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('pageshow', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [today]);

  const goToToday = () => {
    const now = new Date();
    setToday(now);
    setSelected(now);
    setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const year = visibleMonth.getFullYear();
  const monthIndex = visibleMonth.getMonth();
  const first = new Date(year, monthIndex, 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [];

  for (let index = 0; index < offset; index += 1) cells.push(null);
  for (let value = 1; value <= daysInMonth; value += 1) {
    cells.push(new Date(year, monthIndex, value));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const moveMonth = (amount) => {
    setVisibleMonth((current) =>
      new Date(current.getFullYear(), current.getMonth() + amount, 1)
    );
  };

  const summary = selected
    ? `${calendarDayText(selected)} · ${calendarSameDay(selected, today) ? 'Hoy' : 'Fecha seleccionada'}`
    : 'Selecciona una fecha.';

  return (
    <section
      id="d5FirstScreenCalendar"
      className="v-calendar-example"
      data-calendar-example="single"
      aria-label="Calendario"
    >
      <div className="v-calendar-example__intro">
        <span className="v-calendar-example__eyebrow">Calendario</span>
        <h3>La fecha de hoy</h3>
        <p id="d5CalendarTodayText" aria-live="polite">
          {today.toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <p>Consulta las fechas o vuelve a hoy.</p>
      </div>

      <div className="v-calendar" data-calendar-accent="black">
        <div className="v-calendar__header">
          <button
            id="d5CalendarPreviousMonth"
            className="v-calendar__nav"
            type="button"
            aria-label="Mes anterior"
            onClick={() => moveMonth(-1)}
          >
            <span aria-hidden="true">‹</span>
          </button>
          <strong id="d5CalendarMonthLabel" aria-live="polite">
            {visibleMonth.toLocaleDateString('es-DO', {
              month: 'long',
              year: 'numeric'
            })}
          </strong>
          <button
            id="d5CalendarNextMonth"
            className="v-calendar__nav"
            type="button"
            aria-label="Mes siguiente"
            onClick={() => moveMonth(1)}
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>

        <div className="v-calendar__weekdays" aria-hidden="true">
          {CALENDAR_WEEKDAYS.map((weekday) => (
            <span key={weekday}>{weekday.slice(0, 2)}</span>
          ))}
        </div>

        <div className="v-calendar__grid" role="grid" aria-labelledby="d5CalendarMonthLabel">
          {cells.map((date, index) => {
            if (!date) {
              return <span className="v-calendar__blank" key={`blank-${index}`} aria-hidden="true" />;
            }

            const iso = calendarIso(date);
            const isSelected = calendarSameDay(date, selected);
            const isToday = calendarSameDay(date, today);

            return (
              <button
                className="v-calendar__day"
                type="button"
                role="gridcell"
                key={iso}
                data-calendar-date={iso}
                data-selected={isSelected ? 'true' : undefined}
                data-today={isToday ? 'true' : undefined}
                aria-current={isToday ? 'date' : undefined}
                aria-pressed={isSelected}
                aria-label={`${calendarDayText(date)}${isToday ? ', hoy' : ''}`}
                onClick={() => setSelected(date)}
              >
                <span
                  className="v-calendar__day-face"
                  data-selected-face={isSelected ? 'true' : undefined}
                >
                  {date.getDate()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="v-calendar-example__summary" aria-live="polite">
        <p id="d5CalendarSummary" role="status">{summary}</p>
      </div>

      <div className="v-calendar-example__actions">
        <button id="d5CalendarToday" className="v-calendar-example__clear" type="button" onClick={goToToday}>
          Hoy
        </button>
        <button
          id="d5CalendarClear"
          className="v-calendar-example__clear"
          type="button"
          onClick={() => setSelected(undefined)}
        >
          Limpiar selección
        </button>
      </div>
    </section>
  );
}

function FirstScreenMenuStack() {
  const [compact, setCompact] = React.useState(() => window.matchMedia('(max-width: 1179px)').matches);
  React.useEffect(() => {
    const media = window.matchMedia('(max-width: 1179px)');
    const update = () => setCompact(media.matches);
    media.addEventListener('change', update);
    update();
    return () => media.removeEventListener('change', update);
  }, []);
  return (
    <div className="first-screen-menu-stack">
      <BranchedMenu
        items={items}
        defaultOpen={compact ? [] : [0]}
        defaultActive="quick"
        onSelect={(value, item) => navigate(value, item)}
        color="#0a0a0a"
        accentColor="#0a0a0a"
        lineColor="#0a0a0a"
        width={240}
        rowHeight={compact ? 44 : 36}
        indent={40}
        trunk={14}
        radius={10}
        lineWidth={1.5}
        fontSize={14}
        drawDuration={400}
        foldDuration={300}
      />
      <CalendarExample />
    </div>
  );
}


function mountBranchedMenu() {
  const node = document.getElementById('d5FirstBranchedMenuMount');
  if (!node || node.dataset.reactMounted === 'true') return Boolean(node);

  const root = createRoot(node);
  root.render(<FirstScreenMenuStack />);

  node.dataset.reactMounted = 'true';
  window.HashcodFirstScreenBranchedMenu = Object.freeze({
    mounted: true,
    version: '20261006-mobile-layout1'
  });
  return true;
}

function mountFirstScreenReactIslands() {
  mountBranchedMenu();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountFirstScreenReactIslands, { once: true });
} else {
  mountFirstScreenReactIslands();
}
