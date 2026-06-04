import { useState } from "react";
import type { ChangeEvent, SubmitEventHandler } from "react";
import { useNavigate } from "react-router";
import Button from "../components/Button";
import { Minus, Plus } from "lucide-react";

const MAX_MEETING_NAME_LENGTH = 10;
const MIN_PARTICIPANT_COUNT = 1;
const MAX_PARTICIPANT_COUNT = 99;

function MeetingCreatePage() {
  const navigate = useNavigate();

  const [meetingName, setMeetingName] = useState("");
  const [participantCount, setParticipantCount] = useState(1);
  const [isUndecided, setIsUndecided] = useState(false);

  // 약속 이름 input 값이 바뀔 때 실행되는 함수
  const handleMeetingNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    if (value.length > MAX_MEETING_NAME_LENGTH) {
      return;
    }
    setMeetingName(value);
  };

  // 참여 인원 감소 버튼 클릭시 실행되는 함수
  const handleDecrease = () => {
    if (isUndecided) {
      return;
    }
    // 이전 인원 수에서 1을 빼되, 최소값보다는 작아지지 않게 함
    setParticipantCount((prevCount) =>
      Math.max(MIN_PARTICIPANT_COUNT, prevCount - 1),
    );
  };

  // 참여 인원 증가 버튼 클릭시 실행되는 함수
  const handleIncrease = () => {
    if (isUndecided) {
      return;
    }
    // 이전 인원 수에서 1을 더하되, 최대값보다는 커지지 않게 함
    setParticipantCount((prevCount) =>
      Math.min(MAX_PARTICIPANT_COUNT, prevCount + 1),
    );
  };

  // "아직 안정했어요" 체크박스 값이 바뀔 때 실행되는 함수
  const handleUndecidedChange = (event: ChangeEvent<HTMLInputElement>) => {
    // 체크되어 있으면 true, 체크 해제되어 있으면 false가 저장
    setIsUndecided(event.target.checked);
  };

  // form이 제출될 때 실행되는 함수
  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();

    console.log({
      meetingName,
      expectedCount: isUndecided ? null : participantCount,
    });
    navigate("/meetings/new/slots");
  };

  return (
    <section className="flex min-h-full flex-col">
      <div className="flex h-62.5 shrink-0 items-center justify-center text-[#f59a58] text-[52px] font-black">
        픽타임
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col rounded-t-4xl bg-white px-7 pb-6 pt-7">
        <div className="flex-1">
          <h1 className="text-[24px] font-black tracking-tighter text-[#2d2d2d]">
            어떤 약속인가요?
          </h1>

          <div className="mt-8">
            <label
              htmlFor="meetingName"
              className="block text-[15px] font-bold tracking-[-0.04em] text-[#4a4a4a]">
              약속 이름을 입력하세요
              <span className="text-[#fc3a3a]">*</span>
            </label>

            <input
              id="meetingName"
              value={meetingName}
              onChange={handleMeetingNameChange}
              placeholder="최대 10자 입력 가능"
              className="mt-2 h-10 w-full border border-[#cfcfcf] px-4 text-sm font-semibold text-[#333333] outline-none placeholder:text-[#b8b8b8] focus:border-[#f59a58]"
            />
          </div>

          <div className="mt-6">
            <p className="text-[15px] font-bold tracking-[-0.04em] text-[#4a4a4a]">
              약속 참여 인원을 입력하세요
            </p>

            <div
              className={[
                "mt-3 flex h-10 items-center border border-[#cfcfcf] bg-white",
                isUndecided ? "opacity-50" : "",
              ].join(" ")}>
              <button
                type="button"
                onClick={handleDecrease}
                disabled={
                  isUndecided || participantCount <= MIN_PARTICIPANT_COUNT
                }
                className="flex h-full w-16 items-center justify-center text-2xl font-light text-[#555555] disabled:text-[#cfcfcf]">
                <Minus size={24} strokeWidth={2} />
              </button>

              <div className="flex-1 text-center text-lg font-bold text-[#555555]">
                {participantCount}
              </div>

              <button
                type="button"
                onClick={handleIncrease}
                disabled={
                  isUndecided || participantCount >= MAX_PARTICIPANT_COUNT
                }
                className="flex h-full w-16 items-center justify-center text-2xl font-light text-[#555555] disabled:text-[#cfcfcf]">
                <Plus size={24} strokeWidth={2} />
              </button>
            </div>

            <label className="mt-2 flex h-8 cursor-pointer items-center rounded border border-[#e5e5e5] bg-white px-2 text-[13px] font-semibold tracking-[-0.03em] text-[#9b9b9b]">
              <input
                type="checkbox"
                checked={isUndecided}
                onChange={handleUndecidedChange}
                className="mr-1.5 h-3.5 w-3.5 accent-[#bdbdbd]"
              />
              아직 안정했어요
            </label>
          </div>
        </div>

        <Button type="submit" fullWidth>
          다음
        </Button>
      </form>
    </section>
  );
}

export default MeetingCreatePage;
