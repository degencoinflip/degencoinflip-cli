import type { Metadata } from "next";
import { ClientWrapper } from "@/components/ClientWrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "Degen Coin Flip SDK — Composability Demo",
  description:
    "3 lines of code. Any app. See the Degen Coin Flip SDK embedded in real-world UIs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white overflow-x-hidden">
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}
