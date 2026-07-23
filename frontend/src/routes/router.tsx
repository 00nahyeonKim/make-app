import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter } from "react-router";
import BasicLayout from "../layouts/BasicLayout";
import LoadingSpinner from "../components/LoadingSpinner";
import ProtectedRoute from "./ProtectedRoute";
import ResultSharePage from "../pages/ResultSharePage";

const MainPage = lazy(() => import("../pages/MainPage"));
const LoginPage = lazy(() => import("../pages/LoginPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));
const MeetingCreatePage = lazy(() => import("../pages/MeetingCreatePage"));
const MeetingSlotPage = lazy(() => import("../pages/MeetingSlotPage"));
const InvitePage = lazy(() => import("../pages/InvitePage"));
const GuestJoinPage = lazy(() => import("../pages/GuestJoinPage"));
const AvailabilityPage = lazy(() => import("../pages/AvailabilityPage"));
const InviteResultPage = lazy(() => import("../pages/InviteResultPage"));
const KakaoCallbackPage = lazy(() => import("../pages/KakaoCallbackPage"));

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
        path: "auth/callback",
        element: withLoading(
          <KakaoCallbackPage />,
          "카카오 로그인을 확인하는 중이에요",
        ),
      },
      {
        path: "meetings/new",
        element: withLoading(
          <ProtectedRoute>
            <MeetingCreatePage />
          </ProtectedRoute>,
          "일정 만들기 화면을 준비하는 중이에요",
        ),
      },
      {
        path: "meetings/new/slots",
        element: withLoading(
          <ProtectedRoute>
            <MeetingSlotPage />
          </ProtectedRoute>,
          "후보 시간 입력 화면을 준비하는 중이에요",
        ),
      },
      {
        path: "invite/:inviteToken",
        element: withLoading(<InvitePage />, "모임 정보를 불러오는 중이에요"),
      },
      {
        path: "invite/:inviteToken/guest",
        element: withLoading(
          <GuestJoinPage />,
          "참여 화면을 준비하는 중이에요",
        ),
      },
      {
        path: "invite/:inviteToken/availability",
        element: withLoading(
          <AvailabilityPage />,
          "가능한 시간 화면을 준비하는 중이에요",
        ),
      },
      {
        path: "invite/:inviteToken/result",
        element: withLoading(<InviteResultPage />, "결과를 준비하는 중이에요"),
      },
      {
        path: "result/:resultToken",
        element: withLoading(<ResultSharePage />, "결과를 준비하는 중이에요"),
      },
      {
        path: "*",
        element: withLoading(<NotFoundPage />, "페이지를 확인하는 중이에요"),
      },
    ],
  },
]);

export default router;
