import { useNavigate } from "react-router";
import loginIllustration from "../assets/mascot.png";
import kakaoLoginButtonImage from "../assets/kakao-login-button.png";
import Header from "../layouts/Header";
import { ChevronLeft } from "lucide-react";

function LoginPage() {
  const navigate = useNavigate();

  const handleKakaoLogin = () => {
    // 나중에 카카오 OAuth URL로 이동하도록 연결
    console.log("카카오 로그인 클릭");
  };
  return (
    <section className="flex min-h-full flex-col">
      <Header
        title="로그인"
        left={
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="뒤로가기"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f5f5f5]">
            <ChevronLeft size={26} strokeWidth={2.4} />
          </button>
        }></Header>

      <main className="flex flex-1 flex-col items-center px-7 pt-12 text-center">
        <img
          src={loginIllustration}
          alt="일정 등록 일러스트"
          className="w-60 object-contain"
        />

        <h2 className="mt-4 whitespace-pre-line text-[22px] font-bold leading-[1.35] tracking-[-0.06em] text-[#111111]">
          모임 생성을 위해 로그인해주세요
        </h2>

        <p className="mt-3 whitespace-pre-line text-[15px] font-semibold leading-6 tracking-[-0.04em] text-[#777777]">
          리더는 카카오 로그인 후 일정을 등록할 수 있어요
        </p>

        <button
          type="button"
          onClick={handleKakaoLogin}
          aria-label="카카오톡으로 로그인"
          className="mt-9 overflow-hidden rounded-lg transition active:scale-[0.99]">
          <img
            src={kakaoLoginButtonImage}
            alt="카카오톡으로 로그인"
            className="h-12 justify-center"
          />
        </button>

        <p className="mt-5 text-[13px] font-semibold tracking-[-0.04em] text-[#8d8d8d]">
          로그인 시 다른 기기에서도 관리 가능해요
        </p>

        <div className="mt-8 h-px w-full bg-[#eeeeee]" />

        <p className="mt-6 whitespace-pre-line text-[12px] font-medium leading-5 tracking-[-0.04em] text-[#aaaaaa]">
          로그인 시 <span className="font-bold text-[#777777]">이용약관</span>{" "}
          및 <span className="font-bold text-[#777777]">개인정보 처리방침</span>
          에{"\n"}동의하게 됩니다.
        </p>
      </main>
    </section>
  );
}

export default LoginPage;
