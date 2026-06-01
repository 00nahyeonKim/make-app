import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router";
import BasicLayout from "../layouts/BasicLayout";
import LoginPage from "../pages/LoginPage";
import NotFoundPage from "../pages/NotFoundPage";
import MeetingCreatePage from "../pages/MeetingCreatePage";

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
      {
        path: "login",
        element: (
          <Suspense fallback={<Loading />}>
            <LoginPage />
          </Suspense>
        ),
      },
      {
        path: "meetings/new",
        element: (
          <Suspense fallback={<Loading />}>
            <MeetingCreatePage />
          </Suspense>
        ),
      },
      {
        path: "*",
        element: (
          <Suspense fallback={<Loading />}>
            <NotFoundPage />
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
