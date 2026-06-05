import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter } from "react-router";
import BasicLayout from "../layouts/BasicLayout";
import LoadingSpinner from "../components/LoadingSpinner";

const MainPage = lazy(() => import("../pages/MainPage"));
const LoginPage = lazy(() => import("../pages/LoginPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));
const MeetingCreatePage = lazy(() => import("../pages/MeetingCreatePage"));

const withLoading = (children: ReactNode, message?: string) => (
  <Suspense fallback={<LoadingSpinner fullScreen message={message} />}>
    {children}
  </Suspense>
);

const router = createBrowserRouter([
  {
    path: "",
    Component: BasicLayout,
    children: [
      {
        index: true,
        element: withLoading(<MainPage />, "메인 화면을 불러오는 중이에요"),
      },
      {
        path: "login",
        element: withLoading(<LoginPage />, "로그인 화면을 준비하는 중이에요"),
      },
      {
        path: "meetings/new",
        element: withLoading(
          <MeetingCreatePage />,
          "일정 만들기 화면을 준비하는 중이에요",
        ),
      },
      {
        path: "*",
        element: withLoading(<NotFoundPage />, "페이지를 확인하는 중이에요"),
      },
      // {
      //     path: 'about',
      //     element: <Suspense fallback={<Loading />}><About /></Suspense>
      // }
    ],
  },
]);

export default router;
