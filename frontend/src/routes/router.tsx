import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router";
import BasicLayout from "../layouts/BasicLayout";

const Loading = () => <div>Loading...</div>;
const Main = lazy(() => import("../pages/MainPage"));

const router = createBrowserRouter([
  {
    path: "",
    Component: BasicLayout,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<Loading />}>
            <Main />
          </Suspense>
        ),
      },
      // {
      //     path: 'about',
      //     element: <Suspense fallback={<Loading />}><About /></Suspense>
      // }
    ],
  },
]);

export default router;
