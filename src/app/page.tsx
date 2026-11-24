"use client";

import ContinueWatching from "@/components/continue-watching";
import CategoryStrip from "@/components/category-strip";
import DiscoverSection from "@/components/discover-section";
import RecentSection from "@/components/recent-section";
import UpcomingReleases from "@/components/upcoming-releases";
import Container from "@/components/container";
import { useGetSpotlightAnime } from "@/query/get-spotlight-anime";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

// Dynamically import components
const HeroSection = dynamic(() => import("@/components/hero-section"));
const TopAnimeSection = dynamic(() => import("@/components/top-anime-section"));
const AnimeSchedule = dynamic(() => import("@/components/anime-schedule"));

import React, { useState } from "react";

import RecentCommentsSection from "@/components/recent-comments-section";

// Soft colour glows + a faint dot grid. Fixed, so it stays put while the
// page scrolls over it.
const GLOWS = [
  "radial-gradient(48rem 28rem at 8% 6%, rgba(212,165,55,0.16), transparent 70%)",
  "radial-gradient(44rem 30rem at 96% 38%, rgba(190,70,100,0.10), transparent 70%)",
  "radial-gradient(46rem 30rem at 4% 88%, rgba(80,100,210,0.10), transparent 70%)",
].join(",");

const PageBackdrop = () => (
  <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
    <div className="absolute inset-0" style={{ backgroundImage: GLOWS }} />
    <div
      className="absolute inset-0 opacity-60"
      style={{
        backgroundImage:
          "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
        maskImage:
          "linear-gradient(to bottom, black, transparent 80%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, black, transparent 80%)",
      }}
    />
  </div>
);

// The full weekly schedule is tall, so it starts folded to keep the page short.
const CollapsibleSchedule = () => {
  const [open, setOpen] = useState(false);

  return (
    <section id="schedule" className="scroll-mt-24">
      <div
        className={cn(
          "relative overflow-hidden transition-[max-height] duration-500",
          open ? "max-h-[240rem]" : "max-h-[34rem]",
        )}
      >
        <AnimeSchedule />
        {!open && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#14100a] to-transparent" />
        )}
      </div>
      <div className="flex justify-center pb-6 pt-2">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="rounded-full border border-amber-400/50 bg-amber-400/10 px-6 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-400/20"
        >
          {open ? "Show less" : "Show full schedule"}
        </button>
      </div>
    </section>
  );
};

export default function Home() {
  const { data: spotlightList = [], isLoading: isLoadingSpotlight } =
    useGetSpotlightAnime();

  return (
    <div className="relative isolate flex flex-col bg-[#14100a]">
      <h1 className="sr-only">GLADI View: watch anime online</h1>

      <PageBackdrop />

      <HeroSection
        spotlightAnime={spotlightList}
        isDataLoading={isLoadingSpotlight}
      />

      <CategoryStrip />

      <ContinueWatching loading={false} />

      {/* Newest episodes get their own, separate section right after "continue watching" */}
      <RecentSection />

      <Container className="py-6">
        <DiscoverSection />
      </Container>

      {/* Left-to-right sliding strip of episodes airing next */}
      <Container className="py-6">
        <UpcomingReleases />
      </Container>

      <section id="top" className="scroll-mt-24">
        <TopAnimeSection />
      </section>

      <CollapsibleSchedule />

      <RecentCommentsSection />
    </div>
  );
}
