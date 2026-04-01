import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Vertex — Private Social Network",
    template: "%s | Vertex"
  },
  description: "Connect with Airtight integrity. Vertex is a high-security, private social platform for verified digital lives.",
  keywords: ["social network", "security", "privacy", "vertex", "encrypted", "airtight"],
  authors: [{ name: "Vertex Security Team" }],
  creator: "Vertex Social Alpha",
  verification: {
    google: "vertex-verification-token",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://vertex.social",
    siteName: "Vertex",
    title: "Vertex — Connect with Integrity",
    description: "A secure, private, and premium social platform.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Vertex Logo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vertex — Private Social Network",
    description: "Maximum Security Social Networking.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="bottom-right"
              richColors
              closeButton
              theme="system"
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
