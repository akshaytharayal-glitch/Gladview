"use client";

import React from "react";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";

import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { useGetAnimeSchedule } from "@/query/get-anime-schedule";

type Direction = "right" | "left";

const pad = (n: number) => String(n).padStart(2, "0");
const dateKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const SPEED_PX_PER_SEC = 38;
const MAX_ITEMS = 16;
const DRAG_THRESHOLD = 6;

const countdown = (ms: number) => {
  if (ms <= 0) return "Airing now";
  const mins = Math.floor(ms / 60000);
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d > 0) return `in ${d}d ${h}h`;
  if (h > 0) return `in ${h}h ${m}m`;
  return `in ${Math.max(m, 1)}m`;
};

const dayLabel = (ts: number, now: number) => {
  const a = new Date(ts);
  const b = new Date(now);
  if (dateKey(a) === dateKey(b)) return "Today";
  b.setDate(b.getDate() + 1);
  return dateKey(a) === dateKey(b)
    ? "Tomorrow"
    : a.toLocaleDateString([], { weekday: "short" });
};

const UpcomingReleases = ({
  direction = "right",
  className,
}: {
  // "right": cards glide from the left towards the right. "left" reverses it.
  direction?: Direction;
  className?: string;
}) => {
  const [now, setNow] = React.useState(() => Date.now());
  const reduceMotion = useReducedMotion();

  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const todayQ = useGetAnimeSchedule(dateKey(today));
  const tomorrowQ = useGetAnimeSchedule(dateKey(tomorrow));
  const isLoading = todayQ.isLoading || tomorrowQ.isLoading;

  const items = React.useMemo(() => {
    const all = [
      ...(todayQ.data?.scheduledAnimes || []),
      ...(tomorrowQ.data?.scheduledAnimes || []),
    ];
    const seen = new Set<string>();
    return all
      .filter((a) => a.airingTimestamp >= now - 15 * 60_000)
      .sort((a, b) => a.airingTimestamp - b.airingTimestamp)
      .filter((a) => {
        const k = `${a.id}-${a.episode}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .slice(0, MAX_ITEMS);
  }, [todayQ.data, tomorrowQ.data, now]);

  // ---- motion -----------------------------------------------------------
  // The track holds the list twice. `progress` (0..1) is how far through one
  // copy we are; moving by exactly one copy width loops with no visible jump.
  // Position lives in refs and is written straight to the DOM every frame, so
  // React never re-renders while it slides.
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const copyRef = React.useRef<HTMLDivElement>(null);
  const barRef = React.useRef<HTMLInputElement>(null);

  const progress = React.useRef(0);
  const hovered = React.useRef(false);
  const holding = React.useRef(false); // pointer down on the strip or the bar
  const dragMoved = React.useRef(0);

  const apply = React.useCallback(() => {
    const copyW = copyRef.current?.offsetWidth || 0;
    if (!copyW || !trackRef.current) return;
    // progress 0 -> track at -copyW, progress 1 -> track at 0 (moves rightwards)
    const x = (progress.current - 1) * copyW;
    trackRef.current.style.transform = `translate3d(${x}px,0,0)`;
    const bar = barRef.current;
    if (bar) {
      bar.value = String(Math.round(progress.current * 1000));
      bar.style.setProperty("--fill", `${progress.current * 100}%`);
    }
  }, []);

  const wrap = (p: number) => ((p % 1) + 1) % 1;

  React.useEffect(() => {
    if (!items.length) return;
    let raf = 0;
    let last = performance.now();

    const tick = (t: number) => {
      const dt = Math.min((t - last) / 1000, 0.1);
      last = t;
      const copyW = copyRef.current?.offsetWidth || 0;
      const running =
        !reduceMotion &&
        !hovered.current &&
        !holding.current &&
        !document.hidden;
      if (copyW && running) {
        const sign = direction === "right" ? 1 : -1;
        progress.current = wrap(
          progress.current + (sign * SPEED_PX_PER_SEC * dt) / copyW,
        );
      }
      apply();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [items.length, direction, reduceMotion, apply]);

  // Drag the strip itself to pan it.
  const dragStart = React.useRef<{ x: number; p: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    holding.current = true;
    dragMoved.current = 0;
    dragStart.current = { x: e.clientX, p: progress.current };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const start = dragStart.current;
    const copyW = copyRef.current?.offsetWidth || 0;
    if (!start || !copyW) return;
    const dx = e.clientX - start.x;
    dragMoved.current = Math.max(dragMoved.current, Math.abs(dx));
    if (dragMoved.current > DRAG_THRESHOLD) {
      progress.current = wrap(start.p + dx / copyW);
    }
  };
  const release = () => {
    holding.current = false;
    dragStart.current = null;
  };
  // A drag must not open the anime page it started on.
  const onClickCapture = (e: React.MouseEvent) => {
    if (dragMoved.current > DRAG_THRESHOLD) {
      e.preventDefault();
      e.stopPropagation();
      dragMoved.current = 0;
    }
  };

  const renderCard = (a: (typeof items)[number], copy: boolean) => (
    <Link
      key={`${copy ? "b" : "a"}-${a.id}-${a.episode}`}
      href={`${ROUTES.ANIME_DETAILS}/${a.id}`}
      tabIndex={copy ? -1 : undefined}
      draggable={false}
      className="group/card flex w-[19rem] shrink-0 items-center gap-3 rounded-xl border border-white/5 bg-black/30 p-2 pr-3 transition hover:border-amber-400/50 hover:bg-amber-400/10"
    >
      {a.poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={a.poster}
          alt=""
          loading="lazy"
          draggable={false}
          className="h-20 w-14 shrink-0 rounded-md object-cover"
        />
      ) : (
        <div className="h-20 w-14 shrink-0 rounded-md bg-slate-800" />
      )}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-semibold text-slate-100 group-hover/card:text-amber-200">
          {a.name}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">
          <span className="font-bold text-amber-300">Ep {a.episode}</span>
          {" · "}
          {dayLabel(a.airingTimestamp, now)}{" "}
          {new Date(a.airingTimestamp).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
        <span className="mt-1.5 inline-block rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
          {countdown(a.airingTimestamp - now)}
        </span>
      </div>
    </Link>
  );

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-xl backdrop-blur-sm md:p-5",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-bold text-white">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />
          </span>
          Airing Soon
        </h2>
        <Link
          href={ROUTES.SCHEDULE}
          className="shrink-0 text-xs font-medium text-amber-300 hover:text-amber-200 hover:underline"
        >
          Full schedule
        </Link>
      </div>

      {isLoading ? (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[6.5rem] w-[19rem] shrink-0 animate-pulse rounded-xl bg-slate-800/70"
            />
          ))}
        </div>
      ) : !items.length ? (
        <p className="py-8 text-center text-sm text-slate-400">
          No upcoming episodes found right now.
        </p>
      ) : (
        <>
          <div
            ref={viewportRef}
            className="relative cursor-grab select-none overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_2rem,black_calc(100%-2rem),transparent)] active:cursor-grabbing"
            style={{ touchAction: "pan-y" }}
            onPointerEnter={(e) => {
              if (e.pointerType === "mouse") hovered.current = true;
            }}
            onPointerLeave={() => {
              hovered.current = false;
              release();
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={release}
            onPointerCancel={release}
            onClickCapture={onClickCapture}
            aria-label="Upcoming episodes. Drag to move, hover to pause."
          >
            <div
              ref={trackRef}
              className="flex w-max will-change-transform"
              style={{ transform: "translate3d(-50%,0,0)" }}
            >
              <div ref={copyRef} className="flex gap-3 pr-3">
                {items.map((a) => renderCard(a, false))}
              </div>
              {/* Second copy makes the loop seamless; hidden from screen readers. */}
              <div className="flex gap-3 pr-3" aria-hidden>
                {items.map((a) => renderCard(a, true))}
              </div>
            </div>
          </div>

          {/* Quiet drag bar: no labels, faint until hovered. */}
          <input
            ref={barRef}
            type="range"
            min={0}
            max={1000}
            step={1}
            defaultValue={0}
            aria-label="Move through upcoming episodes"
            className="quiet-bar mt-3"
            onPointerDown={() => {
              holding.current = true;
            }}
            onPointerUp={() => {
              holding.current = false;
            }}
            onPointerCancel={() => {
              holding.current = false;
            }}
            onFocus={() => {
              holding.current = true;
            }}
            onBlur={() => {
              holding.current = false;
            }}
            onInput={(e) => {
              progress.current = Number(e.currentTarget.value) / 1000;
              apply();
            }}
          />
        </>
      )}
    </div>
  );
};

export default UpcomingReleases;
