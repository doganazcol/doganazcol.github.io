import './globals.css';
import { Inter } from 'next/font/google';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';
import { LoadingScreen } from '@/components/loading-screen';
import { Providers } from '@/components/providers';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Berkeley Work',
  description: 'Find study sessions for your classes',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch the server-side session.
  // This ensures NextAuth can detect a valid session and won't redirect
  // the user right back to the sign-in page after logging in.
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={cn("min-h-screen bg-background font-sans antialiased flex flex-col", inter.className)}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <LoadingScreen />
            <SpeedInsights />
            {/* Top Navigation Bar */}
            <header className="border-b">
              <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <Link
                    href="/"
                    className="text-xl font-bold flex items-center gap-2"
                  >
                    <img
                      src="/favicon.ico"
                      alt="Berkeley Work Logo"
                      className="w-[30px] h-[30px]"
                    />
                    Berkeley Work
                  </Link>
                  <nav className="flex gap-6">
                    <Link 
                      href={session ? "/" : "/auth/signin"} 
                      className="text-sm font-medium px-3 py-2 rounded-md transition-colors hover:text-green-600 hover:bg-green-50"
                    >
                      Dashboard
                    </Link>
                    <Link 
                      href={session ? "/my-sessions" : "/auth/signin"} 
                      className="text-sm font-medium px-3 py-2 rounded-md transition-colors hover:text-green-600 hover:bg-green-50"
                    >
                      My Sessions
                    </Link>
                    <Link 
                      href={session ? "/calendar" : "/auth/signin"} 
                      className="text-sm font-medium px-3 py-2 rounded-md transition-colors hover:text-green-600 hover:bg-green-50"
                    >
                      Calendar
                    </Link>
                    <Link 
                      href={session ? "/sessions" : "/auth/signin"} 
                      className="text-sm font-medium px-3 py-2 rounded-md transition-colors hover:text-green-600 hover:bg-green-50"
                    >
                      Browse Sessions
                    </Link>
                  </nav>
                </div>
                <Navbar />
              </div>
            </header>

            <main className="flex-1 container mx-auto py-6 px-4">
              {children}
            </main>
            <footer className="border-t py-6 mt-auto">
              <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
                <p className="text-center text-sm text-muted-foreground md:text-left">
                  &copy; {new Date().getFullYear()} Berkeley Work. All rights reserved.
                </p>
                <nav className="flex gap-4">
                  <Link href="/about" className="text-sm text-muted-foreground hover:underline">
                    About
                  </Link>
                  <Link href="#" className="text-sm text-muted-foreground hover:underline">
                    Terms
                  </Link>
                  <Link href="#" className="text-sm text-muted-foreground hover:underline">
                    Privacy
                  </Link>
                  <Link href="#" className="text-sm text-muted-foreground hover:underline">
                    Contact
                  </Link>
                </nav>
              </div>
            </footer>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
