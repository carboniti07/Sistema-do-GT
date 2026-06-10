import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  Users,
  HeartHandshake,
  ExternalLink,
} from "lucide-react";

import Logo from "../components/Logo";
import Card from "../components/Card";
import Button from "../components/Button";
import Footer from "../components/Footer";

import bgImg from "../assets/bg-visitors.png";

const UMADRUR_CADASTRO_URL =
  import.meta.env.VITE_UMADRUR_CADASTRO_URL ||
  "https://cadastroumadrur.adbrr.com.br";

export default function InicioCadastro() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8 bg-cover bg-center"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(255,160,60,0.92), rgba(255,70,0,0.92)), url(${bgImg})`,
      }}
    >
      <div className="w-full max-w-[920px]">
        <Card className="bg-card/94 border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.18)] rounded-3xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-6 lg:gap-8 items-center">
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <Logo size="cadastro" />

              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                Cadastro oficial
              </div>

              <h1 className="mt-4 text-2xl md:text-4xl font-heading font-bold text-foreground leading-tight">
                Geração Teen
              </h1>

              <p className="mt-2 text-base md:text-lg text-muted-foreground leading-relaxed">
                Cadastro oficial dos adolescentes do campo da AD Brás Rudge Ramos.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Link to="/cadastro" className="w-full sm:w-auto">
                  <Button fullWidth>
                    Iniciar cadastro
                    <ArrowRight size={18} />
                  </Button>
                </Link>

                <a
                  href={UMADRUR_CADASTRO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-surface-2 transition-colors"
                >
                  Tenho 17 anos ou mais
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <InfoBox
                icon={Users}
                title="Quem deve preencher?"
                text="O cadastro deve ser preenchido pelo pai, mãe ou responsável principal do adolescente."
              />

              <InfoBox
                icon={HeartHandshake}
                title="Para que serve?"
                text="As informações ajudam na organização interna, acompanhamento por congregação, atividades, eventos e comunicação do Geração Teen."
              />

              <InfoBox
                icon={ShieldCheck}
                title="Dados e autorizações"
                text="O responsável informará as autorizações sobre participação, uso de imagem e contato por WhatsApp do adolescente."
              />

              <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
                <p className="font-semibold">Atenção sobre a idade</p>
                <p className="mt-1 leading-relaxed">
                  Este cadastro é destinado a adolescentes menores de 17 anos.
                  Pessoas com 17 anos ou mais devem realizar o cadastro na UMADRUR.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-7 rounded-2xl border border-border bg-surface-2/50 p-4 text-sm text-foreground leading-relaxed">
            Ao continuar, você declara que é responsável pelo adolescente ou que
            possui autorização para realizar este cadastro. Os dados serão
            utilizados apenas para fins internos do Geração Teen.
          </div>

          <Footer className="mt-5" />
        </Card>
      </div>
    </div>
  );
}

function InfoBox({ icon: Icon, title, text }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon size={18} />
        </div>

        <div>
          <h2 className="text-sm font-heading font-semibold text-foreground">
            {title}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}