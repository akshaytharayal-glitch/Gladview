import { api } from "@/lib/api";
import { PaginatedResponse, RecentItem } from "@/types/miruro-api";
import { useQuery } from "@tanstack/react-query";

export const GET_RECENT_ANIME = "GET_RECENT_ANIME";

const getRecentAnime = async (
  page = 1,
  perPage = 20,
): Promise<PaginatedResponse<RecentItem>> => {
  const res = await api.get<PaginatedResponse<RecentItem>>("/recent", {
    params: { page, per_page: perPage },
  });
  const data = res.data;
  return {
    ...data,
    results: (data.results || []).filter((item) => !item.isAdult),
  };
};

export const useGetRecentAnime = (page = 1, perPage = 20) => {
  return useQuery({
    queryFn: () => getRecentAnime(page, perPage),
    queryKey: [GET_RECENT_ANIME, page, perPage],
    // New episodes should appear without a manual reload.
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60 * 3,
    refetchOnWindowFocus: true,
  });
};
