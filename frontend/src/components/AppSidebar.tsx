import { useNavigate } from "react-router";
import { useAuthStore } from "../stores/authStore";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  LogOut,
  UserCog,
  X,
} from "lucide-react";
import { logout } from "../api/authApi";
import { getApiErrorMessage } from "../api/httpClient";
import { useGuestStore } from "../stores/guestStore";
import logo from "../assets/logo.png"; // 로고 이미지

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const guest = useGuestStore((state) => state.guest);
  const displayName = guest?.displayName ?? user?.name ?? "비로그인";
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

  // 메뉴 클릭: 사이드바 닫고 해당 경로로 이동
  const go = (path: string) => {
    onClose();
    navigate(path);
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
          "flex-col bg-white transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-16 items-center justify-between border-b border-[#f0ece4] px-5">
          <button
            type="button"
            onClick={() => go("/")}
            aria-label="홈으로 이동"
            className="flex items-center rounded-lg transition hover:opacity-90"
          >
            <img
              id="sidebar-title"
              src={logo}
              alt="픽타임"
              className="h-10 w-auto"
            />
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="사이드바 닫기"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#555555] transition hover:bg-[#f5f5f5]"
          >
            <X size={24} strokeWidth={2.2} />
          </button>
        </div>

        <div className="flex flex-1 flex-col px-5 py-6">
          {/* 프로필: displayName 강조 */}
          <div className="flex items-center gap-3 rounded-2xl bg-linear-to-br from-[#fff3e9] to-[#fde3cf] px-4 py-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f59a58] text-[18px] font-bold text-white">
              {displayName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[17px] font-bold tracking-[-0.04em] text-[#2d2d2d]">
                {displayName}님
              </p>
              <p className="text-[12px] font-semibold text-[#555555]">
                오늘도 약속을 잡아볼까요?
              </p>
            </div>
          </div>

          {/* 하위 메뉴 */}
          <nav className="mt-6 flex flex-col gap-1">
            {[
              { label: "내 정보 수정", icon: UserCog, path: "/mypage/edit" },
              {
                label: "모임 생성하기",
                icon: CalendarPlus,
                path: "/meetings/new",
              },
              { label: "내 모임 보기", icon: CalendarDays, path: "/" },
            ].map(({ label, icon: Icon, path }) => (
              <button
                key={label}
                type="button"
                onClick={() => go(path)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-[#f8f6f1]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff3e9] text-[#f59a58]">
                  <Icon size={18} strokeWidth={2.2} />
                </span>
                <span className="flex-1 text-[15px] font-semibold text-[#333333]">
                  {label}
                </span>
                <ChevronRight size={18} className="text-[#c4c4c4]" />
              </button>
            ))}
          </nav>

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
