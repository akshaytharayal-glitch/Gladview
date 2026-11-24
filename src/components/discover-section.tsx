"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import AnimeCard from "./anime-card";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { MediaList } from "@/types/miruro-api";
import { useGetPopularAnime } from "@/query/get-popular-anime";
import { useGetTrendingAnime } from "@/query/get-trending-anime";
import { useGetUpcomingAnime } from "@/query/get-upcoming-anime";

export type DiscoverTab = "popular" | "trending" | "upcoming";

const TABS: { key: DiscoverTab; label: string; viewAll: string }[] = [
  { key: "popular", label: "Popular", viewAll: ROUTES.POPULAR },
  { key: "trending", label: "Trending", viewAll: ROUTES.TRENDING },
  { key: "upcoming", label: "Upcoming", viewAll: ROUTES.UPCOMING },
];

const titleOf = (a: MediaList) =>
  a.title?.english || a.title?.romaji || a.title?.native || "Untitled";
const posterOf = (a: MediaList) =>
  a.coverImage?.extraLarge || a.coverImage?.large || "";

const DiscoverSection = ({ className }: { className?: string }) => {
  const [tab, setTab] = React.useState<DiscoverTab>("popular");
  const scroller = React.useRef<HTMLDivElement>(null);

  const popular = useGetPopularAnime(1, 20);
  const trending = useGetTrendingAnime(1, 20);
  const upcoming = useGetUpcomingAnime(1, 20);

  React.useEffect(() => {
    scroller.current?.scrollTo({ left: 0 });
  }, [tab]);

  const active = { popular, trending, upcoming }[tab];

  const list: MediaList[] = (active.data?.results || []).slice(0, 18);

  const scrollBy = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-xl backdrop-blur-sm md:p-5",
        className,
      )}
    >
      <h2 className="sr-only">Discover anime</h2>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Discover anime"
          className="flex rounded-xl border border-white/10 bg-black/30 p-1"
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-semibold transition sm:px-4",
                tab === t.key
                  ? "bg-gradient-to-r from-amber-300 to-amber-600 text-slate-950 shadow"
                  : "text-slate-300 hover:text-amber-200",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={TABS.find((t) => t.key === tab)!.viewAll}
            className="mr-1 text-sm font-medium text-amber-300 hover:text-amber-200 hover:underline"
          >
            View all
          </Link>
          <button
            aria-label="Scroll left"
            onClick={() => scrollBy(-1)}
            className="rounded-full border border-white/20 p-2 text-white transition hover:bg-amber-400/20"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            aria-label="Scroll right"
            onClick={() => scrollBy(1)}
            className="rounded-full border border-white/20 p-2 text-white transition hover:bg-amber-400/20"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scroller}
        className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2"
      >
        {active.isLoading || !list.length
          ? Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[2/3] w-32 shrink-0 animate-pulse rounded-lg bg-slate-800 sm:w-36"
              />
            ))
          : list.map((anime) => {
              return (
                <div
                  key={`${tab}-${anime.id}`}
                  className="w-32 shrink-0 snap-start sm:w-36"
                >
                  <AnimeCard
                    title={titleOf(anime)}
                    poster={posterOf(anime)}
                    format={anime.format}
                    score={anime.averageScore}
                    href={`${ROUTES.ANIME_DETAILS}/${anime.id}`}
                  />
                </div>
              );
            })}
      </div>
    </div>
  );
};

export default DiscoverSection;
