import type { Metadata } from "next";
import Link from "next/link";

import { ROUTES } from "@/constants/routes";
import {
  CONTACT_URL,
  LegalPage,
  LegalSection,
  SITE_NAME,
} from "@/components/legal-page";

export const metadata: Metadata = {
  title: `Terms of Service | ${SITE_NAME}`,
  description: `Terms of Service for using ${SITE_NAME}.`,
};

const TermsPage = () => {
  return (
    <LegalPage
      title="Terms of Service"
      intro={`By accessing ${SITE_NAME}, you agree to be bound by these Terms of Service.`}
    >
      <LegalSection heading="Use of Service">
        <p>
          {SITE_NAME} provides a custom user interface that aggregates links to
          third-party streaming providers. We do not host, upload or manage any
          media files on our own servers. Availability, quality and legality of
          third-party content are outside our control.
        </p>
      </LegalSection>

      <LegalSection heading="Accounts">
        <p>
          An account is optional. If you create one, you are responsible for
          keeping your login details secure and for activity under your account.
          You must be at least 13 years old to create an account.
        </p>
      </LegalSection>

      <LegalSection heading="Your Content">
        <p>
          You are responsible for the comments and other content you post. Do
          not post anything unlawful, hateful, harassing, misleading or spam.
          Comments are public, and we may remove content or restrict accounts
          that break these rules. By posting, you allow {SITE_NAME} to display
          your content on the service.
        </p>
      </LegalSection>

      <LegalSection heading="Acceptable Use">
        <p>You agree not to:</p>
        <ul>
          <li>Interfere with, overload or attempt to break the service.</li>
          <li>
            Scrape or abuse our servers or APIs in an automated way that harms
            the service.
          </li>
          <li>Use the service for any unlawful purpose.</li>
        </ul>
        <p>
          You are responsible for following the copyright and other laws that
          apply where you live.
        </p>
      </LegalSection>

      <LegalSection heading="Third-Party Services">
        <p>
          Streams, catalog data and images come from third parties. Their
          services and terms are separate from ours, and we are not responsible
          for their content, availability or practices. See our{" "}
          <Link href={ROUTES.DMCA}>DMCA Disclaimer</Link> and{" "}
          <Link href={ROUTES.PRIVACY}>Privacy Policy</Link> for more.
        </p>
      </LegalSection>

      <LegalSection heading="Intellectual Property">
        <p>
          Anime titles, artwork, characters and trademarks belong to their
          respective owners and are not owned by {SITE_NAME}. The {SITE_NAME}{" "}
          source code is available under the license in its repository.
        </p>
      </LegalSection>

      <LegalSection heading="Disclaimer">
        <p>
          The service is provided &lsquo;as is&rsquo; and &lsquo;as
          available&rsquo; without any warranties of any kind, express or
          implied. We do not guarantee that the service will be uninterrupted,
          error-free or that any title will be available.
        </p>
      </LegalSection>

      <LegalSection heading="Limitation of Liability">
        <p>
          To the fullest extent permitted by law, {SITE_NAME} and its
          contributors are not liable for any indirect, incidental or
          consequential damages arising from your use of the service or from
          third-party content.
        </p>
      </LegalSection>

      <LegalSection heading="Changes and Termination">
        <p>
          We may change these terms or the service at any time, and we may
          suspend or end access for anyone who breaks these terms. Continuing to
          use {SITE_NAME} after a change means you accept the updated terms.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions about these terms? Reach us on our{" "}
          <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer">
            Discord server
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
};

export default TermsPage;
