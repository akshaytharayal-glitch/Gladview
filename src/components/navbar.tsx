"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

import Container from "./container";

import { nightTokyo } from "@/utils/fonts";
import { ROUTES } from "@/constants/routes";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import SearchBar from "./search-bar";
import { Search, X } from "lucide-react";
import useScrollPosition from "@/hooks/use-scroll-position";
import MenuDrawer from "./menu-drawer";
import { useAuthStore } from "@/store/auth-store";
import { pb } from "@/lib/pocketbase";
import NavbarAvatar from "./navbar-avatar";
import { toast } from "sonner";

const menuItems: Array<{ title: string; href?: string }> = [
  // {
  //   title: "Home",
  //   href: ROUTES.HOME,
  // },
  // {
  //   title: "Catalog",
  // },
  // {
  //   title: "News",
  // },
  // {
  //   title: "Collection",
  // },
];

const NavBar = () => {
  const auth = useAuthStore();
  const { y } = useScrollPosition();
  const isHeaderSticky = y > 0;

  useEffect(() => {
    const refreshAuth = async () => {
      const auth_token = JSON.parse(
        localStorage.getItem("pocketbase_auth") as string,
      );
      if (auth_token) {
        try {
          const user = await pb.collection("users").authRefresh();
          if (user) {
            auth.setAuth({
              id: user.record.id,
              email: user.record.email,
              username: user.record.username,
              avatar: user.record.avatar,
              collectionId: user.record.collectionId,
              collectionName: user.record.collectionName,
              autoSkip: user.record.autoSkip,
              created: user.record.created,
            });
          }
        } catch (e) {
          console.error("Auth refresh error:", e);
          localStorage.removeItem("pocketbase_auth");
          auth.clearAuth();
          toast.error("Login session expired.", {
            style: { background: "red" },
          });
        }
      }
    };
    refreshAuth();
  }, []);

  return (
    <header
      className={cn([
        "fixed top-0 left-0 right-0 h-fit w-full z-[100] transition-all duration-300",
        "backdrop-blur-md border-b",
        isHeaderSticky
          ? "bg-slate-950/65 border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]"
          : "bg-slate-950/35 border-white/5",
      ])}
    >
      <Container className="flex items-center justify-between py-2 gap-6 lg:gap-20 ">
        <div className="flex items-center gap-3">
          <MenuDrawer />
          <Link
            href={ROUTES.HOME}
            className="flex items-center gap-1 cursor-pointer"
          >
            <Image src="/icon.png" alt="logo" width={70} height={70} />
            <p
              className={cn([
                nightTokyo.className,
                "text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-amber-500 tracking-widest",
              ])}
            >
              GLADI View
            </p>
          </Link>
        </div>

        <div className="hidden lg:flex items-center gap-10 ml-20">
          {menuItems.map((menu, idx) => (
            <Link href={menu.href || "#"} key={idx}>
              {menu.title}
            </Link>
          ))}
        </div>
        <div className="w-1/3 hidden lg:flex items-center gap-5">
          <SearchBar />
          {auth.auth ? <NavbarAvatar auth={auth} /> : null}
        </div>
        <div className="lg:hidden flex items-center gap-5">
          <MobileSearch />
          {auth.auth ? <NavbarAvatar auth={auth} /> : null}
        </div>
      </Container>
    </header>
  );
};

const MobileSearch = () => {
  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Search"
        onClick={() => setOpen(true)}
        className="text-amber-300 hover:text-amber-200 transition-colors"
      >
        <Search suppressHydrationWarning className="h-6 w-6" />
      </button>
      {open &&
        createPortal(
          // Portal to <body>: the navbar's backdrop-blur would otherwise trap
          // this fixed overlay inside the navbar instead of the full screen.
          <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-md px-4 pt-4">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <SearchBar autoFocus onAnimeClick={() => setOpen(false)} />
              </div>
              <button
                type="button"
                aria-label="Close search"
                onClick={() => setOpen(false)}
                className="mt-2 text-slate-300 hover:text-amber-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Type an anime name — press Enter to see all results.
            </p>
          </div>,
          document.body,
        )}
    </>
  );
};

export default NavBar;
