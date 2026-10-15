import Image from "next/image";
import Link from "next/link";

const LINKS = [
  { href: "/schedule", label: "Schedule" },
  { href: "/players", label: "Players" },
  { href: "/team", label: "Team" },
  { href: "/join", label: "Player form" },
];

export function SiteHeader() {
  return (
    <header className="bg-brand text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="Sanger Apaches" width={40} height={40} className="h-10 w-auto rounded bg-white p-0.5" priority />
          <span className="font-bold leading-tight">
            Sanger Boys Soccer
            <span className="block text-xs font-normal text-white/80">Varsity</span>
          </span>
        </Link>
        <nav className="flex flex-wrap gap-x-5 gap-y-1 text-sm font-medium sm:ml-auto">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:underline">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-stone-200 py-6 text-center text-xs text-stone-500">
      Sanger High School Boys Soccer · Go Apaches ·{" "}
      <Link href="/coach" className="underline">
        Staff
      </Link>
    </footer>
  );
}
