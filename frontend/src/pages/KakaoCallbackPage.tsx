import { useNavigate, useSearchParams } from "react-router";
import { useAuthStore } from "../stores/authStore";
import { useEffect, useState } from "react";
import { loginWithKakao } from "../api/authApi";
import { useGuestStore } from "../stores/guestStore";
import { createParticipant } from "../api/participantApi";
import { ApiError } from "../api/httpClient";

function KakaoCallbackPage() {
  const navigate = useNavigate(); // 로그인 성공 후 다른 페이지 이동시 사용
  const [searchParams] = useSearchParams(); // URL query string 값 읽을 때 사용

  // URL에서 code와 error 꺼내기
  const code = searchParams.get("code");
  const kakaoError = searchParams.get("error");

  // 로그인 성공 시 호출
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  // 로그인 실패, 취소, code 없음, 인증 만료 시 호출
  const setUnauthenticated = useAuthStore((state) => state.setUnauthenticated);
  const setGuest = useGuestStore((state) => state.setGuest);

  const [message, setMessage] = useState("카카오 로그인 처리 중입니다.");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (kakaoError) {
      setUnauthenticated();
      setErrorMessage("카카오 로그인이 취소되었거나 실패했습니다.");
      setMessage("");
      return;
    }

    if (!code) {
      setUnauthenticated();
      setErrorMessage("카카오 인가 코드가 없습니다. 다시 로그인해주세요.");
      setMessage("");
      return;
    }

    const requestKakaoLogin = async () => {
      try {
        const loginResponse = await loginWithKakao(code);
        setAuthenticated(loginResponse.user);

        // 초대 흐름에서 온 경우: 돌아가서 참여까지 처리\
        const pendingInviteToken = sessionStorage.getItem("pendingInviteToken");
        if (pendingInviteToken) {
          sessionStorage.removeItem("pendingInviteToken"); // 한 번 쓰고 지움
          try {
            const participant = await createParticipant(pendingInviteToken);
            setGuest(participant);
            navigate(`/invite/${pendingInviteToken}`, { replace: true });
          } catch (err) {
            if (err instanceof ApiError && err.code === "DISPLAY_NAME_TAKEN") {
              // 카카오 닉네임이 이미 있음 -> 별칭 입력 모달로
              navigate(`/invite/${pendingInviteToken}/guest?alias=1`, {
                replace: true,
              });
            } else {
              // 이미 참가(DUPLICATE_PARTICIPATION) 등은 그냥 초대 화면으로
              navigate(`/invite/${pendingInviteToken}`, { replace: true });
            }
          }
          return;
        }

        // 일반 로그인(모임 생성 흐름)
        navigate("/meetings/new", {
          replace: true,
        });
      } catch (error) {
        setUnauthenticated();

        const message =
          error instanceof Error
            ? error.message
            : "카카오 로그인 처리 중 오류가 발생했습니다.";

        setErrorMessage(message);
        setMessage("");
      }
    };

    requestKakaoLogin();
  }, [
    code,
    kakaoError,
    navigate,
    setAuthenticated,
    setUnauthenticated,
    setGuest,
  ]);

  return (
    <section className="flex min-h-full flex-col items-center justify-center px-7 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fff4e6]">
        <span className="text-2xl">⏳</span>
      </div>

      <h1 className="mt-5 text-[20px] font-bold tracking-tighter text-[#111111]">
        로그인 확인 중
      </h1>

      {message && (
        <p className="mt-3 whitespace-pre-line text-[14px] font-medium leading-6 tracking-[-0.04em] text-[#777777]">
          {message}
        </p>
      )}

      {errorMessage && (
        <>
          <p className="mt-3 whitespace-pre-line text-[14px] font-medium leading-6 tracking-[-0.04em] text-[#e05a47]">
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            className="mt-7 h-12 w-full rounded-lg bg-[#444444] text-[15px] font-bold text-white"
          >
            로그인 화면으로 돌아가기
          </button>
        </>
      )}
    </section>
  );
}

export default KakaoCallbackPage;
