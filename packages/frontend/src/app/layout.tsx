import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Freelancer - Autonomous SaaS Platform",
  description: "Automate your freelance business with AI-powered client management, proposals, and negotiations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            className: "!bg-dark-800 !text-dark-100 !border !border-dark-700",
          }}
        />
      </body>
    </html>
  );
}
