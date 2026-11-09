import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "ArenaCover — Accountability for agent trading",
  description:
    "A prefunded execution guarantee. Clear terms, verifiable payments, funded compensation.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
