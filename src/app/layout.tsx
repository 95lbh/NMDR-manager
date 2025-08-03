import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { AppProvider } from "@/contexts/AppContext";
import PWAInstaller from "@/components/PWAInstaller";
import OfflineIndicator from "@/components/OfflineIndicator";
import PWADebugger from "@/components/PWADebugger";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "내맘대로 클럽 배드민턴",
  description: "'내맘대로'배드민턴 매니저",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "배드민턴 매니저",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "배드민턴 매니저",
    title: "내맘대로 클럽 배드민턴",
    description: "'내맘대로'배드민턴 매니저",
  },
  icons: {
    icon: [
      { url: "/icons/icon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-167x167.png", sizes: "167x167", type: "image/png" },
      { url: "/icons/icon-180x180.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport = {
  themeColor: "#10b981",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.className} antialiased bg-gray-50`} suppressHydrationWarning={true}>
        <AppProvider>
          <div className="min-h-screen">
            <OfflineIndicator />
            <Navigation />
            <main className="container mx-auto px-4 py-6">
              {children}
            </main>
            <PWAInstaller />
            <PWADebugger />
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
