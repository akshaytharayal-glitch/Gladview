"use client";

import { getGuestHistory, saveGuestProgress } from "@/lib/guest-history";
import React, {
  useEffect,
  useRef,
  useMemo,
  useState,
  HTMLAttributes,
} from "react";
import Artplayer from "artplayer";
import type { Option } from "artplayer";
import Hls from "hls.js";

// Helper functions and types (keep or import from your types file)
import { IEpisodeServers, IEpisodeSource, IEpisodes } from "@/types/episodes"; // Adjust path as needed
import loadingImage from "@/assets/genkai.gif"; // Adjust path as needed
import artplayerPluginHlsControl from "artplayer-plugin-hls-control";
import artplayerPluginAmbilight from "artplayer-plugin-ambilight";
import { cn } from "@/lib/utils";
import { buildStreamProxyUrl } from "@/lib/local-proxy";
import { useAuthStore } from "@/store/auth-store";
import useBookMarks from "@/hooks/use-get-bookmark";
import { pb } from "@/lib/pocketbase";
import Image from "next/image";

const WATCH_PROGRESS_UPDATE_INTERVAL = 10000; // Update every 10 seconds
const WATCH_PROGRESS_MIN_WATCH_TIME = 10; // Min seconds watched to create record

// --- Define Props for the Combined Player ---
interface ArtPlayerProps extends HTMLAttributes<HTMLDivElement> {
  episodeInfo: IEpisodeSource; // Source info including URLs, tracks, intro/outro
  animeInfo: { title: string; image: string; id: string }; // Basic anime info for poster etc.
  subOrDub: "sub" | "dub"; // Use literal type for clarity
  episodes?: IEpisodes; // Optional: If needed for playlist features later
  getInstance?: (art: Artplayer) => void; // Callback to get the instance
  autoSkipIntro?: boolean;
  autoSkipOutro?: boolean;
  serversData: IEpisodeServers;
  onError?: () => void;
}

// --- Subtitle look ---
// Size scales with the player's height, with a floor so text stays readable in
// a small phone player. The viewer can pick a size in the settings panel.
type SubtitleSize = "small" | "medium" | "large" | "xlarge";
const SUBTITLE_SIZES: Record<
  SubtitleSize,
  { label: string; ratio: number; min: number; max: number }
> = {
  small: { label: "Small", ratio: 0.04, min: 11, max: 30 },
  medium: { label: "Medium", ratio: 0.052, min: 13, max: 40 },
  large: { label: "Large", ratio: 0.066, min: 16, max: 50 },
  xlarge: { label: "Extra large", ratio: 0.082, min: 19, max: 62 },
};
const SUBTITLE_SIZE_KEY = "subtitleSize";
const RESUME_HINT_KEY = "gladi_resume_hint";
const RATE_KEY = "gladi_playback_rate";
const VOLUME_KEY = "gladi_volume";

const readNumber = (key: string): number | null => {
  try {
    const v = parseFloat(localStorage.getItem(key) || "");
    return Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
};
const writeNumber = (key: string, value: number) => {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* storage unavailable */
  }
};

const readSubtitleSize = (): SubtitleSize => {
  try {
    const v = localStorage.getItem(SUBTITLE_SIZE_KEY);
    if (v && v in SUBTITLE_SIZES) return v as SubtitleSize;
  } catch {
    /* storage unavailable: use the default */
  }
  return "medium";
};

const subtitleFontPx = (size: SubtitleSize, playerHeight: number) => {
  const { ratio, min, max } = SUBTITLE_SIZES[size];
  return Math.round(Math.min(max, Math.max(min, playerHeight * ratio)));
};

// White text with a dark outline: readable over both bright and dark scenes.
const SUBTITLE_TEXT_STYLE = {
  color: "#FFFFFF",
  fontWeight: "600",
  lineHeight: "1.35",
  textShadow:
    "0 0 3px #000, 0 0 3px #000, 1px 1px 2px #000, -1px -1px 2px #000, 1px -1px 2px #000, -1px 1px 2px #000, 0 2px 6px rgba(0,0,0,0.9)",
} as const;

// --- Helper to generate highlights ---
// Two markers per range (start and end). One marker per second used to create
// hundreds of elements on the progress bar, which slowed down taps.
interface HighlightPoint {
  time: number;
  text: string;
}
const generateHighlights = (
  start: number | undefined | null,
  end: number | undefined | null,
  label: string,
): HighlightPoint[] => {
  if (start == null || end == null || start >= end) return [];
  return [
    { time: Math.floor(start), text: `${label} starts` },
    { time: Math.floor(end), text: `${label} ends` },
  ];
};

