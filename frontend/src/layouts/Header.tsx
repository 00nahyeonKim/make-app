import type { ReactNode } from "react";

type AppHeaderProps = {
  title: string;
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
};

function Header({ title, left, right, className = "" }: AppHeaderProps) {
  return (
    <header
      className={[
        "sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[#eeeeee] bg-white px-4",
        className,
      ].join(" ")}>
      <div className="flex w-10 items-center justify-start">{left}</div>

      <h1 className="line-clamp-1 text-base font-bold text-[#222222]">
        {title}
      </h1>

      <div className="flex w-10 items-center justify-end">{right}</div>
    </header>
  );
}

export default Header;
