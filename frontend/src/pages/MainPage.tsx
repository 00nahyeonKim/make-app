import { useNavigate } from "react-router";
import Button from "../components/Button";
import mascotImage from "../assets/mascot.png";

function MainPage() {
  const navigate = useNavigate();

  const handleCreateMeeting = () => {
    navigate("/meetings/new");
  };

  return (
    <section className="relative flex min-h-dvh flex-col items-center px-5 pb-28 pt-20 text-center">
      <div className="flex flex-col items-center">
        <h1 className="text-[52px] font-black leading-none tracking-[-0.08em] text-[#f59a58]">
          픽타임
        </h1>

        <p className="mt-4 text-sm font-bold tracking-[-0.03em] text-[#f59a58]">
          쉽고 빠른 약속 정하기
        </p>
      </div>

      <div className="mt-12">
        <div className="mx-auto mb-7 h-9 w-9 rounded-fill">
          <Mascot />
        </div>
      </div>

      <div className="absolute bottom-20 left-0 right-0 flex justify-center">
        <p className="text-sm font-bold text-[#f59a58]">˅ 스크롤 해 보세요</p>
      </div>

      <div className="absolute bottom-5 left-4 right-4">
        <Button fullWidth onClick={handleCreateMeeting}>
          일정 등록하기
        </Button>
      </div>
    </section>
  );
}

function Mascot() {
  return (
    <img src={mascotImage} alt="픽타임 캐릭터" className="mx-auto w-62.5" />
  );
}

export default MainPage;