// Back / forward 10 seconds buttons for the control bar.
const makeSeekControl = (
  getArt: () => Artplayer | null,
  name: string,
  label: string,
  delta: number,
  iconPaths: string,
) => ({
  name,
  position: "left" as const,
  html: `<span role="button" aria-label="${label}" style="display:inline-flex;align-items:center;gap:2px;padding:0 4px;cursor:pointer"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="fill:none;stroke:currentColor">${iconPaths}</svg><span aria-hidden="true" style="font-size:12px;font-weight:700">10</span></span>`,
  tooltip: label,
  click: () => {
    const art = getArt();
    if (!art) return;
    const max = art.duration > 0 ? art.duration : Number.MAX_SAFE_INTEGER;
    art.seek = Math.min(Math.max(art.currentTime + delta, 0), max);
  },
});

// --- The Combined ArtPlayer Component ---
function GladiPlayer({
  episodeInfo,
  animeInfo,
  subOrDub,
  getInstance,
  autoSkipIntro = true,
  autoSkipOutro = true,
  serversData,
  onError,
  ...rest // Spread other div attributes like className, id, etc.
}: ArtPlayerProps): React.JSX.Element {
  const artContainerRef = useRef<HTMLDivElement>(null); // Ref for the mounting div
  const artInstanceRef = useRef<Artplayer | null>(null); // Ref for the ArtPlayer instance
  const hlsInstanceRef = useRef<Hls | null>(null); // Ref for the Hls.js instance

  const autoSkipIntroRef = useRef<boolean>(autoSkipIntro);
  const autoSkipOutroRef = useRef<boolean>(autoSkipOutro);
  const subtitleSizeRef = useRef<SubtitleSize>("medium");
  const animeInfoRef = useRef(animeInfo);
  const serversDataRef = useRef(serversData);
  animeInfoRef.current = animeInfo;
  serversDataRef.current = serversData;

  const bookmarkIdRef = useRef<string | null>(null);
  const inflightBookmarkRef = useRef<Promise<string | null> | null>(null);
  const watchHistoryIdsRef = useRef<string[]>([]); // Store initial list
  const watchedRecordIdRef = useRef<string | null>(null);
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const hasMetMinWatchTimeRef = useRef<boolean>(false); // Track if min time met for this episode
  const initialSeekTimeRef = useRef<number | null>(null);

  const { auth } = useAuthStore();
  const { createOrUpdateBookMark, syncWatchProgress } = useBookMarks({
    populate: false,
  });

  useEffect(() => {
    autoSkipIntroRef.current = autoSkipIntro;
    autoSkipOutroRef.current = autoSkipOutro;
  }, [autoSkipIntro, autoSkipOutro]);

  const ensureBookmarkId = React.useCallback(async (): Promise<string | null> => {
    if (bookmarkIdRef.current) return bookmarkIdRef.current;
    if (inflightBookmarkRef.current) return inflightBookmarkRef.current;
    const currentUserId = auth?.id || pb.authStore.record?.id;
    const info = animeInfoRef.current;
    if (!currentUserId || !info?.id || info.id === "0") return null;

    inflightBookmarkRef.current = createOrUpdateBookMark(
      String(info.id),
      info.title || "Anime",
      info.image || "",
      "watching",
      false,
    )
      .then((id) => {
        if (id) bookmarkIdRef.current = id;
        return id;
      })
      .finally(() => {
        inflightBookmarkRef.current = null;
      });

    return inflightBookmarkRef.current;
  }, [auth?.id, createOrUpdateBookMark]);

  const ensureBookmarkAndSync = React.useCallback(
    async (currentTime: number, duration: number) => {
      if (!(auth?.id || pb.authStore.record?.id)) {
        const info = animeInfoRef.current;
        const srv = serversDataRef.current;
        if (info?.id && info.id !== "0" && duration > 0) {
          saveGuestProgress({
            animeId: String(info.id),
            title: info.title || "Anime",
            poster: info.image || "",
            episodeId: srv.episodeId,
            episodeNumber: parseInt(srv.episodeNo, 10) || 1,
            current: currentTime,
            duration,
          });
        }
        return;
      }
      const bId = await ensureBookmarkId();
      if (!bId) return;
      const srv = serversDataRef.current;
      const epNum = parseInt(srv.episodeNo, 10) || 1;
      const recordId = await syncWatchProgress(
        bId,
        watchedRecordIdRef.current,
        {
          episodeId: srv.episodeId,
          episodeNumber: epNum,
          current: currentTime,
          duration: duration,
        },
      );
      if (recordId) {
        watchedRecordIdRef.current = recordId;
        if (!watchHistoryIdsRef.current.includes(recordId)) {
          watchHistoryIdsRef.current.push(recordId);
        }
      }
    },
    [auth?.id, ensureBookmarkId, syncWatchProgress],
  );

  // --- Construct Stream URI via active HLS proxy (/api/proxy or local companion) ---
  const firstSource = episodeInfo?.sources?.[0];
  const uri = useMemo(() => {
    if (!firstSource?.url) return null;
    return buildStreamProxyUrl({
      url: firstSource.url,
      referer: firstSource.referer || episodeInfo?.headers?.Referer,
      headers: firstSource.headers,
      playlistKey: firstSource.playlist_key,
    });
  }, [firstSource, episodeInfo]);

  const skipTimesRef = useRef<{
    introStart?: number;
    introEnd?: number;
    validIntro: boolean;
    outroStart?: number;
    outroEnd?: number;
    validOutro: boolean;
  }>({ validIntro: false, validOutro: false });

  useEffect(() => {
    const currentUserId = auth?.id || pb.authStore.record?.id;
    if (!currentUserId || !animeInfo.id || !serversData.episodeId) {
      bookmarkIdRef.current = null;
      watchedRecordIdRef.current = null;
      watchHistoryIdsRef.current = [];
      hasMetMinWatchTimeRef.current = false;
      initialSeekTimeRef.current = null;
      if (!currentUserId && animeInfo.id && serversData.episodeId) {
        // Guest: resume where this browser left off in the same episode.
        const saved = getGuestHistory().find(
          (h) =>
            h.animeId === String(animeInfo.id) &&
            h.episodeNumber === (parseInt(serversData.episodeNo, 10) || 1),
        );
        if (saved && saved.current > 10 && saved.current < saved.duration - 5) {
          initialSeekTimeRef.current = saved.current;
          hasMetMinWatchTimeRef.current = true;
        }
      }
      return;
    }

    let isMounted = true;

    const fetchBookmarkAndWatchedId = async () => {
      const id = await ensureBookmarkId();

      if (!isMounted || !id) {
        bookmarkIdRef.current = null;
        watchedRecordIdRef.current = null;
        watchHistoryIdsRef.current = [];
        initialSeekTimeRef.current = null;
        hasMetMinWatchTimeRef.current = false;
        return;
      }

      bookmarkIdRef.current = id;
      hasMetMinWatchTimeRef.current = false;

      try {
        const expandedBookmark = await pb.collection("bookmarks").getOne(id, {
          expand: "watchHistory",
          requestKey: null,
        });

        if (!isMounted) return;

        const history = expandedBookmark.expand?.watchHistory as
          | any[]
          | undefined;
        const currentEpNo = parseInt(serversData.episodeNo, 10);
        const existingWatched = history?.find(
          (watched: any) =>
            (currentEpNo && Number(watched.episodeNumber) === currentEpNo) ||
            (watched.episodeId && watched.episodeId === serversData.episodeId),
        );

        if (existingWatched) {
          watchedRecordIdRef.current = existingWatched.id;
          initialSeekTimeRef.current =
            typeof existingWatched.current === "number"
              ? existingWatched.current
              : null;
          hasMetMinWatchTimeRef.current =
            initialSeekTimeRef.current !== null &&
            initialSeekTimeRef.current >= WATCH_PROGRESS_MIN_WATCH_TIME;
          if (
            artInstanceRef.current &&
            initialSeekTimeRef.current &&
            initialSeekTimeRef.current > 0 &&
            artInstanceRef.current.duration > 0 &&
            initialSeekTimeRef.current < artInstanceRef.current.duration - 5 &&
            artInstanceRef.current.currentTime < 5
          ) {
            artInstanceRef.current.seek = initialSeekTimeRef.current;
            initialSeekTimeRef.current = null;
          }
        } else {
          watchedRecordIdRef.current = null;
          initialSeekTimeRef.current = null;
          hasMetMinWatchTimeRef.current = false;
        }
      } catch (e) {
        console.error("Error fetching bookmark watch history:", e);
        if (!isMounted) return;
        watchedRecordIdRef.current = null;
        initialSeekTimeRef.current = null;
        hasMetMinWatchTimeRef.current = false;
      }
    };

    fetchBookmarkAndWatchedId();

    return () => {
      isMounted = false;
    };
  }, [
    auth?.id,
    animeInfo.id,
    serversData.episodeId,
    serversData.episodeNo,
    ensureBookmarkId,
  ]);

  // --- Effect for Player Initialization and Cleanup ---
  useEffect(() => {
    // Wait for container ref and valid URI
    if (!artContainerRef.current || !uri) {
      // Clean up previous instances if URI becomes invalid or ref detach
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
      if (artInstanceRef.current) {
        artInstanceRef.current.destroy(true);
        artInstanceRef.current = null;
      }
      return;
    }

    // Make sure start/end are valid numbers before creating range
    const introStart = episodeInfo?.intro?.start;
    const introEnd = episodeInfo?.intro?.end;
    skipTimesRef.current.validIntro =
      typeof introStart === "number" &&
      typeof introEnd === "number" &&
      introStart < introEnd;
    skipTimesRef.current.introStart = introStart;
    skipTimesRef.current.introEnd = introEnd;

    const outroStart = episodeInfo?.outro?.start;
    const outroEnd = episodeInfo?.outro?.end; // Use let for potential modification
    skipTimesRef.current.validOutro =
      typeof outroStart === "number" &&
      typeof outroEnd === "number" &&
      outroStart < outroEnd; // Adjust condition if needed
    skipTimesRef.current.outroStart = outroStart;
    skipTimesRef.current.outroEnd = outroEnd; // Store the raw value

    subtitleSizeRef.current = readSubtitleSize();

    // Apply the chosen subtitle size for the current player height.
    const applySubtitleStyle = () => {
      const player = artInstanceRef.current;
      if (!player) return;
      const h =
        player.template?.$player?.clientHeight || player.height || 360;
      player.subtitle.style({
        ...SUBTITLE_TEXT_STYLE,
        fontSize: `${subtitleFontPx(subtitleSizeRef.current, h)}px`,
      });
    };

    // Subtitle Track Selector Options - prioritize English as default
    const isEnglish = (lang?: string) => {
      const l = (lang || "").toLowerCase();
      return l === "en" || l === "eng" || l.includes("english");
    };

    const validSubtitles = (episodeInfo?.subtitles ?? []).filter(
      (track) => track.url && !track.url.includes("thumbnails"),
    );

    const defaultTrack =
      validSubtitles.find((t) => isEnglish(t.lang) && t.default)?.url ||
      validSubtitles.find((t) => isEnglish(t.lang))?.url ||
      validSubtitles.find((t) => t.default)?.url ||
      validSubtitles[0]?.url;

    const defaultTrackObj = validSubtitles.find((t) => t.url === defaultTrack);
    const defaultTrackTitle = defaultTrackObj?.lang || (validSubtitles.length > 0 ? "English" : "Off");

    const defaultTrackProxyUrl = defaultTrack
      ? buildStreamProxyUrl({
          url: defaultTrack,
          referer: firstSource?.referer || episodeInfo?.headers?.Referer,
          headers: firstSource?.headers,
        })
      : undefined;

    const trackOptions: any = validSubtitles.map((track) => ({
      default: track.url === defaultTrack,
      html: track.lang || "Subtitle",
      url: track.url,
    }));

    const defaultTrackExt = defaultTrack
      ? defaultTrack.split("?")[0].split("#")[0].split(".").pop()?.toLowerCase()
      : "vtt";
    const defaultTrackType =
      defaultTrackExt === "srt" || defaultTrackExt === "ass" ? defaultTrackExt : "vtt";

    // Direct Subtitle Option based on subOrDub
    const subtitleConfig: Option["subtitle"] =
      subOrDub === "sub" && defaultTrackProxyUrl
        ? {
            url: defaultTrackProxyUrl,
            type: defaultTrackType,
            style: {
              ...SUBTITLE_TEXT_STYLE,
              fontSize: `${subtitleFontPx(subtitleSizeRef.current, 220)}px`,
            },
            encoding: "utf-8",
            escape: false,
          }
        : {};

    // Floating "Skip Intro / Skip Outro" pill above the control bar. It used to
    // be a control inside the bar, which broke its styling and pushed the
    // fullscreen button off small screens.
    const manualSkipControl = {
      name: "manual-skip",
      html: `<span class="gladi-skip-pill"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="fill:none;stroke:currentColor"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19"/></svg><span class="art-skip-text">Skip</span></span>`,
      style: {
        display: "none",
        position: "absolute",
        right: "14px",
        bottom: "64px",
        zIndex: "30",
        cursor: "pointer",
      },
      click: function(controlItem: any) {
        const art = artInstanceRef.current;
        if (!art) return;
        const { introEnd, outroStart, outroEnd, validIntro, validOutro } =
          skipTimesRef.current;
        const currentTime = art.currentTime;
        const duration = art.duration;

        let seekTarget: number | null = null;
        const resolvedOutroEnd =
          validOutro && outroEnd === 0 && duration > 0 ? duration : outroEnd;

        if (
          validIntro &&
          typeof introEnd === "number" &&
          currentTime >= skipTimesRef.current.introStart! &&
          currentTime < introEnd
        ) {
          seekTarget = introEnd;
        } else if (
          validOutro &&
          typeof outroStart === "number" &&
          typeof resolvedOutroEnd === "number" &&
          currentTime >= outroStart &&
          currentTime < resolvedOutroEnd
        ) {
          // Seek slightly before end if target is duration
          seekTarget =
            resolvedOutroEnd === duration ? duration - 0.1 : resolvedOutroEnd;
        }

        if (typeof seekTarget === "number") {
          art.seek = Math.min(seekTarget, duration); // Seek
        }

        // Hide the button immediately after click
        if (controlItem?.style) controlItem.style.display = "none";
      },
    };

    let currentHlsInstanceForCleanup: Hls | null = null;

    const lowPowerDevice =
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.innerWidth < 1024;

    // On phones the bar is too narrow for every optional button; keep the
    // essentials (play, 10s, volume, time, settings, fullscreen).
    const narrowScreen = window.innerWidth < 640;

    // Combine All Options
    const finalOptions: Option = {
      container: artContainerRef.current,
      url: uri,
      type: firstSource?.type === "mp4" ? "mp4" : "m3u8",
      customType: {
        m3u8: (
          videoElement: HTMLMediaElement,
          url: string,
          artPlayerInstance: Artplayer,
        ) => {
          if (Hls.isSupported()) {
            // Destroy previous HLS instance if attached to this player
            if (hlsInstanceRef.current) {
              hlsInstanceRef.current.destroy();
            }
            const retryPolicy = {
              default: {
                maxTimeToFirstByteMs: 15000,
                maxLoadTimeMs: 60000,
                timeoutRetry: { maxNumRetry: 4, retryDelayMs: 500, maxRetryDelayMs: 4000 },
                errorRetry: { maxNumRetry: 6, retryDelayMs: 500, maxRetryDelayMs: 4000 },
              },
            };
            const hls = new Hls({
              maxBufferLength: 30,
              maxMaxBufferLength: 60,
              backBufferLength: 30,
              fragLoadPolicy: retryPolicy,
              manifestLoadPolicy: retryPolicy,
              playlistLoadPolicy: retryPolicy,
            });
            hls.loadSource(url);
            hls.attachMedia(videoElement);
            // A single failed segment (common right after seeking through the
            // proxy) must not kick the viewer to another server and restart the
            // episode from 0:00: recover in place first.
            let recoveries = 0;
            let lastRecoveryAt = 0;
            hls.on(Hls.Events.ERROR, (event, data) => {
              if (!data.fatal) return;
              const now = Date.now();
              if (now - lastRecoveryAt > 20000) recoveries = 0;
              lastRecoveryAt = now;
              if (recoveries < 4) {
                recoveries++;
                const t = videoElement.currentTime;
                if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                  hls.startLoad(t > 0 ? t : -1);
                  return;
                }
                if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                  hls.recoverMediaError();
                  return;
                }
              }
              console.error("Fatal HLS error encountered:", data);
              try {
                // Let the next server continue from here instead of 0:00.
                sessionStorage.setItem(
                  RESUME_HINT_KEY,
                  JSON.stringify({
                    animeId: String(animeInfoRef.current?.id),
                    ep: serversDataRef.current?.episodeNo,
                    time: videoElement.currentTime,
                    at: Date.now(),
                  }),
                );
              } catch {
                /* ignore */
              }
              if (onError) onError();
            });
            hlsInstanceRef.current = hls; // Store ref
            currentHlsInstanceForCleanup = hls; // Store for cleanup
            // Make sure HLS instance is destroyed when ArtPlayer instance is destroyed
            artPlayerInstance.on("destroy", () => {
              if (hlsInstanceRef.current === hls) {
                hls.destroy();
                hlsInstanceRef.current = null;
                currentHlsInstanceForCleanup = null;
              }
            });
          } else if (
            videoElement.canPlayType("application/vnd.apple.mpegurl")
          ) {
            videoElement.src = url; // Fallback for Safari native HLS
          } else {
            artPlayerInstance.notice.show =
              "HLS playback is not supported on your browser.";
          }
        },
      },
      plugins: [
        artplayerPluginHlsControl({
          // Configure HLS controls
          quality: {
            control: true,
            setting: true,
            getName: (level: { height?: number; bitrate?: number }) =>
              level.height ? `${level.height}P` : "Auto", // Type level
            title: "Quality",
            auto: "Auto",
          },
          audio: {
            control: true,
            setting: true,
            getName: (track: { name?: string }) => track.name ?? "Unknown", // Type track
            title: "Audio",
            auto: "Auto",
          },
        }),
        // The glow redraws the video onto a blurred canvas many times a second.
        // That keeps a phone busy enough to delay taps, so it is desktop-only.
        ...(lowPowerDevice
          ? []
          : [
              artplayerPluginAmbilight({
                blur: "30",
                opacity: 0.8,
                frequency: 6,
                duration: 0.3,
                zIndex: -1,
              }),
            ]),
      ],
      settings: [
        // Configure settings panel items
        {
          width: 250,
          html: "Subtitle",
          tooltip: defaultTrackTitle,
          selector: [
            {
              html: "Display",
              tooltip: subOrDub === "sub" ? "Hide" : "Show", // Initial state based on prop
              switch: subOrDub === "sub", // Switch is ON if sub
              onSwitch: function(item) {
                const showSubtitle = !item.switch; // The new state
                art.subtitle.show = showSubtitle;
                item.tooltip = showSubtitle ? "Hide" : "Show";
                console.log(`Subtitle display set to: ${showSubtitle}`);
                return showSubtitle; // Return the new switch state
              },
            },
            ...trackOptions, // Add subtitle track choices
          ],
          onSelect: async function(item: any) {
            if (item.url && typeof item.url === "string") {
              const proxiedUrl = buildStreamProxyUrl({
                url: item.url,
                referer: firstSource?.referer || episodeInfo?.headers?.Referer,
                headers: firstSource?.headers,
              });
              const cleanUrl = item.url.split("?")[0].split("#")[0];
              const ext = cleanUrl.split(".").pop()?.toLowerCase();
              const subType = ext === "srt" || ext === "ass" ? ext : "vtt";

              art.subtitle.show = true;
              await art.subtitle.switch(proxiedUrl, {
                name: item.html,
                type: subType,
                escape: false,
                encoding: "utf-8",
              });
              return item.html ?? "Subtitle";
            }
            return item.html ?? "Subtitle";
          },
        },
        {
          width: 250,
          html: "Subtitle size",
          tooltip: SUBTITLE_SIZES[subtitleSizeRef.current].label,
          selector: (Object.keys(SUBTITLE_SIZES) as SubtitleSize[]).map(
            (key) => ({
              html: SUBTITLE_SIZES[key].label,
              value: key,
              default: key === subtitleSizeRef.current,
            }),
          ),
          onSelect: function(item: any) {
            subtitleSizeRef.current = item.value as SubtitleSize;
            try {
              localStorage.setItem(SUBTITLE_SIZE_KEY, item.value);
            } catch {
              /* storage unavailable: applies for this session only */
            }
            applySubtitleStyle();
            return item.html;
          },
        },
      ],
      layers: [manualSkipControl],
      controls: [
        makeSeekControl(
          () => artInstanceRef.current,
          "rewind-10",
          "Back 10 seconds",
          -10,
          '<path d="M3 12a9 9 0 1 0 3-6.7"/><polyline points="3 4 3 9 8 9"/>',
        ),
        makeSeekControl(
          () => artInstanceRef.current,
          "forward-10",
          "Forward 10 seconds",
          10,
          '<path d="M21 12a9 9 0 1 1-3-6.7"/><polyline points="21 4 21 9 16 9"/>',
        ),
      ],
      highlight: [
        ...generateHighlights(
          episodeInfo?.intro?.start,
          episodeInfo?.intro?.end,
          "Intro",
        ),
        ...generateHighlights(
          episodeInfo?.outro?.start,
          episodeInfo?.outro?.end,
          "Outro",
        ),
      ],
      poster: animeInfo.image,
      volume: 0.8,
      isLive: false,
      muted: false,
      autoplay: false,
      autoOrientation: false,
      pip: !narrowScreen,
      autoSize: false,
      autoMini: false,
      screenshot: !narrowScreen,
      setting: true,
      loop: false,
      flip: false,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: !narrowScreen,
      subtitleOffset: true,
      miniProgressBar: false,
      mutex: true,
      backdrop: true,
      playsInline: true,
      autoPlayback: true,
      fastForward: true, // press-and-hold on mobile for 2x
      airplay: !narrowScreen,
      theme: "#d4a537",
      moreVideoAttr: { crossOrigin: "anonymous" },
      subtitle: subtitleConfig,
      icons: {
        loading: `<img width="60" height="60" src="${loadingImage.src}">`,
      },
    };

    // --- Initialize ArtPlayer ---
    const art = new Artplayer(finalOptions);
    artInstanceRef.current = art;

    // --- Skip Logic Handler ---
    const handleTimeUpdate = () => {
      const art = artInstanceRef.current;
      if (!art || art.loading.show) return;

      if (art.subtitle?.show) {
        (art.subtitle as any).update();
      }

      const currentTime = art.currentTime;
      const duration = art.duration;
      const {
        introStart,
        introEnd,
        validIntro,
        outroStart,
        outroEnd,
        validOutro,
      } = skipTimesRef.current; // Use ref

      const resolvedOutroEnd =
        validOutro && outroEnd === 0 && duration > 0 ? duration : outroEnd;
      const inIntro =
        validIntro &&
        typeof introStart === "number" &&
        typeof introEnd === "number" &&
        currentTime >= introStart &&
        currentTime < introEnd;
      const inOutro =
        validOutro &&
        typeof outroStart === "number" &&
        typeof resolvedOutroEnd === "number" &&
        currentTime >= outroStart &&
        currentTime < resolvedOutroEnd;

      const manualSkip = art.layers["manual-skip"] as HTMLElement | undefined;
      const autoIntro = autoSkipIntroRef.current;
      const autoOutro = autoSkipOutroRef.current;

      // Jump over the part automatically when its own switch is on.
      if (inIntro && autoIntro && typeof introEnd === "number") {
        art.seek = introEnd;
      } else if (
        inOutro &&
        autoOutro &&
        typeof resolvedOutroEnd === "number"
      ) {
        const seekTarget =
          resolvedOutroEnd === duration ? duration - 0.1 : resolvedOutroEnd;
        art.seek = Math.min(seekTarget, duration);
      }

      // Otherwise offer a manual Skip button while inside that part.
      const showManualIntro = inIntro && !autoIntro;
      const showManualOutro = inOutro && !autoOutro;
      if (manualSkip) {
        if (showManualIntro || showManualOutro) {
          if (manualSkip.style?.display === "none") {
            manualSkip.style.display = "block";
          }
          const skipText = showManualIntro ? "Intro" : "Outro";
          const textElement = manualSkip.querySelector(".art-skip-text");
          if (textElement && textElement.textContent !== `Skip ${skipText}`) {
            textElement.textContent = `Skip ${skipText}`;
          }
        } else if (manualSkip.style?.display !== "none") {
          manualSkip.style.display = "none";
        }
      }

      // --- Watch Progress Tracking ---
      // 1. Check if minimum watch time is met to potentially create record
      if (
        !hasMetMinWatchTimeRef.current &&
        currentTime >= WATCH_PROGRESS_MIN_WATCH_TIME &&
        duration > 0
      ) {
        hasMetMinWatchTimeRef.current = true;
        if (!watchedRecordIdRef.current) {
          lastUpdateTimeRef.current = Date.now();
          void ensureBookmarkAndSync(currentTime, duration);
        }
      }

      // 2. Throttle updates every 10s if playing and min time met OR record already exists
      if (
        duration > 0 &&
        (hasMetMinWatchTimeRef.current || watchedRecordIdRef.current) &&
        Date.now() - lastUpdateTimeRef.current > WATCH_PROGRESS_UPDATE_INTERVAL
      ) {
        lastUpdateTimeRef.current = Date.now();
        void ensureBookmarkAndSync(currentTime, duration);
      }
    };

    // --- Event Listeners ---
    art.on("ready", () => {
      try {
        Object.defineProperty(art.subtitle, "textTrack", {
          configurable: true,
          get: () =>
            art.template.$track?.track ||
            art.template.$video?.textTracks?.[0],
        });
      } catch (e) {
        void e;
      }

      if (subOrDub === "sub" && defaultTrackProxyUrl) {
        art.subtitle.show = true;
      }

      applySubtitleStyle();
      // --- SEEK TO LAST POSITION ---
      const seekTime = initialSeekTimeRef.current;
      if (
        seekTime !== null &&
        seekTime > 0 &&
        art.duration > 0 &&
        seekTime < art.duration - 5
      ) {
        setTimeout(() => {
          if (artInstanceRef.current) {
            artInstanceRef.current.seek = seekTime;
          }
        }, 100);
        initialSeekTimeRef.current = null;
      } else {
        initialSeekTimeRef.current = null;
      }
    });

    // ---- Smoothness / convenience features ----
    // 1) Seek guard: if a seek lands back at 0:00 (stream hiccup), retry once
    //    or twice from the requested spot instead of silently restarting.
    let lastSeekTarget = 0;
    let guardTries = 0;
    art.on("video:seeking", () => {
      const t = art.currentTime;
      if (t > 3) {
        lastSeekTarget = t;
        guardTries = 0;
      }
    });
    art.on("video:seeked", () => {
      if (lastSeekTarget > 3 && art.currentTime < 1 && guardTries < 2) {
        guardTries++;
        hlsInstanceRef.current?.startLoad(lastSeekTarget);
        art.currentTime = lastSeekTarget;
      }
    });

    art.on("ready", () => {
      // 2) Remember speed and volume between episodes.
      const savedRate = readNumber(RATE_KEY);
      if (savedRate && savedRate > 0 && savedRate <= 3) art.playbackRate = savedRate;
      const savedVol = readNumber(VOLUME_KEY);
      if (savedVol !== null && savedVol >= 0 && savedVol <= 1) art.volume = savedVol;

      // 3) Continue from where the last server failed.
      try {
        const raw = sessionStorage.getItem(RESUME_HINT_KEY);
        if (raw) {
          sessionStorage.removeItem(RESUME_HINT_KEY);
          const h = JSON.parse(raw);
          if (
            h?.animeId === String(animeInfoRef.current?.id) &&
            h?.ep === serversDataRef.current?.episodeNo &&
            Date.now() - h.at < 120000 &&
            h.time > 5
          ) {
            setTimeout(() => {
              if (artInstanceRef.current) artInstanceRef.current.seek = h.time;
            }, 400);
          }
        }
      } catch {
        /* ignore */
      }

      // 4) Double-tap the left / right side of the video to jump 10 seconds.
      let lastTapAt = 0;
      let lastTapX = 0;
      art.proxy(art.template.$player, "touchend", (e: any) => {
        const target = e.target as HTMLElement | null;
        if (target?.closest?.(".art-bottom, .art-settings, .art-layer-manual-skip, .art-contextmenu")) return;
        const touch = e.changedTouches?.[0];
        if (!touch) return;
        const now = Date.now();
        const rect = art.template.$player.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        if (now - lastTapAt < 300 && Math.abs(x - lastTapX) < 80) {
          const third = rect.width / 3;
          const max = art.duration > 0 ? art.duration : Number.MAX_SAFE_INTEGER;
          if (x < third) {
            art.seek = Math.max(art.currentTime - 10, 0);
            art.notice.show = "« 10s";
          } else if (x > third * 2) {
            art.seek = Math.min(art.currentTime + 10, max);
            art.notice.show = "10s »";
          }
          lastTapAt = 0;
        } else {
          lastTapAt = now;
          lastTapX = x;
        }
      });
    });
    art.on("video:ratechange", () => writeNumber(RATE_KEY, art.playbackRate));
    art.on("video:volumechange", () => {
      if (!art.muted) writeNumber(VOLUME_KEY, art.volume);
    });

    // The layout settles a moment after fullscreen/resize events, so
    // re-measure a couple of times (otherwise the text keeps the old size).
    const subtitleTimers: ReturnType<typeof setTimeout>[] = [];
    const applySubtitleSoon = () => {
      applySubtitleStyle();
      subtitleTimers.forEach(clearTimeout);
      subtitleTimers.length = 0;
      requestAnimationFrame(applySubtitleStyle);
      subtitleTimers.push(
        setTimeout(applySubtitleStyle, 150),
        setTimeout(applySubtitleStyle, 500),
      );
    };
    art.on("resize", applySubtitleSoon);
    art.on("fullscreenWeb", applySubtitleSoon);
    window.addEventListener("orientationchange", applySubtitleSoon);

    // Landscape lock in fullscreen is handled here (ArtPlayer's own
    // autoOrientation left the player rotated/misaligned after exiting and
    // blocked going fullscreen again).
    art.on("fullscreen", (isFull: boolean) => {
      const orientation = (screen as any).orientation;
      try {
        if (isFull) {
          void orientation?.lock?.("landscape")?.catch(() => undefined);
        } else {
          orientation?.unlock?.();
        }
      } catch {
        /* orientation lock unsupported: ignore */
      }
      applySubtitleSoon();
    });

    art.on("error", (error, reconnectTime) => {
      console.error(
        "ArtPlayer Error:",
        error,
        "Reconnect attempt:",
        reconnectTime,
      );
      if (onError) onError();
    });

    art.on("video:timeupdate", handleTimeUpdate);

    const handleInteractionUpdate = () => {
      const art = artInstanceRef.current;
      if (!art || !art.duration || art.duration <= 0) return;
      if (
        hasMetMinWatchTimeRef.current ||
        watchedRecordIdRef.current ||
        art.currentTime >= WATCH_PROGRESS_MIN_WATCH_TIME
      ) {
        hasMetMinWatchTimeRef.current = true;
        if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
        lastUpdateTimeRef.current = Date.now();
        void ensureBookmarkAndSync(art.currentTime, art.duration);
      }
    };
    art.on("video:pause", handleInteractionUpdate);
    art.on("video:seeked", handleInteractionUpdate);
    art.on("video:ended", handleInteractionUpdate);

    // --- Callback for Parent ---
    if (getInstance && typeof getInstance === "function") {
      getInstance(art);
    }

    // --- Cleanup Function ---
    return () => {
      window.removeEventListener("orientationchange", applySubtitleSoon);
      subtitleTimers.forEach(clearTimeout);
      const art = artInstanceRef.current;
      const hls = hlsInstanceRef.current;

      if (hls) {
        if (hls.media) {
          hls.detachMedia();
        }
        hls.destroy();
        hlsInstanceRef.current = null;
      }

      if (
        art &&
        art.duration > 0 &&
        (hasMetMinWatchTimeRef.current || watchedRecordIdRef.current)
      ) {
        void ensureBookmarkAndSync(art.currentTime, art.duration);
      }

      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
        updateTimerRef.current = null;
      }

      if (art) {
        art.off("video:pause", handleInteractionUpdate);
        art.off("video:seeked", handleInteractionUpdate);
        art.off("video:ended", handleInteractionUpdate);
        art.off("video:timeupdate", handleTimeUpdate);

        art.pause();

        if (art.video) {
          art.video.removeAttribute("src");
          art.video.load();
        }

        if (currentHlsInstanceForCleanup) {
          currentHlsInstanceForCleanup.destroy();
          if (hlsInstanceRef.current === currentHlsInstanceForCleanup) {
            hlsInstanceRef.current = null;
          }
          currentHlsInstanceForCleanup = null;
        } else if (hlsInstanceRef.current) {
          hlsInstanceRef.current.destroy();
          hlsInstanceRef.current = null;
        }

        art.destroy(true);
        if (artInstanceRef.current === art) {
          artInstanceRef.current = null;
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uri, subOrDub]);

  // --- Render ---
  return (
    <div
      className={cn(
        "relative w-full h-auto aspect-video  min-h-[20vh] sm:min-h-[30vh] md:min-h-[40vh] lg:min-h-[60vh] max-h-[500px] lg:max-h-[calc(100vh-150px)] bg-black overflow-hidden", // Added relative and overflow-hidden
        rest.className ?? "",
      )}
    >
      <div ref={artContainerRef} className="w-full h-full">
        {!uri && (
          <div
            className="w-full h-full flex items-center justify-center bg-cover bg-center"
            style={{ backgroundImage: `url(${animeInfo.image})` }}
          >
            <Image
              width="60"
              height="60"
              src={loadingImage.src}
              alt="Loading..."
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default GladiPlayer;
