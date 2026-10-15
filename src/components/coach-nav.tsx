import Link from "next/link";
import { staffLogout } from "@/app/coach/actions";

const LINKS = [
  { href: "/coach", label: "Dashboard" },
  { href: "/coach/events", label: "Events" },
  { href: "/coach/staff", label: "Staff" },
  { href: "/coach/expected", label: "Expected roster" },
  { href: "/staff", label: "Assistant view" },
];

export function CoachNav() {
  return (
    <nav className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-stone-200 pb-3 text-sm">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className="font-medium text-brand hover:underline">
          {l.label}
        </Link>
      ))}
      <form action={staffLogout} className="ml-auto">
        <button className="text-stone-600 underline">Sign out</button>
      </form>
    </nav>
  );
}
