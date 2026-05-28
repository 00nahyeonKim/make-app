import { Outlet } from "react-router";

function BasicLayout() {
  return (
    <>
      <header>
        <h1>Header</h1>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}

export default BasicLayout;
