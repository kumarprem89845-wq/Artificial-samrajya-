import React from "react";
import { motion } from "motion/react";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  ariaLabel?: string;
  size?: "sm" | "md";
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  id,
  name,
  ariaLabel,
  size = "md"
}) => {
  const isSm = size === "sm";

  const trackWidth = isSm ? "w-9" : "w-11";
  const trackHeight = isSm ? "h-5" : "h-6";
  const thumbSize = isSm ? "w-3.5 h-3.5" : "w-4 h-4";
  const translateDist = isSm ? "16px" : "20px";

  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <button
      type="button"
      id={id}
      name={name}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      className={`
        relative inline-flex items-center shrink-0 cursor-pointer rounded-full p-0.5
        ${trackWidth} ${trackHeight}
        transition-colors duration-200 ease-in-out select-none
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1D24]
        ${disabled ? "opacity-40 cursor-not-allowed" : "active:scale-95"}
        ${
          checked
            ? "bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] shadow-[0_0_12px_rgba(255,107,0,0.35)]"
            : "bg-[#252A34] hover:bg-[#2E3440] border border-white/10"
        }
      `}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        animate={{
          x: checked ? translateDist : "0px"
        }}
        className={`
          ${thumbSize}
          pointer-events-none inline-block rounded-full bg-white shadow-md transform transition-shadow
          ${checked ? "shadow-black/40" : "shadow-black/20 bg-gray-200"}
        `}
      />
    </button>
  );
};
