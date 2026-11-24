"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Play } from "lucide-react";

import Container from "./container";
import { ROUTES } from "@/constants/routes";
import { timeAgo } from "@/lib/utils";
import { useGetRecentAnime } from "@/query/get-recent-anime";
import { MediaList } from "@/types/miruro-api";

const titleOf = (a: MediaList) =>
  a.title?.english || a.title?.romaji || a.title?.native || "Untitled";
const posterOf = (a: MediaList) =>
  a.coverImage?.extraLarge || a.coverImage?.large || "";

const RecentSection = () => {
  const { data, isLoading } = useGetRecentAnime(1, 20);
  const scroller = React.useRef<HTMLDivElement>(null);

  const list = (data?.results || []).slice(0, 16);

  const scrollBy = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <Container className="py-6">
      <section
        aria-labelledby="recent-heading"
        className="relative overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-br from-amber-500/[0.12] via-white/[0.02] to-rose-500/[0.08] p-5 shadow-[0_0_60px_-20px_rgba(212,165,55,0.45)] md:p-7"
      >
        {/* decorative glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl"
        />

        <div className="relative mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-amber-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
              </span>
              New episodes
            </span>
            <h2
              id="recent-heading"
              className="bg-gradient-to-r from-white via-amber-100 to-amber-400 bg-clip-text text-3xl font-extrabold text-transparent md:text-4xl"
            >
              Recently Added
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={ROUTES.RECENT}
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
          className="no-scrollbar relative -mx-1 flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 pb-3 pt-1"
        >
          {isLoading || !list.length
            ? Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[2/3] w-40 shrink-0 animate-pulse rounded-xl bg-slate-800 sm:w-48"
                />
              ))
            : list.map((anime) => {
                const ep = Math.max(1, anime.latest_episode);
                return (
                  <Link
                    key={anime.id}
                    href={`${ROUTES.WATCH}?anime=${anime.id}&ep=${ep}`}
                    className="group w-40 shrink-0 snap-start sm:w-48"
                  >
                    <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-slate-800 ring-1 ring-white/15 transition duration-300 group-hover:-translate-y-1 group-hover:ring-amber-400/80 group-hover:shadow-[0_12px_30px_-8px_rgba(212,165,55,0.55)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={posterOf(anime)}
                        alt={titleOf(anime)}
                        loading="lazy"
                        draggable={false}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

                      <span className="absolute left-2 top-2 rounded-md bg-gradient-to-r from-amber-300 to-amber-600 px-2 py-1 text-xs font-extrabold text-slate-950 shadow">
                        EP {ep}
                      </span>
                      {!!anime.airedAt && (
                        <span className="absolute left-2 top-10 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300 backdrop-blur-sm">
                          {timeAgo(anime.airedAt)}
                        </span>
                      )}
                      {!!anime.averageScore && (
                        <span className="absolute right-2 top-2 rounded-md bg-black/80 px-1.5 py-1 text-[11px] font-semibold text-amber-300 backdrop-blur-sm">
                          ★ {(anime.averageScore / 10).toFixed(1)}
                        </span>
                      )}

                      {/* play button appears on hover */}
                      <span className="absolute inset-0 flex items-center justify-center opacity-0 transition duration-300 group-hover:opacity-100">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-400/90 text-slate-950 shadow-lg">
                          <Play className="h-5 w-5 fill-current" />
                        </span>
                      </span>

                      <div className="absolute inset-x-0 bottom-0 p-2.5 text-[11px] font-medium text-slate-200">
                        {[anime.format, anime.genres?.[0]]
                          .filter(Boolean)
                          .join(" • ")}
                      </div>
                    </div>
                    <h3 className="mt-2.5 line-clamp-2 text-sm font-semibold leading-5 text-slate-100 transition-colors group-hover:text-amber-300">
                      {titleOf(anime)}
                    </h3>
                  </Link>
                );
              })}
        </div>
      </section>
    </Container>
  );
};

export default RecentSection;
