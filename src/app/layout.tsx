import type { Metadata } from "next";
import "./globals.css";
import { AccountProvider } from "@/components/AccountProvider";
import { ProgressProvider } from "@/components/ProgressProvider";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "FRC Code Academy — Learn to Program FRC Robots",
  description:
    "A structured, interactive path from zero programming experience to command-based FRC robot code.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AccountProvider>
          <ProgressProvider>
            <Navbar />
            <main>{children}</main>
          </ProgressProvider>
        </AccountProvider>
      </body>
    </html>
  );
}
