import type { Metadata } from "next";

import LatestEpisodesAnime from "@/components/latest-episodes-section";

export const metadata: Metadata = {
  title: "Recently Added | GLADI View",
  description: "Anime with newly released episodes.",
};

export default function Page() {
  return (
    <div className="min-h-[75vh] bg-[#14100a] pb-10 pt-28 lg:pt-32">
      <LatestEpisodesAnime />
    </div>
  );
}
