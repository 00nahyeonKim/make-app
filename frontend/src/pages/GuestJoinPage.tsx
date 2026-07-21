import { useNavigate, useParams, useSearchParams } from "react-router";
import { useGuestStore } from "../stores/guestStore";
import { useState, type ChangeEvent, type SyntheticEvent } from "react";
import { ApiError, getApiErrorMessage } from "../api/httpClient";
import { loginGuest, registerGuest } from "../api/authApi";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import Header from "../layouts/Header";
import kakaoLoginButtonImage from "../assets/kakao-login-button.png";
import Button from "../components/Button";
import type { Participant } from "../types/participant";
import { createParticipant } from "../api/participantApi";
import AliasModal from "../components/AliasModal";

const MAX_NAME_LENGTH = 20;
const KAKAO_AUTH_URL = "https://kauth.kakao.com/oauth/authorize";

function GuestJoinPage() {
  const { inviteToken } = useParams<{ inviteToken: string }>();
  const navigate = useNavigate();
  const setGuest = useGuestStore((state) => state.setGuest);

  const [displayName, setDisplayName] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [searchParams] = useSearchParams();
  // 콜백에서 ?alias=1 로 들어오면 모달 열기
  const [aliasOpen, setAliasOpen] = useState(searchParams.get("alias") === "1");
  const [aliasLoading, setAliasLoading] = useState(false);
  const [aliasError, setAliasError] = useState("");

  // 별칭으로 소셜 재참여
  const handleAliasSubmit = async (alias: string) => {
    if (!inviteToken) return;
    setAliasError("");
    setAliasLoading(true);
    try {
      const participant = await createParticipant(inviteToken, alias);
      setGuest(participant);
      navigate(`/invite/${inviteToken}`);
    } catch (err) {
      if (err instanceof ApiError && err.code === "DISPLAY_NAME_TAKEN") {
        setAliasError(getApiErrorMessage(err, "별칭 등록에 실패했어요."));
      }
    } finally {
      setAliasLoading(false);
    }
  };

  // PIN: 숫자만 남기고 최대 4자리로 자름
  const handlePinChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
  };

  // 카카오 인증 페이지로 이동(LoginPage와 동일)
  const handleKakaoLogin = () => {
    const kakaoRestApiKey = import.meta.env.VITE_KAKAO_REST_API_KEY;
    const kakaoRedirectUri = import.meta.env.VITE_KAKAO_REDIRECT_URI;

    if (!kakaoRestApiKey || !kakaoRedirectUri) {
      alert("카카오 로그인 환경변수가 설정되지 않았습니다.");
      return;
    }

    // 로그인 후 돌아와서 참여하도록 토큰을 sessionStorage에 저장(전체 리다이렉트로 메모리는 사라짐)
    if (inviteToken) {
      sessionStorage.setItem("pendingInviteToken", inviteToken);
    }

    const params = new URLSearchParams({
      client_id: kakaoRestApiKey,
      redirect_uri: kakaoRedirectUri,
      response_type: "code",
    });

    window.location.href = `${KAKAO_AUTH_URL}?${params.toString()}`;
  };

  // 비회원 참여 - 이름 + PIN
  const handleGuestJoin = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = displayName.trim();
    if (!name) {
      setError("이름을 입력해주세요.");
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setError("PIN은 숫자 4자리에요.");
      return;
    }
    if (!inviteToken) return;

    setError("");
    setLoading(true);
    try {
      let participant: Participant;
      try {
        // 같은 이름 + 맞는 PIN이면 기존 사용자로 재입장
        participant = await loginGuest({ inviteToken, displayName: name, pin });
      } catch (err) {
        if (err instanceof ApiError && err.code === "GUEST_NOT_FOUND") {
          // 새 이름이면 등록
          participant = await registerGuest({
            inviteToken,
            displayName: name,
            pin,
          });
        } else {
          throw err; // PIN_MISMATCH 등은 그대로 메시지 표시
        }
      }
      setGuest(participant); // 게스트 정보 저장(인증은 서버가 준 HttpOnly 쿠키)
      navigate(`/invite/${inviteToken}`);
    } catch (err) {
      setError(getApiErrorMessage(err, "참여 등록에 실패했어요."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex h-full flex-col bg-white">
      <Header
        title="로그인"
        left={
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="뒤로 가기"
            className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#f5f5f5]"
          >
            <ChevronLeft size={24} />
          </button>
        }
      />

      <div className="flex flex-1 flex-col px-6 py-8">
        <div className="flex flex-col mt-12 items-center text-center">
          <h1 className="text-[22px] font-black text-[#2d2d2d]">
            일정 등록을 위해 로그인해주세요
          </h1>
          <p className="mt-2 text-[15px] text-[#8a8a8a]">
            참여자 확인을 위해 이름 또는 카카오 로그인이 필요해요
          </p>

          {/* 카카오 로그인 */}
          <button
            type="button"
            onClick={handleKakaoLogin}
            aria-label="카카오톡으로 로그인"
            className="mt-9 overflow-hidden rounded-lg transition active:scale-[0.99]"
          >
            <img
              src={kakaoLoginButtonImage}
              alt="카카오톡으로 로그인"
              className="h-12 justify-center"
            />
          </button>
        </div>

        <p className="mt-4 text-center text-[14px] text-[#9b9b9b]">
          로그인 시 다른 기기에서도 사용 가능합니다
        </p>

        {/* 구분선 */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#eeeeee]" />
          <span className="text-[12px] text-[#b8b8b8]">또는</span>
          <div className="h-px flex-1 bg-[#eeeeee]" />
        </div>

        {/* 비회원: 이름 + PIN */}
        <form
          onSubmit={handleGuestJoin}
          className="space-y-3 mx-auto w-full max-w-86 flex flex-col"
        >
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={MAX_NAME_LENGTH}
            placeholder="이름을 입력하세요"
            className="h-12 rounded-lg border border-[#cfcfcf] px-4 text-ms outline-none focus:border-[#f59a58]"
          />
          <div className="relative w-full">
            <input
              value={pin}
              onChange={handlePinChange}
              inputMode="numeric"
              type={showPin ? "text" : "password"}
              placeholder="PIN 숫자 4자리"
              className="h-12 w-full rounded-lg border border-[#cfcfcf] px-4 pr-11 text-ms tracking-[0.3em] placeholder:tracking-normal outline-none focus:border-[#f59a58]"
            />
            <button
              type="button"
              onClick={() => setShowPin((v) => !v)}
              aria-label={showPin ? "PIN 숨기기" : "PIN 보기"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9b9b9b]"
            >
              {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {error && (
            <p className="text-xs font-semibold text-[#fc3a3a]">{error}</p>
          )}
          <Button type="submit" variant="dark" fullWidth disabled={loading}>
            {loading ? "참여 중..." : "비회원 로그인"}
          </Button>
        </form>

        <p className="mt-4 text-center text-[14px] text-[#9b9b9b]">
          PIN은 다른 기기에서 다시 들어올 때 본인 확인에 사용돼요
        </p>
      </div>

      <AliasModal
        open={aliasOpen}
        loading={aliasLoading}
        error={aliasError}
        onSubmit={handleAliasSubmit}
        onClose={() => setAliasOpen(false)}
      />
    </section>
  );
}

export default GuestJoinPage;
