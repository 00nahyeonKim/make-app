import { Link } from "react-router";
import mascotImage from "../assets/404-error.png";

function NotFoundPage() {
  return (
    <section className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#eee8dc] px-5 py-16 text-center">
      <div className="absolute -left-16 top-16 h-40 w-40 rounded-full bg-[#f59a58]/15" />
      <div className="absolute -right-20 bottom-20 h-52 w-52 rounded-full bg-white/50" />

      <div className="relative flex w-full max-w-85 flex-col items-center">
        <img
          src={mascotImage}
          alt="길을 잃은 픽타임 마스코트"
          className="h-60 w-60 object-contain drop-shadow-[0_18px_24px_rgba(94,75,58,0.18)]"
        />

        <h1 className="text-2xl font-extrabold leading-snug text-[#2f2a26]">
          페이지를 찾을 수 없어요
        </h1>

        <p className="mt-3 text-sm leading-6 text-[#6f6258]">
          주소가 잘못 입력되었거나,
          <br />더 이상 사용할 수 없는 페이지일 수 있어요.
        </p>

        <div className="mt-8 flex w-full flex-col gap-3">
          <Link
            to="/"
            className="flex h-12 items-center justify-center rounded-xl bg-[#f59a58] text-base font-bold text-white shadow-[0_8px_18px_rgba(245,154,88,0.35)] transition hover:bg-[#ef8840]">
            메인으로 이동
          </Link>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex h-12 items-center justify-center rounded-xl border border-[#ead7c5] bg-white text-base font-bold text-[#6f6258] transition hover:bg-[#fff7ef]">
            이전 페이지로 돌아가기
          </button>
        </div>
      </div>
    </section>
  );
}

export default NotFoundPage;
