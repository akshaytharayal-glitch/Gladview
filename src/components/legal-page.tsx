import React, { ReactNode } from "react";
import Link from "next/link";

import Container from "@/components/container";
import { ROUTES } from "@/constants/routes";

export const SITE_NAME = "GLADI View";
export const LEGAL_LAST_UPDATED = "October 24, 2026";
export const CONTACT_URL = "https://discord.gg/6yAJ3XDHTt";

type LegalPageProps = {
  title: string;
  intro?: string;
  children: ReactNode;
};

export const LegalPage = ({ title, intro, children }: LegalPageProps) => {
  return (
    <Container className="pb-14 pt-28 md:pt-32">
      <article className="mx-auto max-w-3xl">
        <header className="mb-8 border-b border-border pb-6">
          <h1 className="text-3xl font-extrabold md:text-5xl">{title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Last updated: {LEGAL_LAST_UPDATED}
          </p>
          {intro ? (
            <p className="mt-4 text-base text-muted-foreground">{intro}</p>
          ) : null}
        </header>

        <div className="space-y-8">{children}</div>

        <nav
          aria-label="Legal pages"
          className="mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-6 text-sm"
        >
          <Link href={ROUTES.DMCA} className="hover:underline">
            DMCA Disclaimer
          </Link>
          <Link href={ROUTES.PRIVACY} className="hover:underline">
            Privacy Policy
          </Link>
          <Link href={ROUTES.TERMS} className="hover:underline">
            Terms of Service
          </Link>
        </nav>
      </article>
    </Container>
  );
};

type LegalSectionProps = {
  heading: string;
  children: ReactNode;
};

export const LegalSection = ({ heading, children }: LegalSectionProps) => {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold md:text-2xl">{heading}</h2>
      <div className="space-y-3 text-base leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  );
};
