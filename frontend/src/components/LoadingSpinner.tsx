import spinnerImage from "../assets/loading-spinner.svg";

type LoadingSpinnerSize = "sm" | "md" | "lg";

type LoadingSpinnerProps = {
  message?: string;
  size?: LoadingSpinnerSize;
  fullScreen?: boolean;
  className?: string;
};

const spinnerSizeClass: Record<LoadingSpinnerSize, string> = {
  sm: "h-10 w-10",
  md: "h-16 w-16",
  lg: "h-24 w-24",
};

function LoadingSpinner({
  message = "잠시만 기다려주세요",
  size = "lg",
  fullScreen = false,
  className = "",
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        "flex flex-col items-center justify-center gap-4 text-center",
        fullScreen ? "min-h-[calc(100dvh-56px)] px-5" : "py-10",
        className,
      ].join(" ")}>
      <img
        src={spinnerImage}
        alt=""
        className={[
          "animate-spin [animation-duration:2s] motion-reduce:animate-none",
          spinnerSizeClass[size],
        ].join(" ")}
      />

      {message && (
        <p className="text-sm font-semibold text-[#6f6258]">{message}</p>
      )}
    </div>
  );
}

export default LoadingSpinner;
