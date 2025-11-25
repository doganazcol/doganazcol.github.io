"use client";

import { ThemeToggle } from "@/components/theme-toggle"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AuthButton } from "@/components/auth-button"

export function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const isSignInPage = pathname === "/auth/signin"

  return (
    <div className="flex items-center gap-4">
      <ThemeToggle />
      {session ? (
        <>
          <Button asChild variant="outline" size="sm">
            <Link href="/profile">Profile</Link>
          </Button>
          <Button asChild>
            <Link href="/create">Create Study Session</Link>
          </Button>
          <AuthButton />
        </>
      ) : !isSignInPage && (
        <Button asChild>
          <Link href="/auth/signin">Sign In</Link>
        </Button>
      )}
    </div>
  )
}
