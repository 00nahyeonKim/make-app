import { Menu } from "lucide-react";
import { useState, type ReactNode } from "react";
import AppSidebar from "../components/AppSidebar";

type AppHeaderProps = {
  title: string;
  left?: ReactNode;
  right?: ReactNode;
  showMenu?: boolean;
  className?: string;
};

function Header({
  title,
  left,
  right,
  showMenu = false,
  className = "",
}: AppHeaderProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleOpenSidebar = () => {
    setIsSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <>
      <header
        className={[
          "sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[#eeeeee] bg-white px-4",
          className,
        ].join(" ")}
      >
        <div className="flex w-10 items-center justify-start">
          {showMenu ? (
            <button
              type="button"
              onClick={handleOpenSidebar}
              aria-label="메뉴 열기"
              aria-controls="app-sidebar"
              aria-expanded={isSidebarOpen}
              className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#f5f5f5]"
            >
              <Menu size={25} strokeWidth={2.2} />
            </button>
          ) : (
            left
          )}
        </div>

        <h1 className="line-clamp-1 text-base font-bold text-[#222222]">
          {title}
        </h1>

        <div className="flex w-10 items-center justify-end">{right}</div>
      </header>

      <AppSidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />
    </>
  );
}

export default Header;
