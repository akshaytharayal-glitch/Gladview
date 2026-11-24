"use client";

import React from "react";

import AnimeSections from "./anime-sections";
import { useGetPopularAnime } from "@/query/get-popular-anime";
import { useGetTrendingAnime } from "@/query/get-trending-anime";
import { useGetUpcomingAnime } from "@/query/get-upcoming-anime";

export type ListKind = "popular" | "trending" | "upcoming";

const PER_PAGE = 28;

const useScrollTopOnChange = (setPage: (p: number) => void) =>
  React.useCallback(
    (p: number) => {
      setPage(p);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [setPage],
  );

const PopularList = () => {
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useGetPopularAnime(page, PER_PAGE);
  const onPageChange = useScrollTopOnChange(setPage);
  return (
    <AnimeSections
      title="Popular Anime"
      animeList={data?.results || []}
      loading={isLoading}
      page={page}
      hasNextPage={data?.hasNextPage}
      onPageChange={onPageChange}
    />
  );
};

const TrendingList = () => {
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useGetTrendingAnime(page, PER_PAGE);
  const onPageChange = useScrollTopOnChange(setPage);
  return (
    <AnimeSections
      title="Trending Anime"
      animeList={data?.results || []}
      loading={isLoading}
      page={page}
      hasNextPage={data?.hasNextPage}
      onPageChange={onPageChange}
    />
  );
};

const UpcomingList = () => {
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useGetUpcomingAnime(page, PER_PAGE);
  const onPageChange = useScrollTopOnChange(setPage);
  return (
    <AnimeSections
      title="Upcoming Anime"
      animeList={data?.results || []}
      loading={isLoading}
      page={page}
      hasNextPage={data?.hasNextPage}
      onPageChange={onPageChange}
    />
  );
};

// pt-28 clears the fixed navbar.
const CategoryListPage = ({ kind }: { kind: ListKind }) => (
  <div className="min-h-[75vh] bg-[#14100a] pb-10 pt-28 lg:pt-32">
    {kind === "popular" && <PopularList />}
    {kind === "trending" && <TrendingList />}
    {kind === "upcoming" && <UpcomingList />}
  </div>
);

export default CategoryListPage;
