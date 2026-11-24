import type { Metadata } from "next";

import {
  CONTACT_URL,
  LegalPage,
  LegalSection,
  SITE_NAME,
} from "@/components/legal-page";

export const metadata: Metadata = {
  title: `Privacy Policy | ${SITE_NAME}`,
  description: `How ${SITE_NAME} handles your data.`,
};

const PrivacyPage = () => {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="Your privacy is important to us. We collect as little as we can, and we never sell your personal data."
    >
      <LegalSection heading="Watching Without an Account">
        <p>
          You can watch on {SITE_NAME} without creating an account. When you do,
          your continue-watching history and playback preferences (such as
          auto-skip and preferred audio category) are saved only in your
          browser&apos;s Local Storage on your own device. We do not receive
          them. Clearing your browser data removes them.
        </p>
      </LegalSection>

      <LegalSection heading="Optional Accounts">
        <p>
          If you choose to create an account, we store the following so your
          library can sync across devices:
        </p>
        <ul>
          <li>
            Your email address, username and password. Passwords are stored in
            hashed form, never as plain text.
          </li>
          <li>An optional avatar and your auto-skip setting.</li>
          <li>
            Bookmarks (anime, title, thumbnail and your watch status) and watch
            progress.
          </li>
          <li>
            Comments you post, including the anime and episode they refer to.
            Comments are public.
          </li>
        </ul>
        <p>
          If Discord sign-in is available and you use it, Discord shares basic
          account details with us as part of its sign-in process. Your login
          session is kept in your browser&apos;s Local Storage.
        </p>
        <p>
          If you use the AniList import feature, you enter your AniList
          username so we can read your public list from AniList. We never ask
          for your AniList password.
        </p>
      </LegalSection>

      <LegalSection heading="Analytics">
        <p>
          {SITE_NAME} uses Google Analytics to understand how the site is used.
          Google may collect information such as the pages you visit, your
          browser and device type, and your approximate location, and may use
          cookies or similar technologies to do so. You can limit this with your
          browser&apos;s privacy settings, a content blocker, or{" "}
          <a
            href="https://tools.google.com/dlpage/gaoptout"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google&apos;s opt-out add-on
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection heading="Servers and Caching">
        <p>
          Like any website, our servers process technical information such as
          your IP address when they handle a request, including requests that
          relay streams. To keep the site fast, we may cache catalog data,
          playlists and small files such as subtitles for a short time (up to
          about 30 minutes). We do not store video files.
        </p>
      </LegalSection>

      <LegalSection heading="Third-Party Services">
        <p>
          Video is delivered by third-party hosts that we do not control. When
          you press play, those hosts may see your IP address and may set their
          own cookies, under their own privacy policies. Catalog information and
          images come from services such as AniList. Please review the policies
          of any third-party service you use.
        </p>
      </LegalSection>

      <LegalSection heading="GLADI View Companion">
        <p>
          The optional Companion desktop app runs on your own computer and only
          listens on your local machine. It is used to relay streams over your
          own connection and is not used to send information to us.
        </p>
      </LegalSection>

      <LegalSection heading="Your Choices">
        <ul>
          <li>
            Clear your browser&apos;s Local Storage at any time to remove
            locally saved history and preferences.
          </li>
          <li>
            Ask us to delete your account and the data tied to it through our{" "}
            <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer">
              Discord server
            </a>
            .
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="Children">
        <p>
          {SITE_NAME} is not directed at children under 13, and we do not
          knowingly collect their personal information.
        </p>
      </LegalSection>

      <LegalSection heading="Changes to This Policy">
        <p>
          We may update this policy from time to time. The &ldquo;Last
          updated&rdquo; date above shows when it last changed.
        </p>
      </LegalSection>
    </LegalPage>
  );
};

export default PrivacyPage;
