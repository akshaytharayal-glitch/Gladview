import type { Metadata } from "next";

import CategoryListPage from "@/components/category-list-page";

export const metadata: Metadata = {
  title: "Popular Anime | GLADI View",
  description: "The most popular anime on GLADI View.",
};

export default function Page() {
  return <CategoryListPage kind="popular" />;
}
