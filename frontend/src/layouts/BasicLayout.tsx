import { useEffect } from "react";
import { Outlet } from "react-router";
import { useAuthStore } from "../stores/authStore";
import { refreshAccessToken } from "../api/authApi";

function BasicLayout() {
  useEffect(() => {
    // 현재 스토어 값/액션을 한 번만 꺼내옴
    const { user, setChecking, setAuthenticated, setUnauthenticated } = useAuthStore.getState();

    // localStorage에 사용자 정보가 없으면 검증할 것도 없음
    if (!user) {
      return;
    }

    setChecking(); // 검증 중 -> ProtectedRoute는 스피너 표시

    refreshAccessToken()
      .then(() => {
        // refresh 성공 = 세션 유효 -> 저장돼 있던 사용자로 로그인 확정
        setAuthenticated(user);
      })
      .catch(() => {
        // refresh 실패(만료/없음) = 세션 죽음 -> 로그아웃 처리
        setUnauthenticated();
      });
  }, []); // 마운트 시 1회만
  
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
