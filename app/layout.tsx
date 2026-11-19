import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "@/service/provider";
import AuthGuard from "@/service/acc/AuthGuard";
import BackToTop from "@/Utilities/backToTop";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Li-in Jewelry",
  description: "LI-IN Jewelry Manufacturing Management & Product Details System",
  icons: {
    icon: "/LOGO-2.png",
    shortcut: "/LOGO-2.png",
    apple: "/LOGO-2.png", // Hiển thị trên thiết bị iOS
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning={true}>
        {/* Bọc ReduxProvider ở đây */}
        <ReduxProvider>
          <AuthGuard> 
          {children}
          </AuthGuard>
          <BackToTop/>
        </ReduxProvider>
      </body>
    </html>
  );
}
