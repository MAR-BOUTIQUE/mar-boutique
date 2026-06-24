import { Navbar } from "@/components/storefront/Navbar";
import { Footer } from "@/components/storefront/Footer";
import { WhatsAppButton } from "@/components/storefront/WhatsAppButton";
import { PopupBienvenida } from "@/components/storefront/PopupBienvenida";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
      <WhatsAppButton />
      <PopupBienvenida />
    </>
  );
}
