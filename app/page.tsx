import Nav from "@/components/navigation";
import Caurosel from "@/Homecoponent/caurosel";
import Catalo from "@/Homecoponent/Catalogue";
import Product from "@/Homecoponent/about";
import MenuLeft from "@/components/menuleft";

export default function Home() {
  return (
    <div className="min-h-screen bg-[url('/background1.jpg')] bg-cover bg-center bg-fixed bg-no-repeat text-gray-800 font-sans pb-16 relative">
      {/* Giảm bg-white/85 xuống bg-white/30 để thấy rõ họa tiết nền */}
      <div className="fixed inset-0 bg-white/30 backdrop-blur-[0.5px] pointer-events-none z-0" />

      {/* Nội dung chính */}
      <div className="relative z-10 space-y-8">
        <Nav />
        <Caurosel />
        <Catalo />
        <Product />
        <MenuLeft />
      </div>
    </div>
  );
}
