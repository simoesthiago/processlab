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
      { url: "/logo-icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    apple: [
      { url: "/logo-icon.svg", sizes: "180x180", type: "image/svg+xml" },
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

