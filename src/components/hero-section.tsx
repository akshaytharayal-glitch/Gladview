"use client";

import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "./ui/carousel";

import Container from "./container";
import { Button } from "./ui/button";

import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { ROUTES } from "@/constants/routes";
import { ButtonLink } from "./common/button-link";
import { MediaList } from "@/types/miruro-api";

type IHeroSectionProps = {
  spotlightAnime: MediaList[];
  isDataLoading: boolean;
};

const HeroSection = (props: IHeroSectionProps) => {
  const [api, setApi] = React.useState<CarouselApi>();

  if (props.isDataLoading || !props.spotlightAnime?.length)
    return <LoadingSkeleton />;

  return (
    <div className="h-[26rem] md:h-[32rem] w-full relative">
      <Carousel className="w-full" setApi={setApi} opts={{ loop: true }}>
        <CarouselContent>
          {props.spotlightAnime.map((anime, index) => (
            <CarouselItem key={anime.id || index}>
              <HeroCarouselItem anime={anime} index={index} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="absolute hidden md:flex items-center gap-5 right-10 bottom-8 z-50 isolate">
        <Button
          onClick={() => {
            api?.scrollPrev();
          }}
          aria-label="Previous slide"
          className="rounded-full bg-transparent border border-white h-10 w-10 hover:bg-amber-500/30"
        >
          <ArrowLeft className="text-white shrink-0" />
        </Button>
        <Button
          onClick={() => api?.scrollNext()}
          aria-label="Next slide"
          className="rounded-full bg-transparent border border-white h-10 w-10 hover:bg-amber-500/30"
        >
          <ArrowRight className="text-white shrink-0" />
        </Button>
      </div>
    </div>
  );
};

const HeroCarouselItem = ({
  anime,
  index,
}: {
  anime: MediaList;
  index: number;
}) => {
  const cover = anime.coverImage?.extraLarge || anime.coverImage?.large || "";
  const banner = anime.bannerImage || "";
  const title =
    anime.title?.english ||
    anime.title?.romaji ||
    anime.title?.native ||
    "Untitled";

  return (
    <div className="relative h-[26rem] w-full overflow-hidden bg-slate-950 md:h-[32rem]">
      {/* Background: wide banner on desktop, tall poster (face stays visible) on
          phones, blurred poster when no banner exists */}
      {banner ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-top opacity-60 md:hidden"
            decoding="async"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={banner}
            alt=""
            className="absolute inset-0 hidden h-full w-full object-cover object-[center_25%] opacity-60 md:block"
            decoding="async"
          />
        </>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cover}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top opacity-30"
        />
      )}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent" />
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

      <Container className="relative z-20 flex h-full items-end justify-between gap-8 pb-14 pt-24 md:items-center md:pb-10">
        <div className="max-w-xl space-y-3">
          <p className="text-sm font-semibold text-amber-400">
            #{index + 1} Spotlight
          </p>
          <h2 className="line-clamp-2 text-3xl font-extrabold leading-tight text-white md:text-5xl">
            {title}
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-300">
            {anime.format && <span>▶ {anime.format}</span>}
            {anime.seasonYear && <span>▦ {anime.seasonYear}</span>}
            {!!anime.averageScore && (
              <span className="text-amber-300">★ {(anime.averageScore / 10).toFixed(2)}</span>
            )}
            {!!anime.episodes && <span>▤ {anime.episodes} eps</span>}
          </div>
          <div className="pt-2">
            <ButtonLink
              href={`${ROUTES.WATCH}?anime=${anime.id}&ep=1`}
              className="h-11 rounded-md bg-gradient-to-r from-amber-300 to-amber-600 px-6 text-base font-bold text-slate-950 hover:from-amber-200 hover:to-amber-500"
            >
              ▶ Watch now
            </ButtonLink>
          </div>
        </div>
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={title}
            className="hidden aspect-[2/3] h-[20rem] rounded-lg object-cover shadow-2xl ring-1 ring-amber-400/40 md:block"
          />
        )}
      </Container>
    </div>
  );
};

const LoadingSkeleton = () => {
  return (
    <div className="h-[26rem] md:h-[32rem] w-full relative">
      <div className="w-full h-[calc(100%-5.25rem)] mt-[5.25rem] relative z-20">
        <Container className="w-full h-full flex flex-col justify-end md:justify-center pb-10">
          <div className="space-y-2 lg:w-[40vw]">
            <div className="h-16 animate-pulse bg-slate-700 w-[75%]"></div>
            <div className="h-40 animate-pulse w-full bg-slate-700"></div>
            <div className="flex items-center gap-5">
              <span className="h-10 w-[7.5rem] animate-pulse bg-slate-700"></span>
              <span className="h-10 w-[7.5rem] animate-pulse bg-slate-700"></span>
            </div>
          </div>
        </Container>
      </div>
      <div className="absolute hidden md:flex items-center gap-5 right-10 bottom-32 z-50 isolate">
        <span className="h-10 w-10 rounded-full animate-pulse bg-slate-700"></span>
        <span className="h-10 w-10 rounded-full animate-pulse bg-slate-700"></span>
      </div>
    </div>
  );
};
export default HeroSection;
