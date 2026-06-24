import { Outlet } from "react-router";

function BasicLayout() {
  return (
    <div className="h-dvh overflow-hidden bg-slate-100 md:flex md:items-center md:justify-center">
      <main
        className={[
          "scrollbar-hide relative h-dvh w-full overflow-y-auto overflow-x-hidden bg-[#ebe2d3]",
          "md:h-dvh md:w-auto md:aspect-375/667",
          "md:shadow-2xl md:ring-1 md:ring-black/5",
        ].join(" ")}
      >
        <Outlet />
      </main>
    </div>
  );
}

export default BasicLayout;
