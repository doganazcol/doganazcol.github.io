"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AuthButton } from "./auth-button";

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b">
      <div className="container flex h-16 items-center px-4">
        <Link href="/" className="font-bold">
          BerkeleyWork
        </Link>

        <div className="ml-8 flex gap-6">
          <Link
            href="/sessions"
            className={cn(
              "text-sm transition-colors hover:text-primary",
              pathname === "/sessions"
                ? "text-foreground"
                : "text-muted-foreground"
            )}
          >
            Study Sessions
          </Link>
          <Link
            href="/my-sessions"
            className={cn(
              "text-sm transition-colors hover:text-primary",
              pathname === "/my-sessions"
                ? "text-foreground"
                : "text-muted-foreground"
            )}
          >
            My Sessions
          </Link>
          <Link
            href="/profile/matching"
            className={cn(
              "text-sm transition-colors hover:text-primary",
              pathname === "/profile/matching"
                ? "text-foreground"
                : "text-muted-foreground"
            )}
          >
            Find Study Partners
          </Link>
        </div>

        <div className="ml-auto">
          <AuthButton />
        </div>
      </div>
    </nav>
  );
} 