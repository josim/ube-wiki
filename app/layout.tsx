import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { Providers } from "./providers";
import { Toast } from "@/components/ui/Toast";
import { TransactionModal } from "@/components/ui/TransactionModal";

export const metadata: Metadata = {
  metadataBase: new URL('https://docs.teia.art'),
  title: "teia wiki",
  description: "decentralized wiki for the teia community",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Providers>
          <Nav />
          <main className="flex-1 w-full">
            {children}
          </main>
          <Footer />
          <Toast />
          <TransactionModal />
        </Providers>
      </body>
    </html>
  );
}
