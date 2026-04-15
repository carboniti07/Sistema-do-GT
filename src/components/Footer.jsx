import React from "react";
import { Instagram, Linkedin, MessageCircle } from "lucide-react";

export default function Footer({ className = "" }) {
  const ano = new Date().getFullYear();

  return (
    <div className={`w-full mt-6 pt-2 flex items-center justify-center ${className}`}>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          © {ano}
          <span className="text-foreground/60">Desenvolvido por</span>
          <span className="font-semibold text-primary">Carboni</span>
        </span>

        <div className="flex items-center gap-2 ml-1">
          <a
            href="https://www.instagram.com/carboni._/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:opacity-80 transition"
          >
            <Instagram size={16} />
          </a>

          <a
            href="https://www.linkedin.com/in/matheus-carboni-332a97304/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:opacity-80 transition"
          >
            <Linkedin size={16} />
          </a>

          <a
            href="https://wa.me/5511994551544"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:opacity-80 transition"
          >
            <MessageCircle size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}