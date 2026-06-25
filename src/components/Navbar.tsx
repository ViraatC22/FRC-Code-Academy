import Link from "next/link";
import { AccountMenu } from "./AccountMenu";

export function Navbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-edge bg-ink/80 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 whitespace-nowrap font-bold text-white"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-sm">
            ⚙
          </span>
          FRC <span className="text-brand2">Code Academy</span>
        </Link>
        <div className="flex shrink-0 items-center gap-3 text-sm text-muted sm:gap-5">
          <Link href="/diagnostic" className="rounded hover:text-white">
            Diagnostic
          </Link>
          <Link href="/tracks/beginner" className="rounded hover:text-white">
            <span className="sm:hidden">Tracks</span>
            <span className="hidden sm:inline">Beginner Track</span>
          </Link>
          <AccountMenu />
        </div>
      </nav>
    </header>
  );
}
