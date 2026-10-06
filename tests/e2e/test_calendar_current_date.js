'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const bundle = fs.readFileSync(path.resolve(__dirname, '../../components/first-screen-branched-menu.bundle.js'), 'utf8');
const pause = () => new Promise(resolve => setTimeout(resolve, 10));
async function until(check) {
  for (let i = 0; i < 200; i++) { if (check()) return; await pause(); }
  throw new Error('Calendar did not reach the expected date');
}
async function scenario(origin) {
  const dom = new JSDOM('<div id="d5FirstBranchedMenuMount"></div>', { url: origin, runScripts: 'dangerously', pretendToBeVisual: true });
  const w = dom.window, errors = [], timers = new Map();
  const RealDate = w.Date;
  let clock = new Date(2026, 9, 6, 12).getTime();
  w.Date = class extends RealDate {
    constructor(...args) { super(...(args.length ? args : [clock])); }
    static now() { return clock; }
  };
  const realTimeout = w.setTimeout.bind(w), realClear = w.clearTimeout.bind(w);
  w.setTimeout = (callback, delay, ...args) => {
    const id = realTimeout(() => { timers.delete(id); callback(...args); }, delay);
    if (delay >= 1) timers.set(id, { callback, due: clock + delay });
    return id;
  };
  w.clearTimeout = id => { timers.delete(id); realClear(id); };
  w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  w.ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };
  w.addEventListener('error', e => errors.push(e.error));
  const doc = w.document, selected = () => doc.querySelector('[data-calendar-date][data-selected="true"]')?.dataset.calendarDate;
  const today = () => doc.querySelector('[data-calendar-date][aria-current="date"]')?.dataset.calendarDate;
  const click = id => { assert(doc.getElementById(id), id + ' missing'); doc.getElementById(id).click(); };
  const focus = date => { clock = date.getTime(); w.dispatchEvent(new w.Event('focus')); };
  try {
    w.eval(bundle);
    await until(() => doc.getElementById('d5CalendarMonthLabel'));
    assert.equal(selected(), '2026-10-06', 'calendar must select the real current local day, not a demo date');
    assert.equal(today(), '2026-10-06');
    assert.match(doc.getElementById('d5CalendarMonthLabel').textContent, /octubre de 2026/i);
    assert.match(doc.getElementById('d5CalendarTodayText').textContent, /6 de octubre de 2026/);
    assert(!doc.getElementById('d5FirstScreenCalendar').textContent.includes('Studio review'));
    assert.equal(doc.querySelectorAll('[data-calendar-date]:disabled,[data-marked="true"]').length, 0, 'no invented appointments or unavailable days');
    click('d5CalendarNextMonth');
    await until(() => /noviembre/.test(doc.getElementById('d5CalendarMonthLabel').textContent));
    click('d5CalendarToday');
    await until(() => today() === '2026-10-06');
    doc.querySelector('[data-calendar-date="2026-10-18"]').click();
    await until(() => selected() === '2026-10-18');
    focus(new Date(2026, 9, 7, 8));
    await until(() => today() === '2026-10-07');
    assert.equal(selected(), '2026-10-18', 'a chosen date must survive an automatic today refresh');
    assert.match(doc.getElementById('d5CalendarTodayText').textContent, /7 de octubre de 2026/);
    click('d5CalendarClear');
    await until(() => !selected());
    assert.equal(doc.getElementById('d5CalendarSummary').textContent, 'Selecciona una fecha.');
    focus(new Date(2031, 11, 31, 23, 59, 59, 900));
    click('d5CalendarToday');
    await until(() => selected() === '2031-12-31');
    clock = new Date(2032, 0, 1, 0, 0, 0, 100).getTime();
    const due = [...timers.entries()].filter(([, timer]) => timer.due <= clock);
    assert(due.length, 'a midnight refresh must be scheduled');
    for (const [id, timer] of due) { w.clearTimeout(id); timer.callback(); }
    await until(() => selected() === '2032-01-01');
    assert.equal(today(), '2032-01-01');
    assert.match(doc.getElementById('d5CalendarMonthLabel').textContent, /enero de 2032/i);
    focus(new Date(2028, 1, 29, 12));
    doc.dispatchEvent(new w.Event('visibilitychange'));
    w.dispatchEvent(new w.Event('pageshow'));
    click('d5CalendarToday');
    await until(() => selected() === '2028-02-29');
    assert.equal(today(), '2028-02-29');
    assert.equal(doc.querySelectorAll('[data-calendar-date]').length, 29, 'leap February must contain 29 days');
    assert.deepEqual(errors, []);
    console.log('Current-date calendar passed:', origin, process.env.TZ || 'system timezone');
  } finally { dom.window.close(); }
}
(async () => {
  await scenario('https://hashcodcodespace.dev/');
  await scenario('http://127.0.0.1:8000/');
})().catch(error => { console.error(error); process.exitCode = 1; });
