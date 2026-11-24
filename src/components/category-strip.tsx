import React from "react";
import Link from "next/link";

import Container from "./container";
import { ROUTES } from "@/constants/routes";

type Chip = { label: string; href: string };

const FORMATS: Chip[] = [
  { label: "TV Series", href: `${ROUTES.SEARCH}?type=tv` },
  { label: "Movies", href: `${ROUTES.SEARCH}?type=movie` },
  { label: "OVA", href: `${ROUTES.SEARCH}?type=ova` },
  { label: "Specials", href: `${ROUTES.SEARCH}?type=special` },
  { label: "Airing Now", href: `${ROUTES.SEARCH}?status=currently-airing` },
  { label: "Completed", href: `${ROUTES.SEARCH}?status=finished-airing` },
];

const GENRES: Chip[] = [
  ["Action", "action"],
  ["Adventure", "adventure"],
  ["Comedy", "comedy"],
  ["Drama", "drama"],
  ["Fantasy", "fantasy"],
  ["Horror", "horror"],
  ["Isekai", "isekai"],
  ["Mecha", "mecha"],
  ["Mystery", "mystery"],
  ["Romance", "romance"],
  ["Sci-Fi", "sci-fi"],
  ["Slice of Life", "slice-of-life"],
  ["Sports", "sports"],
  ["Shounen", "shounen"],
  ["Supernatural", "supernatural"],
  ["Psychological", "psychological"],
].map(([label, value]) => ({
  label,
  href: `${ROUTES.SEARCH}?genres=${value}`,
}));

const Row = ({ label, chips }: { label: string; chips: Chip[] }) => (
  <div className="flex items-center gap-3">
    <span className="hidden w-16 shrink-0 text-xs font-semibold uppercase tracking-widest text-slate-400 sm:block">
      {label}
    </span>
    <div className="no-scrollbar flex gap-2 overflow-x-auto [mask-image:linear-gradient(to_right,transparent,black_1rem,black_calc(100%-1.5rem),transparent)] px-3 py-1">
      {chips.map((c) => (
        <Link
          key={c.label}
          href={c.href}
          className="shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-slate-200 transition hover:-translate-y-0.5 hover:border-amber-400/70 hover:bg-amber-400/10 hover:text-amber-200"
        >
          {c.label}
        </Link>
      ))}
      <Link
        href={ROUTES.SEARCH}
        className="shrink-0 rounded-full bg-gradient-to-r from-amber-300 to-amber-600 px-4 py-1.5 text-sm font-bold text-slate-950 transition hover:brightness-110"
      >
        All →
      </Link>
    </div>
  </div>
);

const CategoryStrip = () => (
  <Container className="flex flex-col gap-2 py-6">
    <Row label="Genres" chips={GENRES} />
    <Row label="Browse" chips={FORMATS} />
  </Container>
);

export default CategoryStrip;
