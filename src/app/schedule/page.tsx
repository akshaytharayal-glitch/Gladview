import type { Metadata } from "next";

import AnimeSchedule from "@/components/anime-schedule";

export const metadata: Metadata = {
  title: "Release Schedule | GLADI View",
  description: "Estimated release times for upcoming episodes this week.",
};

export default function Page() {
  return (
    <div className="min-h-[75vh] bg-[#14100a] pb-10 pt-24 lg:pt-28">
      <AnimeSchedule />
    </div>
  );
}
