import * as React from "react";
import Link from "next/link";
import { cn } from "../utils/cn";

interface DetailBackLinkProps {
  href: string;
  label?: string;
  className?: string;
}

export function DetailBackLink({
  href,
  label = "Back",
  className,
}: DetailBackLinkProps) {
  return (
    <div className={className}>
      <Link
        href={href}
        className={cn(
          "text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500 hover:text-sky-500",
        )}
      >
        {label}
      </Link>
    </div>
  );
}
