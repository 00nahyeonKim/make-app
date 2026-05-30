import { Outlet } from "react-router";

function BasicLayout() {
  return (
    <div className="min-h-dvh md:flex md:items-center md:justify-center">
      <main className="relative min-h-dvh w-full overflow-hidden bg-[#eee8dc] md:max-w-107.5 md:shadow-2xl">
        <Outlet />
      </main>
    </div>
  );
}

export default BasicLayout;
