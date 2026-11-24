import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { pb } from "@/lib/pocketbase";
import { useAuthStore } from "@/store/auth-store";

export const ANIME_LISTS_KEY = "ANIME_LISTS";
export const LIST_ITEMS_KEY = "LIST_ITEMS";
export const ANIME_IN_LISTS_KEY = "ANIME_IN_LISTS";

export const DEFAULT_LIST_TITLE = "Watch Later";
export const MAX_LIST_TITLE = 40;

export type AnimeList = {
  id: string;
  user: string;
  title: string;
  created: string;
};

export type ListItem = {
  id: string;
  list: string;
  user: string;
  animeId: string;
  animeTitle: string;
  thumbnail: string;
  created: string;
};

export type ListAnime = { id: string; title: string; poster: string };

/** Lists owned by `userId` (defaults to the logged-in user). */
export function useAnimeLists(userId?: string) {
  const { auth } = useAuthStore();
  const uid = userId || auth?.id;
  return useQuery({
    queryKey: [ANIME_LISTS_KEY, uid],
    enabled: !!uid,
    queryFn: () =>
      pb.collection<AnimeList>("anime_lists").getFullList({
        filter: pb.filter("user = {:uid}", { uid }),
        sort: "created",
        requestKey: null,
      }),
  });
}

export function useListItems(listId?: string) {
  return useQuery({
    queryKey: [LIST_ITEMS_KEY, listId],
    enabled: !!listId,
    queryFn: () =>
      pb.collection<ListItem>("list_items").getList(1, 200, {
        filter: pb.filter("list = {:listId}", { listId }),
        sort: "-created",
        requestKey: null,
      }),
  });
}

/** Ids of the logged-in user's lists that already contain this anime. */
export function useListsContaining(animeId?: string) {
  const { auth } = useAuthStore();
  return useQuery({
    queryKey: [ANIME_IN_LISTS_KEY, auth?.id, animeId],
    enabled: !!auth?.id && !!animeId,
    queryFn: async () => {
      const items = await pb.collection<ListItem>("list_items").getFullList({
        filter: pb.filter("user = {:uid} && animeId = {:animeId}", {
          uid: auth?.id,
          animeId,
        }),
        requestKey: null,
      });
      return items.map((i) => i.list);
    },
  });
}

export function useListMutations() {
  const { auth } = useAuthStore();
  const queryClient = useQueryClient();

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [ANIME_LISTS_KEY] });
    queryClient.invalidateQueries({ queryKey: [LIST_ITEMS_KEY] });
    queryClient.invalidateQueries({ queryKey: [ANIME_IN_LISTS_KEY] });
  }, [queryClient]);

  const createList = useCallback(
    async (rawTitle: string, silent = false): Promise<AnimeList | null> => {
      const title = rawTitle.trim().slice(0, MAX_LIST_TITLE);
      if (!auth?.id) return null;
      if (!title) {
        toast.error("Give your list a title", { style: { background: "red" } });
        return null;
      }
      try {
        const rec = await pb
          .collection<AnimeList>("anime_lists")
          .create({ user: auth.id, title }, { requestKey: null });
        if (!silent) {
          toast.success(`List "${title}" created`, {
            style: { background: "green" },
          });
        }
        refresh();
        return rec;
      } catch (e) {
        console.error("createList error:", e);
        toast.error("Couldn't create the list. Please try again.", {
          style: { background: "red" },
        });
        return null;
      }
    },
    [auth?.id, refresh],
  );

  const renameList = useCallback(
    async (id: string, rawTitle: string) => {
      const title = rawTitle.trim().slice(0, MAX_LIST_TITLE);
      if (!title) return false;
      try {
        await pb
          .collection("anime_lists")
          .update(id, { title }, { requestKey: null });
        refresh();
        return true;
      } catch (e) {
        console.error("renameList error:", e);
        toast.error("Couldn't rename the list", {
          style: { background: "red" },
        });
        return false;
      }
    },
    [refresh],
  );

  const deleteList = useCallback(
    async (id: string) => {
      try {
        await pb.collection("anime_lists").delete(id, { requestKey: null });
        toast.success("List deleted", { style: { background: "green" } });
        refresh();
        return true;
      } catch (e) {
        console.error("deleteList error:", e);
        toast.error("Couldn't delete the list", {
          style: { background: "red" },
        });
        return false;
      }
    },
    [refresh],
  );

  /** Add the anime to a list, or remove it if it is already there. */
  const setAnimeInList = useCallback(
    async (listId: string, anime: ListAnime, shouldBeInList: boolean) => {
      if (!auth?.id) return false;
      try {
        if (shouldBeInList) {
          await pb.collection("list_items").create(
            {
              list: listId,
              user: auth.id,
              animeId: anime.id,
              animeTitle: anime.title,
              thumbnail: anime.poster,
            },
            { requestKey: null },
          );
        } else {
          const item = await pb
            .collection<ListItem>("list_items")
            .getFirstListItem(
              pb.filter("list = {:listId} && animeId = {:animeId}", {
                listId,
                animeId: anime.id,
              }),
              { requestKey: null },
            );
          await pb.collection("list_items").delete(item.id, { requestKey: null });
        }
        refresh();
        return true;
      } catch (e) {
        console.error("setAnimeInList error:", e);
        toast.error("Couldn't update the list. Please try again.", {
          style: { background: "red" },
        });
        return false;
      }
    },
    [auth?.id, refresh],
  );

  return { createList, renameList, deleteList, setAnimeInList };
}
