import { useNavigate } from "react-router";
import Button from "../components/Button";
import { ChevronsDown } from "lucide-react";
import main1Image from "../assets/main_1.webp";
import main2Image from "../assets/main_2.webp";
import main3Image from "../assets/main_3.webp";
import { useEffect, useRef, useState } from "react";

const mainImages = [
  { src: main1Image, alt: "픽타임 서비스 소개" },
  { src: main2Image, alt: "픽타임 사용 방법" },
  { src: main3Image, alt: "픽타임 핵심 기능" },
];

function MainPage() {
  const navigate = useNavigate();

  const pageEndRef = useRef<HTMLDivElement | null>(null);
  const [showScrollHint, setShowScrollHint] = useState(true);

  const handleCreateMeeting = () => {
    navigate("/meetings/new");
  };

  useEffect(() => {
    const pageEndElement = pageEndRef.current;

    if (!pageEndElement) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowScrollHint(!entry.isIntersecting);
      },
      {
        threshold: 0.1,
      },
    );

    observer.observe(pageEndElement);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="relative min-h-full bg-[#F8EFE5]">
      <div className="relative min-h-dvh">
        {mainImages.map((image) => (
          <img
            key={image.src}
            src={image.src}
            alt={image.alt}
            draggable={false}
            className="block h-auto w-full select-none"
          />
        ))}

        <div ref={pageEndRef} className="h-1" />
      </div>

      <div className="sticky bottom-0 z-20 bg-linear-to-t from-white via-white via-65% to-transparent px-4 pb-5 pt-16">
        <div
          className={[
            "pointer-events-none mb-2 flex items-center justify-center gap-1",
            "text-[#f59a58] transition-all duration-300 motion-safe:animate-bounce",
            showScrollHint
              ? "translate-y-0 opacity-100"
              : "translate-y-3 opacity-0",
          ].join(" ")}
        >
          <ChevronsDown size={24} strokeWidth={2} />
          <p className="text-base font-bold">스크롤 해 보세요</p>
        </div>

        <Button fullWidth onClick={handleCreateMeeting}>
          시작하기
        </Button>
      </div>
    </div>
  );
}

export default MainPage;
