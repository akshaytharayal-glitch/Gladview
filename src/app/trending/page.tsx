import type { Metadata } from "next";

import CategoryListPage from "@/components/category-list-page";

export const metadata: Metadata = {
  title: "Trending Anime | GLADI View",
  description: "Anime that are rising fast right now.",
};

export default function Page() {
  return <CategoryListPage kind="trending" />;
}
