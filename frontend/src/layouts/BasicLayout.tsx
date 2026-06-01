import { Outlet } from "react-router";

function BasicLayout() {
  return (
    <div className="h-dvh overflow-hidden bg-slate-100 md:flex md:items-center md:justify-center md:p-6">
      <main className="scrollbar-hide relative h-dvh w-full overflow-y-auto overflow-x-hidden bg-[#eee8dc] md:h-[667px] md:max-h-[calc(100dvh-48px)] md:max-w-[375px] md-rounded-[32px] md:shadow-2xl md:ring-1 md:ring-black/5">
        <Outlet />
      </main>
    </div>
  );
}

export default BasicLayout;
