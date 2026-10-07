import type { Metadata } from "next";
import "./globals.css";
import "./modules.css";
import "./auth.css";

export const metadata: Metadata = {
  title: "AdvocatePro Chambers",
  description: "Case management and hearing calendar for your chambers.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}