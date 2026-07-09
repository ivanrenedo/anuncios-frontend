import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileTabBar from "@/components/layout/MobileTabBar";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {/* pb clears the fixed mobile tab bar */}
      <main className="flex-1 pb-20 sm:pb-0">{children}</main>
      <Footer />
      <MobileTabBar />
    </div>
  );
}
