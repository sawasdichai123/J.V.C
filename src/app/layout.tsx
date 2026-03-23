import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "J.V.C — Jeetar Vault Core",
  description: "Secure backup and organization for your visual works",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
