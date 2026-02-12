"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "About Us", href: "/about" },
    {
      label: "Products",
      href: "/products",
      children: [
        { label: "Biodiesel", href: "/products/biodiesel" },
        { label: "Crude Glycerin", href: "/products/crude-glycerin" },
      ],
    },
    { label: "Investors", href: "/investors" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <>
      <nav
        className={`navbar${scrolled ? " scrolled" : ""}`}
        role="navigation"
        aria-label="Main Navigation"
      >
        <Link
          href="/"
          className="navbar-logo"
          aria-label="Kotyark Industries Home"
        >
          <img src="/images/kotyark-logo.png" alt="Kotyark Industries" />
        </Link>

        <ul className="navbar-nav">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                {item.label}
                {item.children && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                )}
              </Link>
              {item.children && (
                <div className="dropdown-menu">
                  {item.children.map((child) => (
                    <Link key={child.href} href={child.href}>
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>

        <div className="navbar-cta">
          <Link href="/contact" className="btn btn-primary btn-sm">
            Contact Our Team
          </Link>
          <button
            className="navbar-toggle"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div
          className="mobile-nav-overlay"
          style={{ display: "block" }}
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div
        className="mobile-nav"
        style={{
          display: mobileOpen ? "block" : "none",
          transform: mobileOpen ? "translateX(0)" : "translateX(100%)",
        }}
      >
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation menu"
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--color-text-primary)",
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginTop: "40px",
          }}
        >
          {navItems.map((item) => (
            <div key={item.href}>
              <Link
                href={item.href}
                style={{
                  display: "block",
                  padding: "12px 16px",
                  fontSize: "16px",
                  fontWeight: 500,
                  color: "var(--color-text-primary)",
                  borderRadius: "var(--radius-sm)",
                }}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
              {item.children &&
                item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    style={{
                      display: "block",
                      padding: "10px 16px 10px 32px",
                      fontSize: "15px",
                      color: "var(--color-text-secondary)",
                    }}
                    onClick={() => setMobileOpen(false)}
                  >
                    {child.label}
                  </Link>
                ))}
            </div>
          ))}
          <Link
            href="/contact"
            className="btn btn-primary"
            style={{ marginTop: "16px", textAlign: "center" }}
            onClick={() => setMobileOpen(false)}
          >
            Contact Our Team
          </Link>
        </div>
      </div>
    </>
  );
}
