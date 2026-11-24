import type { Metadata } from "next";

import TopAnimeSection from "@/components/top-anime-section";

export const metadata: Metadata = {
  title: "Top Anime | GLADI View",
  description: "Top airing anime by day, week and month.",
};

export default function Page() {
  return (
    <div className="min-h-[75vh] bg-[#14100a] pt-20">
      <TopAnimeSection />
    </div>
  );
}
