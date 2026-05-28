import React from "react";
import logoImg from "../assets/logo-gt.png";

export default function Logo({ size = "hero" }) {
  const sizes = {
    sm: "h-14 max-w-[180px]",
    md: "h-20 max-w-[220px]",
    lg: "h-28 max-w-[280px]",
    xl: "h-36 max-w-[320px]",
    login: "h-24 md:h-28 max-w-[260px]",
    cadastro: "h-24 md:h-28 max-w-[260px]",
    hero: "h-44 md:h-52 lg:h-56 max-w-[420px]",
  };

  return (
    <img
      src={logoImg}
      alt="Geração Teen"
      className={`${sizes[size] || sizes.hero} w-auto object-contain select-none`}
      draggable="false"
    />
  );
}