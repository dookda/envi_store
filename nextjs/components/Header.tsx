import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import LangToggle from "@/components/LangToggle";
import logo from "@/app/logo.png";

export default function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-10 border-b border-slate-100 bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
          <Image src={logo} alt="ENVIR Store logo" width={32} height={32} priority className="rounded-full" />
          <span>ENVIR Store</span>
        </Link>
        <div className="flex items-center gap-2">
          <LangToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
