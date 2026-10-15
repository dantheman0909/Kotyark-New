'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Popup from './Popup';
import { MOBILE_MAX_WIDTH, isBlockedRoute, pathAllowed } from '@/lib/popup-config';

// Pop-ups seen during this page load (a full reload resets it; storage rules below decide across loads).
const shownThisLoad = new Set();

function storageGet(kind, key) {
  try { return (kind === 'session' ? window.sessionStorage : window.localStorage).getItem(key); } catch { return null; }
}
function storageSet(kind, key, value) {
  try { (kind === 'session' ? window.sessionStorage : window.localStorage).setItem(key, value); } catch { /* storage blocked: fall back to per-load */ }
}

/** True when the frequency rules say this pop-up may be shown now. */
function frequencyAllows(p) {
  if (shownThisLoad.has(p.id)) return false;
  const key = `kp:seen:${p.id}`;
  const { frequency, frequencyDays } = p.rules;
  if (frequency === 'session') return storageGet('session', key) === null;
  if (frequency === 'once') return storageGet('local', key) === null;
  if (frequency === 'days') {
    const at = Number(storageGet('local', key));
    return !at || Date.now() - at > frequencyDays * 86_400_000;
  }
  return true; // every-visit
}
function markShown(p) {
  shownThisLoad.add(p.id);
  const key = `kp:seen:${p.id}`;
  const now = String(Date.now());
  if (p.rules.frequency === 'session') storageSet('session', key, now);
  else if (p.rules.frequency === 'once' || p.rules.frequency === 'days') storageSet('local', key, now);
}

function sendEvent(id, type) {
  const url = `/api/popups/${id}/event`;
  const body = JSON.stringify({ type });
  try {
    if (navigator.sendBeacon && navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))) return;
  } catch { /* fall through */ }
  try { fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {}); } catch { /* ignore */ }
}

/**
 * Public pop-up host. `popups` arrives sorted by priority (highest first) from the server shell.
 * Chooses the first pop-up whose paths/device/frequency match, waits for its trigger, then shows it.
 * Re-evaluates on client-side navigation.
 */
export default function PopupHost({ popups: initial, initialPath = null }) {
  const pathname = usePathname();
  // `initial` only holds the pop-ups for the page the server rendered. After the first client-side
  // navigation elsewhere, the full active list is fetched once.
  const [all, setAll] = useState(null);
  const norm = (p) => (p && p.length > 1 ? p.replace(/\/+$/, '') : p);
  const needAll = initialPath != null && norm(pathname) !== norm(initialPath);
  useEffect(() => {
    if (!needAll || all) return;
    fetch('/api/popups/active').then((r) => (r.ok ? r.json() : null)).then((j) => { if (j?.popups) setAll(j.popups); }).catch(() => {});
  }, [needAll, all]);
  const popups = needAll ? all : initial;
  const [active, setActive] = useState(null);
  const [mobile, setMobile] = useState(null); // null until the first media-query read, so no pop-up is picked on a wrong guess
  const activeRef = useRef(null);
  activeRef.current = active;

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`);
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  const show = useCallback((p) => {
    markShown(p);
    setActive(p);
    sendEvent(p.id, 'view');
  }, []);

  useEffect(() => {
    setActive(null); // a navigation closes the previous pop-up; the next one is chosen below
    if (mobile === null || !popups?.length || isBlockedRoute(pathname)) return undefined;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const candidate = popups.find((p) =>
      pathAllowed(p.rules, pathname)
      && (p.rules.devices === 'all' || (p.rules.devices === 'mobile') === mobile)
      && !(p.rules.trigger === 'exit-intent' && (mobile || !fine))
      && frequencyAllows(p));
    if (!candidate) return undefined;

    const t = candidate.rules.trigger;
    let timer = null;
    const cleanups = [];
    const fire = () => { cleanups.forEach((fn) => fn()); cleanups.length = 0; show(candidate); };

    if (t === 'load') {
      timer = setTimeout(fire, 0);
    } else if (t === 'delay') {
      timer = setTimeout(fire, Math.max(0, candidate.rules.delaySeconds) * 1000);
    } else if (t === 'scroll') {
      const check = () => {
        const doc = document.documentElement;
        const scrollable = doc.scrollHeight - window.innerHeight;
        const pct = scrollable <= 0 ? 100 : (window.scrollY / scrollable) * 100;
        if (pct >= candidate.rules.scrollPercent) fire();
      };
      window.addEventListener('scroll', check, { passive: true });
      cleanups.push(() => window.removeEventListener('scroll', check));
      check();
    } else if (t === 'exit-intent') {
      const onLeave = (e) => { if (e.clientY <= 0 && !e.relatedTarget) fire(); };
      document.addEventListener('mouseout', onLeave);
      cleanups.push(() => document.removeEventListener('mouseout', onLeave));
    }
    return () => { if (timer) clearTimeout(timer); cleanups.forEach((fn) => fn()); };
  }, [popups, pathname, mobile, show]);

  const close = useCallback(() => {
    const cur = activeRef.current;
    if (cur) sendEvent(cur.id, 'dismiss');
    setActive(null);
  }, []);
  const cta = useCallback(() => {
    const cur = activeRef.current;
    if (cur) sendEvent(cur.id, 'click');
    setActive(null);
  }, []);

  if (!active) return null;
  return <Popup popup={active} viewport={mobile ? 'mobile' : 'desktop'} onClose={close} onCta={cta} />;
}
