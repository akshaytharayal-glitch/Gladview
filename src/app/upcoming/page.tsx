import type { Metadata } from "next";

import CategoryListPage from "@/components/category-list-page";

export const metadata: Metadata = {
  title: "Upcoming Anime | GLADI View",
  description: "Anime that have not aired yet.",
};

export default function Page() {
  return <CategoryListPage kind="upcoming" />;
}
