"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, ListPlus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import {
  DEFAULT_LIST_TITLE,
  ListAnime,
  MAX_LIST_TITLE,
  useAnimeLists,
  useListMutations,
  useListsContaining,
} from "@/hooks/use-anime-lists";

/** "Add to list" popover: Watch Later + the user's own titled lists. */
const AddToListButton = ({ anime }: { anime: ListAnime }) => {
  const { data: lists, isLoading } = useAnimeLists();
  const { data: containing = [] } = useListsContaining(anime.id);
  const { createList, setAnimeInList } = useListMutations();
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const seededRef = useRef(false);

  // First time a user opens this, give them a ready-made "Watch Later" list.
  useEffect(() => {
    if (!lists || lists.length > 0 || seededRef.current) return;
    seededRef.current = true;
    void createList(DEFAULT_LIST_TITLE, true);
  }, [lists, createList]);

  const toggle = async (listId: string, listTitle: string) => {
    if (busy) return;
    setBusy(true);
    const isIn = containing.includes(listId);
    const ok = await setAnimeInList(listId, anime, !isIn);
    if (ok) {
      toast.success(isIn ? `Removed from ${listTitle}` : `Added to ${listTitle}`, {
        style: { background: "green" },
      });
    }
    setBusy(false);
  };

  const create = async () => {
    if (busy) return;
    setBusy(true);
    const rec = await createList(title);
    if (rec) {
      setTitle("");
      await setAnimeInList(rec.id, anime, true);
    }
    setBusy(false);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-10 items-center gap-2 rounded-md border border-amber-400/60 px-4 text-sm font-semibold text-amber-300 transition hover:bg-amber-400/15"
        >
          <ListPlus className="h-4 w-4" />
          Lists
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="z-[110] w-72 border border-white/10 bg-slate-950/90 p-3 backdrop-blur-xl"
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Save to a list
        </p>
        <div className="flex max-h-56 flex-col gap-1 overflow-y-auto">
          {isLoading && <p className="py-3 text-sm text-slate-400">Loading…</p>}
          {lists?.map((list) => {
            const isIn = containing.includes(list.id);
            return (
              <button
                key={list.id}
                type="button"
                onClick={() => toggle(list.id, list.title)}
                className={cn(
                  "flex items-center justify-between rounded-md px-3 py-2 text-left text-sm transition",
                  isIn
                    ? "bg-amber-400/15 text-amber-200"
                    : "text-slate-200 hover:bg-white/5",
                )}
              >
                <span className="truncate">{list.title}</span>
                {isIn && <Check className="h-4 w-4 shrink-0" />}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex gap-2 border-t border-white/10 pt-3">
          <Input
            value={title}
            maxLength={MAX_LIST_TITLE}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            placeholder="New list title"
            className="h-9"
          />
          <button
            type="button"
            aria-label="Create list"
            onClick={create}
            disabled={busy}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-r from-amber-300 to-amber-600 text-slate-950 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AddToListButton;
