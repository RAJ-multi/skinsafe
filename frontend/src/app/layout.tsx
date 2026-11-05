import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "SkinSafe | Computational Cosmetic Ingredient & Skin Permeability Platform",
  description:
    "Scientific cheminformatics platform for cosmetic molecular analysis, drug-likeness evaluation, and Potts-Guy skin permeability prediction.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>
          <div className="min-h-screen flex flex-col bg-slate-50/70">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

