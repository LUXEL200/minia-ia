import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ReactNode } from "react";

interface SubPageLayoutProps {
  children: ReactNode;
  noPadding?: boolean;
}

export default function SubPageLayout({ children, noPadding }: SubPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className={noPadding ? "" : "pt-28 pb-20"}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
