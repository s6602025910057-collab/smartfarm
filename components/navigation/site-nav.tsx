"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const items = [
  { href: "/", label: "หน้าหลัก", icon: "/icons/home.svg" },
  { href: "/soil/avg", label: "Soil", icon: "/icons/soil.svg", submenu: [
    { href: "/soil/1", label: "Soil 1" },
    { href: "/soil/2", label: "Soil 2" },
    { href: "/soil/avg", label: "Average" },
  ] },
  { href: "/sound", label: "Sound", icon: "/icons/sound.svg" },
  { href: "/solarcell", label: "Solar", icon: "/icons/solar.svg" },
  { href: "/rain", label: "Rain", icon: "/icons/rain.svg" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav() {
  const pathname = usePathname();
  const [soilOpen, setSoilOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSoilOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!popoverRef.current?.contains(event.target as Node)) setSoilOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const soilActive = pathname.startsWith("/soil");

  return (
    <>
      <header className="sticky top-0 z-50 hidden border-b border-line/80 bg-background/90 backdrop-blur-md md:block">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="SmartFarm home">
            <span className="grid size-8 place-items-center rounded-md border border-line bg-surface/70 text-accent">
              <img src="/icons/soil.svg" alt="" className="size-4" />
            </span>
            <div className="leading-none">
              <div className="text-sm font-semibold tracking-tight text-foreground">SmartFarm</div>
              <div className="mt-1 text-[9px] uppercase tracking-[0.16em] text-muted">Field monitoring</div>
            </div>
          </Link>

          <nav className="flex items-center gap-1" aria-label="Primary navigation">
            {items.map((item) => {
              const active = isActive(pathname, item.href);
              if (item.submenu) {
                return (
                  <div key={item.label} className="relative" ref={popoverRef}>
                    <button
                      type="button"
                      onClick={() => setSoilOpen((open) => !open)}
                      aria-expanded={soilOpen}
                      className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition ${
                        active ? "bg-accent/10 text-accent" : "text-muted hover:bg-surface hover:text-foreground"
                      }`}
                    >
                      <img src={item.icon} alt="" className="size-4" />
                      {item.label}
                      <img src="/icons/chevron-down.svg" alt="" className={`size-3 transition-transform ${soilOpen ? "rotate-180" : ""}`} />
                    </button>
                    {soilOpen ? (
                      <div className="absolute left-0 top-[calc(100%+8px)] w-40 rounded-lg border border-line bg-surface p-1.5 shadow-2xl">
                        {item.submenu.map((sub) => (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={`flex items-center rounded-md px-3 py-2 text-xs transition ${
                              pathname === sub.href ? "bg-accent/10 text-accent" : "text-muted hover:bg-muted/10 hover:text-foreground"
                            }`}
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition ${
                    active ? "bg-accent/10 text-accent" : "text-muted hover:bg-surface hover:text-foreground"
                  }`}
                >
                  <img src={item.icon} alt="" className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden" aria-label="Mobile navigation">
        <div className="mx-auto grid h-16 max-w-xl grid-cols-5 px-2">
          {items.map((item) => {
            const active = item.submenu ? soilActive : isActive(pathname, item.href);
            if (item.submenu) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setSoilOpen(true)}
                  aria-expanded={soilOpen}
                  aria-label={item.label}
                  className={`relative flex flex-col items-center justify-center gap-1 transition ${active ? "text-accent" : "text-muted"}`}
                >
                  <span className={`grid size-9 place-items-center rounded-xl ${active ? "bg-accent/10" : ""}`}>
                    <img src={item.icon} alt="" className="size-5" />
                  </span>
                  <span className="sr-only">{item.label}</span>
                  {active ? <span className="absolute bottom-1 size-1 rounded-full bg-accent" /> : null}
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className={`relative flex flex-col items-center justify-center gap-1 transition ${active ? "text-accent" : "text-muted"}`}
              >
                <span className={`grid size-9 place-items-center rounded-xl ${active ? "bg-accent/10" : ""}`}>
                  <img src={item.icon} alt="" className="size-5" />
                </span>
                <span className="sr-only">{item.label}</span>
                {active ? <span className="absolute bottom-1 size-1 rounded-full bg-accent" /> : null}
              </Link>
            );
          })}
        </div>

        {soilOpen ? (
          <div className="border-t border-line bg-surface/95 px-3 pb-3 pt-2 shadow-2xl">
            <div className="mx-auto max-w-xl rounded-xl border border-line bg-background p-2">
              <div className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Soil</div>
              <div className="grid grid-cols-3 gap-1">
                {items[1].submenu?.map((sub) => (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    className={`rounded-lg px-3 py-2 text-center text-xs font-medium transition ${
                      pathname === sub.href ? "bg-accent/10 text-accent" : "text-muted hover:bg-muted/10 hover:text-foreground"
                    }`}
                  >
                    {sub.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </nav>
    </>
  );
}
