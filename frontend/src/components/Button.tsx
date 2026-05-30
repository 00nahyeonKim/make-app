import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "dark" | "orange";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

const variantClass: Record<ButtonVariant, string> = {
  dark: "bg-[#444444] text-white hover:bg-[#333333]",
  orange: "bg-[#f59a58] text-white hover:bg-[#ef8840]",
};

function Button({
  children,
  variant = "dark",
  fullWidth = false,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        "h-12 rounded-lg px-5 text-base font-bold transition disabled:cursor-not-allowed disabled:opacity-50",
        variantClass[variant],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      {...props}>
      {children}
    </button>
  );
}

export default Button;
