"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Film,
  Flame,
  Menu,
  Search,
  Sparkles,
  TrendingUp,
  Trophy,
} from "lucide-react";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { ROUTES } from "@/constants/routes";
import { genres } from "@/constants/search-filters";

type MenuLink = {
  label: string;
  hint: string;
  href: string;
  icon: React.ReactNode;
};

// Every entry opens its own page.
const MAIN_LINKS: MenuLink[] = [
  {
    label: "Home",
    hint: "Back to the start",
    href: ROUTES.HOME,
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    label: "Popular Anime",
    hint: "What everyone is watching",
    href: ROUTES.POPULAR,
    icon: <Flame className="h-5 w-5" />,
  },
  {
    label: "Top Anime",
    hint: "Ranked by day, week and month",
    href: ROUTES.TOP,
    icon: <Trophy className="h-5 w-5" />,
  },
  {
    label: "Trending",
    hint: "Rising fast right now",
    href: ROUTES.TRENDING,
    icon: <TrendingUp className="h-5 w-5" />,
  },
  {
    label: "Recently Added",
    hint: "Freshly released episodes",
    href: ROUTES.RECENT,
    icon: <Film className="h-5 w-5" />,
  },
  {
    label: "Upcoming",
    hint: "Not yet aired",
    href: ROUTES.UPCOMING,
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    label: "Release Schedule",
    hint: "Episode times for the week",
    href: ROUTES.SCHEDULE,
    icon: <Clock className="h-5 w-5" />,
  },
  {
    label: "Browse & Filter",
    hint: "Search the whole catalog",
    href: ROUTES.SEARCH,
    icon: <Search className="h-5 w-5" />,
  },
];

const QUICK_GENRES = genres.filter((g) =>
  [
    "action",
    "adventure",
    "comedy",
    "drama",
    "fantasy",
    "horror",
    "isekai",
    "mecha",
    "mystery",
    "romance",
    "sci-fi",
    "slice-of-life",
    "sports",
    "supernatural",
  ].includes(g.value),
);

const MenuDrawer = () => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          className="group flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-[5px] rounded-lg border border-white/10 bg-white/5 transition hover:border-amber-400/50 hover:bg-amber-400/10"
        >
          <span className="h-[2px] w-5 rounded bg-amber-300 transition-all group-hover:w-6" />
          <span className="h-[2px] w-5 rounded bg-amber-300" />
          <span className="h-[2px] w-5 rounded bg-amber-300 transition-all group-hover:w-4" />
        </button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="z-[210] flex w-[85%] max-w-sm flex-col gap-0 overflow-y-auto border-white/10 bg-[#14100a]/95 p-0 backdrop-blur-xl"
      >
        <div className="border-b border-white/10 bg-gradient-to-br from-amber-400/15 to-transparent px-6 pb-5 pt-6">
          <SheetTitle className="text-xl font-extrabold text-white">
            Menu
          </SheetTitle>
          <SheetDescription className="mt-1 text-sm text-slate-400">
            Jump to a section or browse by category.
          </SheetDescription>
        </div>

        <nav aria-label="Main" className="flex flex-col gap-1 p-3">
          {MAIN_LINKS.map((item) => (
            <SheetClose asChild key={item.label}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className="group flex items-center gap-4 rounded-xl px-3 py-2.5 transition hover:bg-amber-400/10"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-amber-300 ring-1 ring-white/10 transition group-hover:bg-amber-400/20">
                  {item.icon}
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-slate-100">
                    {item.label}
                  </span>
                  <span className="block truncate text-xs text-slate-400">
                    {item.hint}
                  </span>
                </span>
              </Link>
            </SheetClose>
          ))}
        </nav>

        <div className="border-t border-white/10 px-6 py-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Genres
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_GENRES.map((g) => (
              <SheetClose asChild key={g.value}>
                <Link
                  href={`${ROUTES.SEARCH}?genres=${g.value}`}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-amber-400/60 hover:text-amber-200"
                >
                  {g.label}
                </Link>
              </SheetClose>
            ))}
          </div>
        </div>

        <div className="mt-auto flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 px-6 py-4 text-xs text-slate-400">
          <SheetClose asChild>
            <Link href={ROUTES.DMCA} className="hover:text-amber-200">
              DMCA
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link href={ROUTES.PRIVACY} className="hover:text-amber-200">
              Privacy Policy
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link href={ROUTES.TERMS} className="hover:text-amber-200">
              Terms of Service
            </Link>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MenuDrawer;
