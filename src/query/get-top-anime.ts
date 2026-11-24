import { api } from "@/lib/api";
import { MediaList, PaginatedResponse } from "@/types/miruro-api";
import { useQuery } from "@tanstack/react-query";

export type TopPeriod = "day" | "week" | "month";

export const GET_TOP_ANIME = "GET_TOP_ANIME";

// AniList has no real daily/weekly/monthly view counts, so each period ranks
// currently-airing anime by a different signal.
const PERIOD_SORT: Record<TopPeriod, string> = {
  day: "TRENDING_DESC",
  week: "POPULARITY_DESC",
  month: "SCORE_DESC",
};

const getTopAnime = async (period: TopPeriod): Promise<MediaList[]> => {
  const res = await api.get<PaginatedResponse<MediaList>>("/filter", {
    params: {
      status: "RELEASING",
      sort: PERIOD_SORT[period],
      page: 1,
      per_page: 14,
    },
  });
  return (res.data.results || []).filter((item) => !item.isAdult).slice(0, 10);
};

export const useGetTopAnime = (period: TopPeriod) =>
  useQuery({
    queryFn: () => getTopAnime(period),
    queryKey: [GET_TOP_ANIME, period],
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
