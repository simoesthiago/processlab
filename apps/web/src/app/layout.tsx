import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ProcessLab - The GitHub for Process Modeling",
  description: "AI-powered BPMN diagram generator and editor with version control and governance. Built for consultants, process owners, and compliance teams.",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "android-chrome", url: "/android-chrome-192x192.png", sizes: "192x192" },
      { rel: "android-chrome", url: "/android-chrome-512x512.png", sizes: "512x512" },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "ProcessLab - The GitHub for Process Modeling",
    description: "AI-powered BPMN diagram generator and editor with version control and governance.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <WorkspaceProvider>
            {children}
          </WorkspaceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
