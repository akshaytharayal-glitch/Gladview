"use client";

import React, { useEffect, useState } from "react";
import Container from "./container";
import AnimeCard from "./anime-card";
import { ROUTES } from "@/constants/routes";
import BlurFade from "./ui/blur-fade";
import { IAnime } from "@/types/anime";
import { History, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import useBookMarks, { WatchHistory } from "@/hooks/use-get-bookmark";
import { getGuestHistory, removeGuestProgress } from "@/lib/guest-history";
import { useAuthStore } from "@/store/auth-store";

type Props = {
  loading: boolean;
};

interface WatchedAnime extends IAnime {
  episode: WatchHistory | string;
  // Signed-in users only: what to clear in PocketBase when removing.
  bookmarkId?: string;
  watchedIds?: string[];
}

const ContinueWatching = (props: Props) => {
  const [anime, setAnime] = useState<WatchedAnime[] | null>(null);

  const { auth } = useAuthStore();
  const { bookmarks, clearWatchHistory } = useBookMarks({
    page: 1,
    per_page: 14,
    status: "watching",
  });
  // Two-step delete: first click arms the button, second click removes.
  const [armedId, setArmedId] = useState<string | null>(null);

  useEffect(() => {
    if (!armedId) return;
    const t = setTimeout(() => setArmedId(null), 3000);
    return () => clearTimeout(t);
  }, [armedId]);

  const removeFromHistory = async (item: WatchedAnime) => {
    const key = String(item.id);
    if (armedId !== key) {
      setArmedId(key);
      return;
    }
    setArmedId(null);

    if (!auth) {
      removeGuestProgress(key);
    } else if (item.bookmarkId) {
      const ok = await clearWatchHistory(item.bookmarkId, item.watchedIds || []);
      if (!ok) {
        toast.error("Could not remove it. Please try again.", {
          style: { background: "red" },
        });
        return;
      }
    }

    // Update the screen straight away; a signed-in refetch confirms it.
    setAnime((prev) => {
      const next = (prev || []).filter((a) => String(a.id) !== key);
      return next.length ? next : null;
    });
    toast.success("Removed from watch history");
  };

  useEffect(() => {
    if (!auth) {
      const animes = getGuestHistory()
        .slice(0, 14)
        .map((h) => ({
          id: h.animeId,
          name: h.title,
          poster: h.poster,
          episode: {
            id: h.animeId,
            current: h.current,
            timestamp: h.duration,
            episodeId: h.episodeId,
            episodeNumber: h.episodeNumber,
            created: new Date(h.updatedAt).toISOString(),
          } as WatchHistory,
        }));
      setAnime(animes.length ? (animes as WatchedAnime[]) : null);
    } else {
      if (bookmarks && bookmarks.length > 0) {
        const animes = bookmarks
          .map((anime) => ({
            id: anime.animeId,
            bookmarkId: anime.id,
            watchedIds: (anime.expand?.watchHistory || []).map((w) => w.id),
            name: anime.animeTitle,
            poster: anime.thumbnail,
            episode: anime.expand?.watchHistory
              ? anime.expand.watchHistory.sort(
                  (a, b) => b.episodeNumber - a.episodeNumber,
                )[0]
              : null,
          }))
          .filter((item) => !!item.episode);

        setAnime(animes.length > 0 ? (animes as WatchedAnime[]) : null);
      } else {
        setAnime(null);
      }
    }
  }, [auth, bookmarks]);

  if (props.loading) return <LoadingSkeleton />;

  if ((!anime || !anime.length) && !props.loading) return <></>;

  return (
    <Container className="flex flex-col gap-5 py-10 items-center lg:items-start">
      <div className="flex items-center gap-2">
        <History />
        <h2 className="text-2xl font-bold">Continue Watching</h2>
      </div>
      <div className="grid lg:grid-cols-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 w-full gap-5 content-center">
        {anime?.map(
          (ani, idx) =>
            ani.episode && (
              <BlurFade key={ani.id} delay={idx * 0.05} inView>
                <div className="group/cw relative w-full">
                  <AnimeCard
                    title={ani.name}
                    poster={ani.poster}
                    className="self-center justify-self-center"
                    href={`${ROUTES.WATCH}?anime=${ani.id}&ep=${typeof ani.episode !== "string" ? ani.episode.episodeNumber : 1}`}
                    watchDetail={
                      typeof ani.episode !== "string" ? ani.episode : null
                    }
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeFromHistory(ani);
                    }}
                    aria-label={`Remove ${ani.name} from watch history`}
                    title={
                      armedId === String(ani.id)
                        ? "Click again to remove"
                        : "Remove from watch history"
                    }
                    className={cn(
                      "absolute left-1.5 top-1.5 z-10 flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold text-white shadow backdrop-blur-sm transition",
                      armedId === String(ani.id)
                        ? "bg-red-600 opacity-100"
                        : "bg-black/70 opacity-0 hover:bg-red-600/90 focus-visible:opacity-100 group-hover/cw:opacity-100 pointer-coarse:opacity-100",
                    )}
                  >
                    <X className="h-3.5 w-3.5" />
                    {armedId === String(ani.id) && <span>Remove?</span>}
                  </button>
                </div>
              </BlurFade>
            ),
        )}
      </div>
    </Container>
  );
};

const LoadingSkeleton = () => {
  return (
    <Container className="flex flex-col gap-5 py-10 items-center lg:items-start lg:mt-[10.125rem] z-20 ">
      <div className="h-10 w-[15.625rem] animate-pulse bg-slate-700"></div>
      <div className="grid lg:grid-cols-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 w-full gap-5 content-center">
        {[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1].map((_, idx) => {
          return (
            <div
              key={idx}
              className="rounded-xl h-[15.625rem] min-w-[10.625rem] max-w-[12.625rem] md:h-[18.75rem] md:max-w-[12.5rem] animate-pulse bg-slate-700"
            ></div>
          );
        })}
      </div>
    </Container>
  );
};

export default ContinueWatching;
