"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { DEFAULT_HEADER_NAV } from "@/lib/nav-defaults";
import { useStockQuote, formatQuote } from "@/components/site/useStockQuote";
import s from "./Navbar.module.css";

function isActive(pathname, href) {
  if (!href || !pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

// Fixed 2026 nav: transparent at the top, blurred dark bar after 40px of scroll.
// items: top-level CMS nav ([{ id, label, href, children? }]) or null for the hard-coded menu.
export default function Navbar({ items, quote = null }) {
  const [solid, setSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropId, setDropId] = useState(null);
  const pathname = usePathname();
  const navRef = useRef(null);
  const { quote: live } = useStockQuote(quote);
  const q = formatQuote(live);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setDropId(null);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setMenuOpen(false);
      setDropId(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const navItems = items && items.length ? items : DEFAULT_HEADER_NAV;
  const keyOf = (i) => i.id || i.href || i.label;

  return (
    <nav ref={navRef} className={`${s.nav} ${solid || menuOpen ? s.solid : ""} ${solid ? s.line : ""}`} aria-label="Main">
      <div className={s.bar}>
        <Link href="/" className={s.logo} aria-label="Kotyark Industries Limited home">
          <img src="/images/kil-logo-white-trim.png" alt="Kotyark Industries Limited" width="73" height="46" />
        </Link>

        <ul className={s.links}>
          {navItems.map((item) => {
            const kids = item.children?.length ? item.children : null;
            const active = isActive(pathname, item.href) || (kids && kids.some((c) => isActive(pathname, c.href)));
            const open = dropId === keyOf(item);
            return (
              <li
                key={keyOf(item)}
                className={s.item}
                onMouseEnter={kids ? () => setDropId(keyOf(item)) : undefined}
                onMouseLeave={kids ? () => setDropId(null) : undefined}
                onFocus={kids ? () => setDropId(keyOf(item)) : undefined}
                onBlur={kids ? (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDropId(null); } : undefined}
              >
                {item.href ? (
                  <Link href={item.href} className={`${s.link} ${active ? s.active : ""}`} aria-current={isActive(pathname, item.href) ? "page" : undefined}>
                    {item.label}
                    {kids && <svg className={s.caret} width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M1.5 3.5 5 7l3.5-3.5" /></svg>}
                  </Link>
                ) : (
                  <span className={`${s.link} ${s.heading}`}>{item.label}</span>
                )}
                {kids && (
                  <ul className={`${s.drop} ${open ? s.dropOpen : ""}`}>
                    {kids.map((c) => (
                      <li key={keyOf(c)}>
                        <Link href={c.href} className={`${s.dropLink} ${isActive(pathname, c.href) ? s.dropActive : ""}`}>{c.label}</Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>

        {q && (
          <Link href="/investors" className={s.pill} aria-label={`NSE Kotyark share price ${q.priceStr} rupees`}>
            <span className={s.dot} aria-hidden="true" />
            <span>NSE · KOTYARK</span>
            <span className={s.price}>₹{q.priceStr}</span>
            <span style={{ color: q.chgColor }}>{q.pctStr}</span>
          </Link>
        )}

        <Link href="/contact" className={s.cta}>Talk to our team</Link>

        <button
          type="button"
          className={s.menuBtn}
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-controls="kd-mobile-menu"
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </div>

      {menuOpen && (
        <div className={s.menu} id="kd-mobile-menu">
          {navItems.map((item) => (
            <div key={keyOf(item)} className={s.menuGroup}>
              {item.href ? (
                <Link href={item.href} className={`${s.menuLink} ${isActive(pathname, item.href) ? s.active : ""}`} aria-current={isActive(pathname, item.href) ? "page" : undefined}>{item.label}</Link>
              ) : (
                <span className={`${s.menuLink} ${s.heading}`}>{item.label}</span>
              )}
              {item.children?.map((c) => (
                <Link key={keyOf(c)} href={c.href} className={s.menuSub}>{c.label}</Link>
              ))}
            </div>
          ))}
          <Link href="/contact" className={s.menuCta}>Talk to our team</Link>
        </div>
      )}
    </nav>
  );
}
