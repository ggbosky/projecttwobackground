import { forwardRef, type AnchorHTMLAttributes, type MouseEvent } from "react";
import { navigate } from "./router";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string | { pathname?: string };
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
};

const Link = forwardRef<HTMLAnchorElement, Props>(function Link({ href, prefetch, replace, scroll, onClick, ...rest }, ref) {
  const target = typeof href === "string" ? href : (href.pathname ?? "/");
  return (
    <a
      ref={ref}
      href={target}
      {...rest}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0) return;
        e.preventDefault();
        navigate(target, { replace, scroll });
      }}
    />
  );
});

export default Link;
