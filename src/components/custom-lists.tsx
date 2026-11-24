"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { pb } from "@/lib/pocketbase";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import AnimeCard from "./anime-card";
import { Input } from "./ui/input";
import { Bookmark, WatchHistory } from "@/hooks/use-get-bookmark";
import {
  MAX_LIST_TITLE,
  useAnimeLists,
  useListItems,
  useListMutations,
} from "@/hooks/use-anime-lists";

/** Latest watched episode per anime, so each list can show watch progress. */
function useProgress(userId: string, animeIds: string[]) {
  return useQuery({
    queryKey: ["LIST_PROGRESS", userId, animeIds.join(",")],
    enabled: animeIds.length > 0,
    queryFn: async () => {
      const params: Record<string, string> = { uid: userId };
      const ors = animeIds.map((id, i) => {
        params[`a${i}`] = id;
        return `animeId = {:a${i}}`;
      });
      const marks = await pb.collection<Bookmark>("bookmarks").getFullList({
        filter: pb.filter(`user = {:uid} && (${ors.join(" || ")})`, params),
        expand: "watchHistory",
        requestKey: null,
      });
      const map: Record<string, WatchHistory | null> = {};
      for (const m of marks) {
        const hist = m.expand?.watchHistory;
        map[m.animeId] = hist?.length
          ? [...hist].sort((a, b) => b.episodeNumber - a.episodeNumber)[0]
          : null;
      }
      return map;
    },
  });
}

const CustomLists = ({
  userId,
  isOwner,
}: {
  userId: string;
  isOwner: boolean;
}) => {
  const { data: lists, isLoading } = useAnimeLists(userId);
  const { createList, renameList, deleteList, setAnimeInList } =
    useListMutations();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    if (lists?.length && !lists.some((l) => l.id === activeId)) {
      setActiveId(lists[0].id);
    }
  }, [lists, activeId]);

  const active = lists?.find((l) => l.id === activeId);
  const { data: itemsPage, isLoading: itemsLoading } = useListItems(activeId ?? undefined);
  const items = useMemo(() => itemsPage?.items ?? [], [itemsPage]);
  const { data: progress } = useProgress(
    userId,
    items.map((i) => i.animeId),
  );

  const startedCount = items.filter((i) => progress?.[i.animeId]).length;

  if (isLoading) {
    return <div className="mt-6 h-24 animate-pulse rounded-xl bg-slate-800/80" />;
  }

  return (
    <div className="mt-2 flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        {lists?.map((list) => (
          <button
            key={list.id}
            type="button"
            onClick={() => {
              setActiveId(list.id);
              setEditing(false);
            }}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition",
              list.id === activeId
                ? "border-amber-400 bg-gradient-to-r from-amber-300 to-amber-600 text-slate-950"
                : "border-white/15 text-slate-300 hover:border-amber-400/60",
            )}
          >
            {list.title}
          </button>
        ))}
        {isOwner && (
          <div className="flex items-center gap-1">
            <Input
              value={newTitle}
              maxLength={MAX_LIST_TITLE}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  const rec = await createList(newTitle);
                  if (rec) {
                    setNewTitle("");
                    setActiveId(rec.id);
                  }
                }
              }}
              placeholder="New list title"
              className="h-9 w-40"
            />
            <button
              type="button"
              aria-label="Create list"
              onClick={async () => {
                const rec = await createList(newTitle);
                if (rec) {
                  setNewTitle("");
                  setActiveId(rec.id);
                }
              }}
              className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-r from-amber-300 to-amber-600 text-slate-950"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {!lists?.length && (
        <p className="py-10 text-center text-gray-400">
          {isOwner
            ? "No lists yet. Create one above, or use the “Lists” button on any anime page."
            : "No lists yet."}
        </p>
      )}

      {active && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            {editing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editTitle}
                  maxLength={MAX_LIST_TITLE}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="h-9 w-52"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (await renameList(active.id, editTitle)) setEditing(false);
                  }}
                  className="rounded-md bg-amber-400 px-3 py-1.5 text-sm font-semibold text-slate-950"
                >
                  Save
                </button>
                <button type="button" aria-label="Cancel" onClick={() => setEditing(false)}>
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-bold text-white">{active.title}</h3>
                <p className="text-xs text-slate-400">
                  {items.length} anime · {startedCount} started
                </p>
              </div>
            )}
            {isOwner && !editing && (
              <div className="flex items-center gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setEditTitle(active.title);
                    setEditing(true);
                  }}
                  className="flex items-center gap-1 text-slate-300 hover:text-amber-300"
                >
                  <Pencil className="h-4 w-4" /> Rename
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete "${active.title}"? The anime stay in your library.`)) {
                      void deleteList(active.id);
                    }
                  }}
                  className="flex items-center gap-1 text-slate-300 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            )}
          </div>

          {itemsLoading ? (
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-slate-800/80" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-gray-400">
              This list is empty. Add anime with the “Lists” button on an anime page.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
              {items.map((item) => {
                const last = progress?.[item.animeId] ?? null;
                const href = last
                  ? `${ROUTES.WATCH}?anime=${item.animeId}&ep=${last.episodeNumber}`
                  : `${ROUTES.ANIME_DETAILS}/${item.animeId}`;
                return (
                  <div key={item.id} className="relative">
                    <AnimeCard
                      displayDetails
                      poster={item.thumbnail}
                      title={item.animeTitle}
                      href={href}
                      watchDetail={last}
                    />
                    {isOwner && (
                      <button
                        type="button"
                        aria-label="Remove from list"
                        onClick={() =>
                          setAnimeInList(
                            active.id,
                            { id: item.animeId, title: item.animeTitle, poster: item.thumbnail },
                            false,
                          )
                        }
                        className="absolute left-1.5 top-1.5 z-10 rounded-full bg-black/70 p-1 text-slate-200 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CustomLists;
