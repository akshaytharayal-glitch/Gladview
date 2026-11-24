"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, PanInfo, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

import Container from "./container";
import { ROUTES } from "@/constants/routes";
import { MediaList } from "@/types/miruro-api";
import { TopPeriod, useGetTopAnime } from "@/query/get-top-anime";
import { cn } from "@/lib/utils";

const PERIODS: { key: TopPeriod; label: string; hint: string }[] = [
  { key: "day", label: "Day", hint: "Trending right now" },
  { key: "week", label: "Week", hint: "Most popular airing" },
  { key: "month", label: "Month", hint: "Highest rated airing" },
];

const AUTO_MS = 5000;
const SWIPE_DISTANCE = 100;
const SWIPE_VELOCITY = 500;

const titleOf = (a: MediaList) =>
  a.title?.english || a.title?.romaji || a.title?.native || "Untitled";
const posterOf = (a: MediaList) =>
  a.coverImage?.extraLarge || a.coverImage?.large || "";

const TopAnimeSection = () => {
  const [period, setPeriod] = React.useState<TopPeriod>("week");
  const { data: list = [], isLoading } = useGetTopAnime(period);
  const [current, setCurrent] = React.useState(0);
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const reduceMotion = useReducedMotion();

  const paused = hovered || pressed || focused;

  React.useEffect(() => setCurrent(0), [period]);

  const go = React.useCallback(
    (next: number) => setCurrent(Math.min(Math.max(next, 0), list.length - 1)),
    [list.length],
  );

  // Slides on its own; hover, touch or keyboard focus pauses it, and the
  // timer restarts after every change (including manual ones).
  React.useEffect(() => {
    if (paused || reduceMotion || list.length < 2) return;
    const t = setTimeout(
      () => setCurrent((c) => (c + 1) % list.length),
      AUTO_MS,
    );
    return () => clearTimeout(t);
  }, [current, paused, reduceMotion, list.length, period]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") go(current + 1);
    if (e.key === "ArrowLeft") go(current - 1);
  };

  const activeAnime = list[current];
  const backdrop = activeAnime?.bannerImage || (activeAnime ? posterOf(activeAnime) : "");
  const fill = list.length > 1 ? (current / (list.length - 1)) * 100 : 0;

  return (
    <div className="relative isolate overflow-hidden">
      {/* Background: the current anime's art, blurred, crossfading as it slides */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <AnimatePresence>
          {backdrop && (
            <motion.img
              key={activeAnime.id}
              src={backdrop}
              alt=""
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.18 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9 }}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          )}
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-[#14100a] via-transparent to-[#14100a]" />
      </div>

      <Container className="flex flex-col gap-6 py-10">
        <div className="flex flex-wrap items-center gap-4">
          <h2 className="text-2xl font-bold text-white">Top Anime</h2>
          <div className="relative flex rounded-lg border border-white/10 bg-slate-900/80 p-1">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={cn(
                  "relative z-10 px-4 py-1.5 text-sm font-semibold transition-colors",
                  period === p.key
                    ? "text-slate-950"
                    : "text-slate-300 hover:text-amber-200",
                )}
              >
                {period === p.key && (
                  <motion.span
                    layoutId="top-anime-tab"
                    className="absolute inset-0 -z-10 rounded-md bg-gradient-to-r from-amber-300 to-amber-600"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                {p.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-400">
            {PERIODS.find((p) => p.key === period)?.hint}
          </span>
        </div>

        {isLoading || !list.length ? (
          <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
            <div className="mx-auto aspect-[2/3] w-72 animate-pulse rounded-2xl bg-slate-800 lg:w-full" />
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-800" />
              ))}
            </div>
          </div>
        ) : (
          <div
              className="grid items-start gap-8 lg:grid-cols-[22rem_1fr]"
              tabIndex={0}
              onKeyDown={onKeyDown}
              onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
              onPointerLeave={() => setHovered(false)}
              onPointerDown={() => setPressed(true)}
              onPointerUp={() => setPressed(false)}
              onPointerCancel={() => setPressed(false)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            >
              <Deck list={list} current={current} go={go} />
              <RankList list={list} current={current} go={go} />
            </div>
        )}
      </Container>
    </div>
  );
};

const Deck = ({
  list,
  current,
  go,
}: {
  list: MediaList[];
  current: number;
  go: (n: number) => void;
}) => {
  const router = useRouter();
  // A swipe must never open the anime page: only a real click does.
  const dragged = React.useRef(false);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const { offset, velocity } = info;
    if (offset.x < -SWIPE_DISTANCE || velocity.x < -SWIPE_VELOCITY) {
      go(current + 1); // fling left: card leaves, next one rises from behind
    } else if (offset.x > SWIPE_DISTANCE || velocity.x > SWIPE_VELOCITY) {
      go(current - 1); // drag right: previous card flies back in
    }
  };

  return (
    <div className="mx-auto flex w-72 flex-col items-center gap-4 sm:w-80 lg:w-full">
      <div className="relative aspect-[2/3] w-full select-none">
        {list.map((anime, i) => {
          const d = i - current;
          const isFront = d === 0;
          const exited = d < 0;
          const visible = d >= -1 && d <= 2;
          return (
            <motion.div
              key={anime.id}
              drag={isFront ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onPointerDown={() => {
                dragged.current = false;
              }}
              onDragStart={() => {
                dragged.current = true;
              }}
              onDragEnd={isFront ? onDragEnd : undefined}
              onClick={
                isFront
                  ? () => {
                      if (dragged.current) {
                        dragged.current = false;
                        return;
                      }
                      router.push(`${ROUTES.ANIME_DETAILS}/${anime.id}`);
                    }
                  : undefined
              }
              initial={false}
              animate={{
                x: exited ? "-120%" : 0,
                rotate: exited ? -16 : isFront ? 0 : d * 2.5,
                scale: exited ? 0.95 : 1 - Math.min(d, 3) * 0.06,
                y: exited ? 0 : Math.min(d, 3) * 16,
                opacity: !visible ? 0 : exited ? 0 : 1 - Math.max(d - 1, 0) * 0.35,
              }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              whileDrag={{ scale: 1.03, rotate: 2 }}
              style={{ zIndex: list.length - Math.abs(d), pointerEvents: isFront ? "auto" : "none" }}
              className={cn(
                "absolute inset-0 overflow-hidden rounded-2xl bg-slate-900 shadow-2xl ring-1 ring-amber-400/30",
                isFront && "cursor-grab active:cursor-grabbing",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={posterOf(anime)}
                alt={titleOf(anime)}
                draggable={false}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <span className="absolute left-4 top-3 bg-gradient-to-b from-white to-amber-400 bg-clip-text text-6xl font-black text-transparent drop-shadow">
                {i + 1}
              </span>
              {!!anime.averageScore && (
                <span className="absolute right-3 top-3 rounded-md bg-black/60 px-2 py-1 text-xs font-bold text-amber-300 backdrop-blur-sm">
                  ★ {(anime.averageScore / 10).toFixed(1)}
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 space-y-1 p-4">
                <h3 className="line-clamp-2 text-xl font-extrabold leading-tight text-white">
                  {titleOf(anime)}
                </h3>
                <p className="text-xs text-slate-300">
                  {[anime.format, anime.episodes ? `${anime.episodes} eps` : null, anime.genres?.[0]]
                    .filter(Boolean)
                    .join(" • ")}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => go(current - 1)}
          disabled={current <= 0}
          aria-label="Previous"
          className="rounded-full border border-amber-400/50 p-2 text-amber-300 transition hover:bg-amber-400/20 disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="min-w-[4rem] text-center text-sm text-slate-300">
          {current + 1} / {list.length}
        </span>
        <button
          onClick={() => go(current + 1)}
          disabled={current >= list.length - 1}
          aria-label="Next"
          className="rounded-full border border-amber-400/50 p-2 text-amber-300 transition hover:bg-amber-400/20 disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <p className="text-xs text-slate-400">Swipe left for next · drag right to go back</p>
    </div>
  );
};

const RankList = ({
  list,
  current,
  go,
}: {
  list: MediaList[];
  current: number;
  go: (n: number) => void;
}) => (
  <ol className="flex flex-col gap-2">
    {list.map((anime, i) => {
      const active = i === current;
      return (
        <li key={anime.id}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => go(i)}
            onKeyDown={(e) => e.key === "Enter" && go(i)}
            className={cn(
              "group flex cursor-pointer items-center gap-4 rounded-xl border p-2 pr-4 transition",
              active
                ? "border-amber-400/60 bg-amber-400/10"
                : "border-transparent hover:border-white/10 hover:bg-white/5",
            )}
          >
            <span
              className={cn(
                "w-8 text-center text-2xl font-black",
                i === 0 && "bg-gradient-to-b from-white to-amber-400 bg-clip-text text-transparent",
                i === 1 && "text-slate-200",
                i === 2 && "text-amber-600",
                i > 2 && "text-slate-400",
              )}
            >
              {i + 1}
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={posterOf(anime)}
              alt=""
              className="h-16 w-11 shrink-0 rounded-md object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 font-medium text-slate-100">{titleOf(anime)}</p>
              <p className="text-xs text-slate-400">
                {[anime.format, anime.episodes ? `${anime.episodes} eps` : null]
                  .filter(Boolean)
                  .join(" • ")}
              </p>
            </div>
            {!!anime.averageScore && (
              <span className="text-sm font-semibold text-amber-300">
                ★ {(anime.averageScore / 10).toFixed(1)}
              </span>
            )}
            <Link
              href={`${ROUTES.ANIME_DETAILS}/${anime.id}`}
              onClick={(e) => e.stopPropagation()}
              className="rounded-md bg-gradient-to-r from-amber-300 to-amber-600 px-3 py-1 text-xs font-bold text-slate-950 opacity-0 transition group-hover:opacity-100 max-sm:opacity-100"
            >
              Open
            </Link>
          </div>
        </li>
      );
    })}
  </ol>
);

export default TopAnimeSection;
