import type { AnchorHTMLAttributes, ReactNode } from "react";
import Link, { type LinkProps } from "next/link";

import { buttonStyles, type ButtonSize, type ButtonVariant } from "@/components/ui/button";
import { ExternalLinkIcon } from "@/components/ui/icons";

export interface LinkButtonProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: LinkProps["href"];
  variant?: ButtonVariant;
  size?: ButtonSize;
  isExternal?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  isExternal = false,
  className,
  leftIcon,
  rightIcon,
  children,
  ...props
}: LinkButtonProps) {
  const isExternalUrl =
    isExternal ||
    (typeof href === "string" && (href.startsWith("http://") || href.startsWith("https://")));

  if (isExternalUrl) {
    return (
      <a
        href={href.toString()}
        className={buttonStyles({ variant, size, className })}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {leftIcon}
        <span>{children}</span>
        {rightIcon ?? <ExternalLinkIcon className="size-4 opacity-75" aria-hidden="true" />}
      </a>
    );
  }

  return (
    <Link href={href} className={buttonStyles({ variant, size, className })} {...props}>
      {leftIcon}
      <span>{children}</span>
      {rightIcon}
    </Link>
  );
}
