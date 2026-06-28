import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { ConfirmProvider } from "@/components/providers/ConfirmProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const siteUrl = process.env.AUTH_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "OrbitDesk — Real-Time Collaborative Workspace",
  description:
    "A full-stack real-time workspace where teams can manage projects, collaborate on Kanban boards, track activity, and generate AI-powered project summaries.",
  openGraph: {
    title: "OrbitDesk — Real-Time Collaborative Workspace",
    description:
      "Manage projects with Kanban boards, real-time sync, and AI-powered summaries.",
    url: siteUrl,
    siteName: "OrbitDesk",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OrbitDesk",
    description: "Real-time collaborative project management.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${inter.className} min-h-full flex flex-col antialiased bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100`}>
        <ThemeProvider>
          <SessionProvider>
            <ToastProvider>
              <ConfirmProvider>
                <Navbar />
                <main className="flex-1">{children}</main>
                <Footer />
              </ConfirmProvider>
            </ToastProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
