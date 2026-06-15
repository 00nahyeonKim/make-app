import type { ReactNode } from "react";
import { useAuthStore } from "../stores/authStore";
import { Navigate, useLocation } from "react-router";
import LoadingSpinner from "../components/LoadingSpinner";

interface ProtectedRouteProps {
  children: ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const status = useAuthStore((state) => state.status);
  const location = useLocation();

  // 로그인 여부 확인하는 중에는
  // 보호 페이지나 로그인 페이지 바로 보여주지 않음
  if (status == "checking") {
    return (
      <LoadingSpinner fullScreen message="로그인 상태를 확인하는 중이에요" />
    );
  }

  // 로그인하지 않은 사용자는 로그인 페이지로 이동
  if (status == "unauthenticated") {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  // authenticated 상태일 때만 보호 페이지를 보여줌
  return children;
}

export default ProtectedRoute;
