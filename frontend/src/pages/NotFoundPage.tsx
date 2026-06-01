import { Link } from "react-router";

function NotFoundPage() {
  return (
    <section className="flex min-h-dvh flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-bold">페이지를 찾을 수 없습니다</h1>
      <p className="mt-2 text-sm text-slate-50">
        주소가 잘못되었거나 존재하지 않는 페이지입니다.
      </p>

      <Link
        to="/"
        className="mt-6 rounded-xl bg-[#f59a58] px-5 py-3 text-sm font-bold text-white">
        메인으로 이동
      </Link>
    </section>
  );
}

export default NotFoundPage;
