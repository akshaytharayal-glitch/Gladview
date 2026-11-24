import React from "react";
import Image from "next/image";
import Link from "next/link";

import { ROUTES } from "@/constants/routes";

const Footer = () => {
  return (
    <footer className="w-full bg-base-300 shadow-xl p-5 flex flex-col items-center space-y-5">
      <Image src="/icon.png" alt="logo" width="100" height="100" suppressHydrationWarning />
      <div className="flex space-x-5 items-center">
        <a
          href="https://youtube.com/@gladi_sir122?si=8PpAa3rBLnuT4w5N"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="YouTube"
          className="text-amber-300 hover:text-amber-200 transition-colors"
        >
          <svg
            viewBox="0 0 24 24"
            width="28"
            height="28"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
          </svg>
        </a>
      </div>
      <nav
        aria-label="Legal"
        className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-300"
      >
        <Link href={ROUTES.DMCA} className="hover:text-amber-200 hover:underline">
          DMCA
        </Link>
        <Link
          href={ROUTES.PRIVACY}
          className="hover:text-amber-200 hover:underline"
        >
          Privacy Policy
        </Link>
        <Link href={ROUTES.TERMS} className="hover:text-amber-200 hover:underline">
          Terms of Service
        </Link>
      </nav>
      <p className="max-w-2xl text-center text-sm text-gray-300">
        GLADI View does not host or store any video files on its servers. We only
        link to media hosted by third-party services that are not affiliated with
        us.
      </p>
      <p className="max-w-2xl text-center text-xs text-gray-400">
        All anime titles, images and trademarks belong to their respective
        owners.
      </p>
      <p className="text-sm text-gray-300">
        &copy; {new Date().getFullYear()} GLADI View
      </p>
    </footer>
  );
};

export default Footer;
