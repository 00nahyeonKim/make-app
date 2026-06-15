import { useNavigate } from "react-router";
import { useAuthStore } from "../stores/authStore";
import { useEffect, useState } from "react";
import { LogOut, X } from "lucide-react";
import { logout } from "../api/authApi";
import { getApiErrorMessage } from "../api/httpClient";

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const setUnauthenticated = useAuthStore((state) => state.setUnauthenticated);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // 사이드바 열려있을 때 배경화면 스크롤 방지, ESC로 닫을 수 있게 함
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    setErrorMessage("");

    try {
      // 백엔드가 access_token과 refresh_token, HttpOnly Cookie를 삭제
      await logout();

      // Zustand와 localStorage에 남아있는 사용자 정보 초기화
      setUnauthenticated();

      onClose();

      navigate("/", {
        replace: true,
      });
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "로그아웃에 실패했습니다."));
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div
      className={[
        "fixed inset-0 z-50",
        isOpen ? "pointer-events-auto" : "pointer-events-none",
      ].join(" ")}
      aria-hidden={!isOpen}
    >
      {/* 사이드바 바깥의 어두운 배경 */}
      <button
        type="button"
        aria-label="사이드바 닫기"
        onClick={onClose}
        className={[
          "absolute inset-0 bg-black/35 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0",
        ].join(" ")}
      />
      {/* 왼쪽에서 열리는 사이드바 */}
      <aside
        id="app-sidebar"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sidebar-title"
        className={[
          "absolute left-0 top-0 flex h-full w-[82%] max-w-77.5",
          "flex-col bg-white shadow-2xl transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-14 items-center justify-between border-b border-[#eeeeee] px-5">
          <h2
            id="sidebar-title"
            className="text-[17px] font-bold tracking-[-0.04em] text-[#222222]"
          >
            메뉴
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="사이드바 닫기"
            className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#f5f5f5]"
          >
            <X size={24} strokeWidth={2.2} />
          </button>
        </div>

        <div className="flex flex-1 flex-col px-5 py-6">
          <div className="rounded-xl bg-[#f8f6f1] px-4 py-4">
            <p className="text-[12px] font-medium text-[#999999]">
              로그인한 사용자
            </p>

            <p className="mt-1 text-[17px] font-bold tracking-[-0.04em] text-[#222222]">
              {user?.name ?? "사용자"}님
            </p>
          </div>

          {errorMessage && (
            <p className="mt-4 text-[13px] font-medium leading-5 text-[#e05a47]">
              {errorMessage}
            </p>
          )}

          <div className="mt-auto border-t border-[#eeeeee] pt-5">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={[
                "flex h-12 w-full items-center justify-center gap-2 rounded-lg",
                "bg-[#444444] text-[15px] font-bold text-white transition",
                "hover:bg-[#333333]",
                "disabled:cursor-not-allowed disabled:opacity-50",
              ].join(" ")}
            >
              <LogOut size={20} strokeWidth={2.2} />

              {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default AppSidebar;
