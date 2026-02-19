import React from "react";
import logoImg from "../assets/umadrur-logo-cropped.png";

export default function Logo({ size = "hero" }) {
  const sizes = {
    sm: "h-16 max-w-[220px]",
    md: "h-24 max-w-[260px]",
    lg: "h-32 max-w-[320px]",
    xl: "h-44 max-w-[360px]",
    login: "h-28 md:h-36 max-w-[320px]",
    cadastro: "h-36 md:h-44 max-w-[420px]", // ✅ novo: ideal para o Cadastro
    hero: "h-56 md:h-64 lg:h-72 max-w-[520px]",
  };

  return (
    <img
      src={logoImg}
      alt="UMADRUR"
      className={`${sizes[size] || sizes.hero} w-auto object-contain select-none`}
      draggable="false"
    />
  );
}
