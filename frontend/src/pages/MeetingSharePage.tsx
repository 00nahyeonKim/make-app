import { useNavigate } from "react-router";
import { useMeetingDraftStore } from "../stores/meetingDraftStore";
import Button from "../components/Button";
import Header from "../layouts/Header";

function MeetingSharePage() {
  const navigate = useNavigate();
  const created = useMeetingDraftStore((state) => state.created);

  // 새로고침 등으로 생성 결과가 없으면 만들기 화면으로 안내
  if (!created) {
    return (
      <section className="flex h-full flex-col items-center justify-center gap-4 bg-white px-6">
        <p className="text-sm font-semibold text-[#9b9b9b]">
          공유할 모임 정보가 없어요.
        </p>
        <Button onClick={() => navigate("/meetings/new")}>
          새 모임 만들기
        </Button>
      </section>
    );
  }

  return (
    <section className="flex h-full flex-col bg-white">
      <Header title="초대 링크 공유" />

      <div className="flex flex-1 flex-col gap-5 px-6 py-6">
        <div>
          <p className="text-[13px] font-bold text-[#4a4a4a]">모임 이름</p>
          <p className="mt-1 text-[18px] font-black text-[#2d2d2d]">
            {created.name}
          </p>
        </div>

        <div>
          <p className="text-[13px] font-bold text-[#4a4a4a]">초대 URL</p>
          <p className="mt-1 break-all rounded-lg bg-[#f6f6f6] px-3 py-2 text-[13px] text-[#555555]">
            {created.inviteUrl}
          </p>
        </div>

        <div>
          <p className="text-[13px] font-bold text-[#4a4a4a]">결과 URL</p>
          <p className="mt-1 break-all rounded-lg bg-[#f6f6f6] px-3 py-2 text-[13px] text-[#555555]">
            {created.resultUrl}
          </p>
        </div>

        <p className="text-[12px] text-[#bbbbbb]">
          ※ 복사 버튼과 디자인은 4일차에 추가할 예정이에요.
        </p>
      </div>
    </section>
  );
}

export default MeetingSharePage;
