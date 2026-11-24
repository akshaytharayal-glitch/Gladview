import type { Metadata } from "next";

import {
  CONTACT_URL,
  LegalPage,
  LegalSection,
  SITE_NAME,
} from "@/components/legal-page";

export const metadata: Metadata = {
  title: `DMCA Disclaimer | ${SITE_NAME}`,
  description: `DMCA disclaimer and takedown information for ${SITE_NAME}.`,
};

const DmcaPage = () => {
  return (
    <LegalPage
      title="DMCA Disclaimer"
      intro={`${SITE_NAME} respects the intellectual property rights of others.`}
    >
      <LegalSection heading="No Hosted Content">
        <p>
          {SITE_NAME} does not host, store, upload or own any video files,
          episodes or movies on its servers. All media played on {SITE_NAME} is
          hosted by third-party services that are not affiliated with us.
        </p>
        <p>
          {SITE_NAME} is a user interface that finds links to streams offered by
          third-party sources (such as AniKoto, AniZone, AniWaves,
          KickAssAnime, AnimeGG, AnimeNoSub, AnimeOnsen, AnimeDunya, MKissa,
          ReAnime, Senshi and Ani.pm) and plays them from the video hosts those
          sources use (such as MegaPlay, VidPlay, Vidmoly, Byse, DataSV, Nova
          and FlixCloud). We do not control these services or the content they
          make available, and we are not responsible for it.
        </p>
        <p>
          To make playback work in your browser, the {SITE_NAME} server may act
          as a technical pass-through for stream requests and may briefly cache
          small files such as playlists and subtitles. It never keeps a copy of
          any video.
        </p>
      </LegalSection>

      <LegalSection heading="Takedown Requests">
        <p>
          Because we do not host the files, we cannot remove them from the
          servers where they are stored. If you believe your copyrighted work is
          being displayed without permission, please contact the hosting
          provider that actually stores the file (for example MegaPlay, VidPlay
          or the streaming source site) and ask them to remove it. Once the
          file is removed from their servers, it stops being available through{" "}
          {SITE_NAME} automatically.
        </p>
        <p>
          If you are a copyright owner or an authorized agent and would also
          like us to stop linking to a specific title or page on {SITE_NAME},
          contact us through our{" "}
          <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer">
            Discord server
          </a>{" "}
          and include:
        </p>
        <ul>
          <li>Identification of the copyrighted work you claim is infringed.</li>
          <li>
            The {SITE_NAME} page address (URL) where the material appears.
          </li>
          <li>Your name, and a way for us to contact you.</li>
          <li>
            A statement that you have a good-faith belief the use is not
            authorized by the copyright owner, its agent or the law.
          </li>
          <li>
            A statement, made under penalty of perjury, that the information in
            your notice is accurate and that you are the owner or authorized to
            act for the owner.
          </li>
        </ul>
        <p>
          We review complete notices and, where appropriate, stop surfacing the
          identified title or link.
        </p>
      </LegalSection>

      <LegalSection heading="Third-Party Content and Trademarks">
        <p>
          Anime titles, descriptions, artwork and related trademarks shown on{" "}
          {SITE_NAME} belong to their respective owners. Catalog information
          and images are provided by services such as AniList. {SITE_NAME} is
          not affiliated with, endorsed by or sponsored by any studio,
          publisher or rights holder.
        </p>
      </LegalSection>
    </LegalPage>
  );
};

export default DmcaPage;
