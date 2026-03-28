import type { Metadata } from "next";
import { Montserrat, Inria_Serif } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", weight: ["300","400","500","600","700"] });
const inria = Inria_Serif({ subsets: ["latin"], variable: "--font-inria", weight: ["300","400","700"] });

export const metadata: Metadata = { title: "Adjiano Admin", description: "Admin dashboard" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} ${inria.variable}`}>{children}</body>
    </html>
  );
}
