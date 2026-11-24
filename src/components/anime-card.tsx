import React from "react";
import Link from "next/link";
import Image from "next/image";

import { cn, formatSecondsToMMSS } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { WatchHistory } from "@/hooks/use-get-bookmark";
import { Progress } from "./ui/progress";

type Props = {
  className?: string;
  poster: string;
  title: string;
  episodeCard?: boolean;
  episodes?: number | null;
  score?: number | null;
  format?: string | null;
  subTitle?: string;
  displayDetails?: boolean;
  variant?: "sm" | "lg";
  href?: string;
  showGenre?: boolean;
  watchDetail?: WatchHistory | null;
  layout?: "stacked" | "overlay";
};

const AnimeCard = ({
  displayDetails = true,
  variant = "sm",
  layout = "stacked",
  ...props
}: Props) => {
  const safeCurrent =
    typeof props.watchDetail?.current === "number"
      ? props.watchDetail.current
      : 0;
  const safeTotal =
    typeof props.watchDetail?.timestamp === "number" &&
    props.watchDetail.timestamp > 0
      ? props.watchDetail.timestamp
      : 0;

  const clampedCurrent = Math.min(safeCurrent, safeTotal);
  const percentage = safeTotal > 0 ? (clampedCurrent / safeTotal) * 100 : 0;

  if (displayDetails && layout === "stacked") {
    return (
      <Link href={props.href as string} className="block w-full">
        <div className={cn(["group w-full", props.className])}>
          <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-slate-800 ring-1 ring-white/10 transition duration-300 group-hover:ring-amber-400/70 group-hover:shadow-[0_0_18px_rgba(212,165,55,0.35)]">
            <Image
              src={props.poster}
              alt={props.title}
              height={300}
              width={200}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
              unoptimized
            />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/85 to-transparent" />
            {!!props.score && (
              <span className="absolute right-1.5 top-1.5 rounded-md bg-black/65 px-1.5 py-0.5 text-[11px] font-semibold text-amber-300 backdrop-blur-sm">
                ★ {props.score}%
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-1 px-2 pb-1.5">
              {props.episodeCard && !!props.episodes ? (
                <span className="rounded bg-gradient-to-r from-amber-300 to-amber-600 px-1.5 py-0.5 text-[10px] font-bold text-slate-950">
                  EP {props.episodes}
                </span>
              ) : (
                <span />
              )}
              {props.format && (
                <span className="text-[11px] font-medium text-slate-200">
                  {props.format}
                </span>
              )}
            </div>
            {props.watchDetail && (
              <div className="absolute inset-x-0 bottom-0">
                <Progress value={percentage} />
              </div>
            )}
          </div>
          <h3 className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-5 text-slate-100 transition-colors group-hover:text-amber-300">
            {props.title}
          </h3>
          {props.watchDetail && (
            <p className="text-xs text-slate-400">
              Ep {props.watchDetail.episodeNumber} ·{" "}
              {formatSecondsToMMSS(props.watchDetail.current)} /{" "}
              {formatSecondsToMMSS(props.watchDetail.timestamp)}
            </p>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link href={props.href as string}>
      <div
        className={cn([
          "rounded-xl overflow-hidden relative cursor-pointer hover:scale-105 duration-300",
          variant === "sm" &&
            "h-[12rem] min-[320px]:h-[16.625rem] sm:h-[18rem] max-w-[12.625rem] md:min-w-[12rem]",
          variant === "lg" &&
            "max-w-[12.625rem] md:max-w-[18.75rem] h-auto md:h-[25rem] shrink-0 lg:w-[18.75rem]",
          props.className,
        ])}
      >
        <Image
          src={props.poster}
          alt={props.title}
          height={100}
          width={100}
          className="w-full h-full object-cover"
          unoptimized
        />
        {displayDetails && (
          <>
            <div className="absolute inset-0 m-auto h-full w-full bg-gradient-to-t from-accent to-transparent"></div>
            <div className="absolute bottom-0 flex flex-col gap-1 px-4 pb-3 w-full">
              <h3 className="line-clamp-1 font-bold text-sm text-white">{props.title}</h3>
              {props.watchDetail && (
                <>
                  <p className="text-xs text-gray-400">
                    Episode {props.watchDetail.episodeNumber} -{" "}
                    {formatSecondsToMMSS(props.watchDetail.current)} /{" "}
                    {formatSecondsToMMSS(props.watchDetail.timestamp)}
                  </p>
                  <Progress value={percentage} />
                </>
              )}
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                {props.episodeCard && !!props.episodes && (
                  <Badge className="bg-[#d4a537] text-slate-950 text-[10px] px-1.5 py-0.5">
                    Ep {props.episodes}
                  </Badge>
                )}
                {props.format && (
                  <Badge variant="outline" className="text-gray-300 border-gray-600 text-[10px] px-1.5 py-0.5">
                    {props.format}
                  </Badge>
                )}
                {!!props.score && (
                  <span className="text-[11px] font-semibold text-yellow-400 ml-auto">
                    ⭐ {props.score}%
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Link>
  );
};

export default AnimeCard;

