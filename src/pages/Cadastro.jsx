import React, { useState, useEffect, useMemo } from "react";
import Logo from "../components/Logo";
import Button from "../components/Button";
import Input from "../components/Input";
import Card from "../components/Card";
import Modal from "../components/Modal";
import SelectField from "../components/SelectField";
import Footer from "../components/Footer";
import { maskCPF, maskPhone, maskCEP, unmask } from "../lib/masks";
import { validateCPF } from "../lib/cpf";
import { fetchAddress } from "../lib/viacep";
import { createAdolescente } from "../lib/adolescentesApi";
import { toast } from "sonner";
import { congregacoes } from "../lib/congregacoes";

import bgImg from "../assets/bg-visitors.png";

const UMADRUR_CADASTRO_URL =
  import.meta.env.VITE_UMADRUR_CADASTRO_URL ||
  "https://cadastroumadrur.adbrr.com.br";

const parentescoOptions = [
  { value: "Mãe", label: "Mãe" },
  { value: "Pai", label: "Pai" },
  { value: "Avó", label: "Avó" },
  { value: "Avô", label: "Avô" },
  { value: "Tia", label: "Tia" },
  { value: "Tio", label: "Tio" },
  { value: "Irmã maior de idade", label: "Irmã maior de idade" },
  { value: "Irmão maior de idade", label: "Irmão maior de idade" },
  { value: "Tutor legal", label: "Tutor legal" },
  { value: "Guardião", label: "Guardião" },
  { value: "Dirigente responsável", label: "Dirigente responsável" },
  { value: "Outro", label: "Outro" },
];

const initialForm = {
  congregacao: "",
  nome: "",
  nascimento: "",
  sexo: "",
  cpf: "",
  telefone: "",

  responsavelNome: "",
  responsavelCpf: "",
  responsavelParentesco: "",
  responsavelTelefone: "",

  nomeMae: "",
  telefoneMae: "",
  nomePai: "",
  telefonePai: "",

  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",

  batismoAguas: "",
  batismoES: "",

  autorizaParticipacao: "",
  autorizaImagem: "",
  autorizaWhatsApp: "",
  observacoesResponsavel: "",

  lgpdResponsavel: false,
};

function maskDate(value = "") {
  const digits = String(value).replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function parseDateToISO(value = "") {
  const cleaned = String(value).trim();
  const match = cleaned.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) return "";

  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

function calcularIdadePtBR(value = "") {
  const iso = parseDateToISO(value);

  if (!iso) return null;

  const [year, month, day] = iso.split("-").map(Number);
  const birth = new Date(year, month - 1, day);

  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();

  let idade = today.getFullYear() - birth.getFullYear();

  const aindaNaoFezAniversario =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() &&
      today.getDate() < birth.getDate());

  if (aindaNaoFezAniversario) {
    idade -= 1;
  }

  return idade;
}

function formatPersonName(value = "") {
  const lowerWords = new Set(["da", "de", "do", "das", "dos", "e"]);

  return String(value)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word, index) => {
      if (index > 0 && lowerWords.has(word)) {
        return word;
      }

      return word
        .split("-")
        .map((part) =>
          part ? part.charAt(0).toUpperCase() + part.slice(1) : part
        )
        .join("-");
    })
    .join(" ");
}

function isValidPhoneOptional(value) {
  const digits = unmask(value);

  if (!digits) return true;

  return digits.length === 10 || digits.length === 11;
}

function isValidPhoneRequired(value) {
  const digits = unmask(value);

  return digits.length === 10 || digits.length === 11;
}

export default function Cadastro() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [loadingCEP, setLoadingCEP] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cadastroFinalizado, setCadastroFinalizado] = useState(null);

  const idade = useMemo(() => calcularIdadePtBR(form.nascimento), [form.nascimento]);
  const deveIrParaUmadrur = idade !== null && idade >= 17;

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  useEffect(() => {
    const cep = unmask(form.cep);

    if (cep.length === 8) {
      setLoadingCEP(true);

      fetchAddress(cep)
        .then((data) => {
          if (data) {
            setForm((prev) => ({
              ...prev,
              logradouro: data.logradouro || "",
              bairro: data.bairro || "",
              cidade: data.cidade || "",
              uf: data.uf || "",
            }));
          }
        })
        .finally(() => setLoadingCEP(false));
    }
  }, [form.cep]);

  const validate = () => {
    const e = {};

    if (!form.congregacao) e.congregacao = "Selecione a congregação";
    if (!form.nome.trim()) e.nome = "Informe o nome completo";

    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(form.nascimento)) {
      e.nascimento = "Informe a data no formato dd/mm/aaaa";
    }

    if (deveIrParaUmadrur) {
      e.nascimento =
        "Pessoas com 17 anos ou mais devem realizar o cadastro pela UMADRUR";
    }

    if (!form.sexo) e.sexo = "Selecione o sexo";

    if (unmask(form.cpf) && !validateCPF(unmask(form.cpf))) {
      e.cpf = "CPF do adolescente inválido";
    }

    if (unmask(form.telefone) && !isValidPhoneOptional(form.telefone)) {
      e.telefone = "Telefone do adolescente inválido";
    }

    if (!form.responsavelNome.trim()) {
      e.responsavelNome = "Informe o nome do responsável";
    }

    if (!validateCPF(unmask(form.responsavelCpf))) {
      e.responsavelCpf = "CPF do responsável inválido";
    }

    if (!form.responsavelParentesco) {
      e.responsavelParentesco = "Selecione o parentesco ou vínculo";
    }

    if (!isValidPhoneRequired(form.responsavelTelefone)) {
      e.responsavelTelefone = "Telefone do responsável inválido";
    }

    if (form.nomeMae.trim() && !isValidPhoneOptional(form.telefoneMae)) {
      e.telefoneMae = "Telefone da mãe inválido";
    }

    if (unmask(form.telefoneMae) && !form.nomeMae.trim()) {
      e.nomeMae = "Informe o nome da mãe ou remova o telefone";
    }

    if (form.nomePai.trim() && !isValidPhoneOptional(form.telefonePai)) {
      e.telefonePai = "Telefone do pai inválido";
    }

    if (unmask(form.telefonePai) && !form.nomePai.trim()) {
      e.nomePai = "Informe o nome do pai ou remova o telefone";
    }

    if (unmask(form.cep).length !== 8) e.cep = "CEP inválido";
    if (!form.numero.trim()) e.numero = "Informe o número";

    if (!form.batismoAguas) e.batismoAguas = "Selecione uma opção";
    if (!form.batismoES) e.batismoES = "Selecione uma opção";

    if (!form.autorizaParticipacao) {
      e.autorizaParticipacao = "Selecione uma opção";
    }

    if (!form.autorizaImagem) {
      e.autorizaImagem = "Selecione uma opção";
    }

    if (!form.autorizaWhatsApp) {
      e.autorizaWhatsApp = "Selecione uma opção";
    }

    if (!form.lgpdResponsavel) {
      e.lgpdResponsavel =
        "O responsável precisa aceitar a Política de Privacidade";
    }

    setErrors(e);

    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Corrija os campos destacados");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        congregacaoId: form.congregacao,
        nome: formatPersonName(form.nome),
        nascimento: parseDateToISO(form.nascimento),
        sexo: form.sexo,
        cpf: unmask(form.cpf),
        telefone: unmask(form.telefone),

        responsavelNome: formatPersonName(form.responsavelNome),
        responsavelCpf: unmask(form.responsavelCpf),
        responsavelParentesco: form.responsavelParentesco,
        responsavelTelefone: unmask(form.responsavelTelefone),

        nomeMae: form.nomeMae ? formatPersonName(form.nomeMae) : "",
        telefoneMae: unmask(form.telefoneMae),
        nomePai: form.nomePai ? formatPersonName(form.nomePai) : "",
        telefonePai: unmask(form.telefonePai),

        cep: unmask(form.cep),
        logradouro: form.logradouro?.trim() || "",
        numero: form.numero.trim(),
        complemento: form.complemento?.trim() || "",
        bairro: form.bairro?.trim() || "",
        cidade: form.cidade?.trim() || "",
        uf: form.uf?.trim() || "",

        batismoAguas: form.batismoAguas === "Sim",
        batismoES: form.batismoES === "Sim",

        autorizaParticipacao: form.autorizaParticipacao === "Sim",
        autorizaImagem: form.autorizaImagem === "Sim",
        autorizaWhatsApp: form.autorizaWhatsApp === "Sim",
        observacoesResponsavel: form.observacoesResponsavel?.trim() || "",

        lgpdResponsavel: form.lgpdResponsavel,
      };

      await createAdolescente(payload);

      setCadastroFinalizado({
        nome: payload.nome,
        congregacao: form.congregacao,
      });

      toast.success("Adolescente cadastrado com sucesso!");
      setForm(initialForm);
      setErrors({});
    } catch (err) {
      toast.error(err?.message || "Erro ao cadastrar adolescente");
    } finally {
      setSaving(false);
    }
  };

  const congOptions = useMemo(
    () => congregacoes.map((c) => ({ value: c, label: c })),
    []
  );

  const sexoOptions = useMemo(
    () => [
      { value: "Masculino", label: "Masculino" },
      { value: "Feminino", label: "Feminino" },
    ],
    []
  );

  const simNaoOptions = useMemo(
    () => [
      { value: "Sim", label: "Sim" },
      { value: "Nao", label: "Não" },
    ],
    []
  );

  if (cadastroFinalizado) {
    return (
      <div
        className="min-h-screen flex items-start justify-center px-4 py-6 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(255,160,60,0.92), rgba(255,70,0,0.92)), url(${bgImg})`,
        }}
      >
        <div className="w-full max-w-[640px]">
          <Card className="w-full bg-card/92 border border-white/18 shadow-[0_18px_50px_rgba(0,0,0,0.16)] rounded-3xl">
            <div className="space-y-5 text-center">
              <div className="flex justify-center">
                <Logo size="cadastro" />
              </div>

              <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-5 text-green-900">
                <h1 className="text-xl font-heading font-bold">
                  Cadastro realizado com sucesso!
                </h1>

                <p className="mt-3 text-sm leading-relaxed">
                  O cadastro de <strong>{cadastroFinalizado.nome}</strong> foi
                  recebido pelo Geração Teen.
                </p>

                <p className="mt-2 text-sm leading-relaxed">
                  Congregação: <strong>{cadastroFinalizado.congregacao}</strong>
                </p>

                <p className="mt-3 text-sm leading-relaxed">
                  A liderança local poderá entrar em contato conforme as
                  autorizações informadas no cadastro.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:justify-center">
                <Button
                  type="button"
                  onClick={() => {
                    setCadastroFinalizado(null);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Fazer novo cadastro
                </Button>

                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => {
                    setCadastroFinalizado(null);
                    window.location.href = "/";
                  }}
                >
                  Voltar ao início
                </Button>
              </div>

              <Footer className="mt-4" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-start justify-center px-4 py-6 bg-cover bg-center"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(255,160,60,0.92), rgba(255,70,0,0.92)), url(${bgImg})`,
      }}
    >
      <div className="w-full max-w-[640px]">
        <Card className="w-full bg-card/92 border border-white/18 shadow-[0_18px_50px_rgba(0,0,0,0.16)] rounded-3xl">
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex justify-center pt-0">
              <Logo size="cadastro" />
            </div>

            <h1 className="text-base md:text-lg font-heading font-semibold text-foreground text-center mt-1">
              Formulário de Cadastro Geração Teen
            </h1>

            <SectionTitle>Dados do Adolescente</SectionTitle>

            <SelectField
              label="Congregação"
              options={congOptions}
              value={congOptions.find((o) => o.value === form.congregacao) || null}
              onChange={(opt) => set("congregacao", opt?.value || "")}
              error={errors.congregacao}
              placeholder="Selecione..."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input
                label="Nome completo"
                value={form.nome}
                onChange={(v) => set("nome", v)}
                onBlur={() => set("nome", formatPersonName(form.nome))}
                error={errors.nome}
              />

              <Input
                label="Nascimento"
                type="text"
                value={form.nascimento}
                onChange={(v) => set("nascimento", maskDate(v))}
                error={errors.nascimento}
                placeholder="dd/mm/aaaa"
                maxLength={10}
                inputMode="numeric"
              />

              <SelectField
                label="Sexo"
                options={sexoOptions}
                value={sexoOptions.find((o) => o.value === form.sexo) || null}
                onChange={(opt) => set("sexo", opt?.value || "")}
                error={errors.sexo}
                placeholder="Selecione..."
              />
            </div>

            {idade !== null && idade >= 0 && (
              <div className="rounded-xl border border-border bg-surface-2/60 px-3 py-2 text-sm text-foreground">
                Idade calculada: <strong>{idade} anos</strong>
              </div>
            )}

            {deveIrParaUmadrur && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <p className="font-semibold">
                  Cadastro direcionado para a UMADRUR
                </p>

                <p className="mt-1">
                  O Geração Teen é destinado aos adolescentes menores de 17 anos.
                  Como a idade informada é de 17 anos ou mais, o cadastro deve
                  ser feito no sistema da UMADRUR.
                </p>

                <a
                  href={UMADRUR_CADASTRO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex rounded-lg bg-amber-700 px-4 py-2 text-white hover:opacity-90 transition"
                >
                  Ir para o cadastro da UMADRUR
                </a>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Input
                label="CPF do adolescente, se souber"
                value={form.cpf}
                onChange={(v) => set("cpf", maskCPF(v))}
                error={errors.cpf}
                placeholder="000.000.000-00"
                maxLength={14}
                inputMode="numeric"
              />

              <Input
                label="Telefone do adolescente, se houver"
                value={form.telefone}
                onChange={(v) => set("telefone", maskPhone(v))}
                error={errors.telefone}
                placeholder="(00) 00000-0000"
                maxLength={15}
                inputMode="tel"
              />
            </div>

            <SectionTitle>Responsável Legal pelo Cadastro</SectionTitle>

            <div className="rounded-xl border border-border bg-surface-2/60 p-3 text-sm text-muted-foreground leading-relaxed">
              O cadastro deve ser preenchido pelo pai, mãe ou responsável legal.
              Os dados abaixo identificam quem está autorizando o cadastro e o
              tratamento das informações do adolescente.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Input
                label="Nome completo do responsável"
                value={form.responsavelNome}
                onChange={(v) => set("responsavelNome", v)}
                onBlur={() =>
                  set("responsavelNome", formatPersonName(form.responsavelNome))
                }
                error={errors.responsavelNome}
              />

              <Input
                label="CPF do responsável"
                value={form.responsavelCpf}
                onChange={(v) => set("responsavelCpf", maskCPF(v))}
                error={errors.responsavelCpf}
                placeholder="000.000.000-00"
                maxLength={14}
                inputMode="numeric"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <SelectField
                label="Parentesco ou vínculo"
                options={parentescoOptions}
                value={
                  parentescoOptions.find(
                    (o) => o.value === form.responsavelParentesco
                  ) || null
                }
                onChange={(opt) =>
                  set("responsavelParentesco", opt?.value || "")
                }
                error={errors.responsavelParentesco}
                placeholder="Selecione..."
              />

              <Input
                label="Telefone do responsável"
                value={form.responsavelTelefone}
                onChange={(v) => set("responsavelTelefone", maskPhone(v))}
                error={errors.responsavelTelefone}
                placeholder="(00) 00000-0000"
                maxLength={15}
                inputMode="tel"
              />
            </div>

            <SectionTitle>Filiação, opcional</SectionTitle>

            <div className="rounded-xl border border-border bg-surface-2/60 p-3 text-sm text-muted-foreground leading-relaxed">
              Informe os dados de pai e mãe apenas se souber ou se for necessário
              para o acompanhamento interno. Esses campos não substituem o
              responsável legal pelo cadastro.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Input
                label="Nome da mãe, se houver"
                value={form.nomeMae}
                onChange={(v) => set("nomeMae", v)}
                onBlur={() => set("nomeMae", formatPersonName(form.nomeMae))}
                error={errors.nomeMae}
              />

              <Input
                label="Telefone da mãe"
                value={form.telefoneMae}
                onChange={(v) => set("telefoneMae", maskPhone(v))}
                error={errors.telefoneMae}
                placeholder="(00) 00000-0000"
                maxLength={15}
                inputMode="tel"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Input
                label="Nome do pai, se houver"
                value={form.nomePai}
                onChange={(v) => set("nomePai", v)}
                onBlur={() => set("nomePai", formatPersonName(form.nomePai))}
                error={errors.nomePai}
              />

              <Input
                label="Telefone do pai"
                value={form.telefonePai}
                onChange={(v) => set("telefonePai", maskPhone(v))}
                error={errors.telefonePai}
                placeholder="(00) 00000-0000"
                maxLength={15}
                inputMode="tel"
              />
            </div>

            <SectionTitle>Endereço</SectionTitle>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input
                label="CEP"
                value={form.cep}
                onChange={(v) => set("cep", maskCEP(v))}
                error={errors.cep}
                placeholder="00000-000"
                maxLength={9}
                inputMode="numeric"
              />

              <Input label="Cidade" value={form.cidade} readOnly />
              <Input label="UF" value={form.uf} readOnly />
            </div>

            {loadingCEP && (
              <p className="text-xs text-muted-foreground -mt-1">
                Buscando endereço...
              </p>
            )}

            <Input label="Logradouro" value={form.logradouro} readOnly />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input
                label="Número"
                value={form.numero}
                onChange={(v) => set("numero", v)}
                error={errors.numero}
                inputMode="numeric"
              />

              <Input
                label="Complemento"
                value={form.complemento}
                onChange={(v) => set("complemento", v)}
              />

              <Input label="Bairro" value={form.bairro} readOnly />
            </div>

            <SectionTitle>Situação Espiritual</SectionTitle>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <SelectField
                label="Batizado nas águas?"
                options={simNaoOptions}
                value={
                  simNaoOptions.find((o) => o.value === form.batismoAguas) ||
                  null
                }
                onChange={(opt) => set("batismoAguas", opt?.value || "")}
                error={errors.batismoAguas}
                placeholder="Selecione..."
              />

              <SelectField
                label="Batizado com Espírito Santo?"
                options={simNaoOptions}
                value={
                  simNaoOptions.find((o) => o.value === form.batismoES) || null
                }
                onChange={(opt) => set("batismoES", opt?.value || "")}
                error={errors.batismoES}
                placeholder="Selecione..."
              />
            </div>

            <SectionTitle>Autorizações do Responsável</SectionTitle>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <SelectField
                label="Autoriza participação?"
                options={simNaoOptions}
                value={
                  simNaoOptions.find(
                    (o) => o.value === form.autorizaParticipacao
                  ) || null
                }
                onChange={(opt) =>
                  set("autorizaParticipacao", opt?.value || "")
                }
                error={errors.autorizaParticipacao}
                placeholder="Selecione..."
              />

              <SelectField
                label="Autoriza uso de imagem?"
                options={simNaoOptions}
                value={
                  simNaoOptions.find((o) => o.value === form.autorizaImagem) ||
                  null
                }
                onChange={(opt) => set("autorizaImagem", opt?.value || "")}
                error={errors.autorizaImagem}
                placeholder="Selecione..."
              />

              <SelectField
                label="Autoriza contato pelo WhatsApp do adolescente?"
                options={simNaoOptions}
                value={
                  simNaoOptions.find(
                    (o) => o.value === form.autorizaWhatsApp
                  ) || null
                }
                onChange={(opt) => set("autorizaWhatsApp", opt?.value || "")}
                error={errors.autorizaWhatsApp}
                placeholder="Selecione..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Observações do responsável
              </label>

              <textarea
                value={form.observacoesResponsavel}
                onChange={(e) => set("observacoesResponsavel", e.target.value)}
                placeholder="Campo opcional para observações importantes do responsável."
                maxLength={500}
                className="input-field min-h-[90px] resize-y"
              />
            </div>

            <div className="rounded-xl border border-border bg-surface-2/60 p-2.5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.lgpdResponsavel}
                  onChange={(e) => set("lgpdResponsavel", e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-primary flex-shrink-0"
                />

                <span className="text-sm text-foreground leading-relaxed">
                  Declaro que sou o responsável pelo adolescente ou que possuo
                  autorização para realizar este cadastro, li e concordo com a{" "}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowPrivacy(true);
                    }}
                    className="text-primary font-semibold underline underline-offset-2 hover:text-primary-hover"
                  >
                    Política de Privacidade
                  </button>{" "}
                  e autorizo o tratamento dos dados conforme a LGPD.
                </span>
              </label>

              {errors.lgpdResponsavel && (
                <p className="text-sm text-destructive mt-2">
                  {errors.lgpdResponsavel}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-1">
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setForm(initialForm);
                  setErrors({});
                }}
                disabled={saving}
              >
                Cancelar
              </Button>

              <Button type="submit" disabled={saving || deveIrParaUmadrur}>
                {saving ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </div>

            <Footer className="mt-4" />
          </form>

          <Modal
            open={showPrivacy}
            onClose={() => setShowPrivacy(false)}
            title="Política de Privacidade"
          >
            <div className="text-sm text-foreground space-y-4 leading-relaxed">
              <p>
                <strong>1. Coleta de Dados</strong>
              </p>

              <p>
                Coletamos apenas os dados necessários para o cadastro de
                adolescentes do Geração Teen, incluindo dados pessoais do
                adolescente, dados do responsável legal, endereço, dados
                opcionais de filiação, autorizações e informações de batismo.
              </p>

              <p>
                <strong>2. Finalidade</strong>
              </p>

              <p>
                Os dados coletados são utilizados exclusivamente para gestão
                interna do Geração Teen, organização de atividades, eventos,
                acompanhamento por congregação e comunicação com os participantes
                e responsáveis.
              </p>

              <p>
                <strong>3. Autorizações</strong>
              </p>

              <p>
                As autorizações informadas pelo responsável serão utilizadas para
                controle interno sobre participação, uso de imagem e contato pelo
                WhatsApp informado no cadastro. Mensagens de aniversário e
                comunicados do Geração Teen poderão ser enviados ao WhatsApp do
                adolescente somente quando houver autorização. Assuntos
                financeiros, campanhas de camisas e pagamentos devem ser tratados
                preferencialmente com o responsável.
              </p>

              <p>
                <strong>4. Compartilhamento</strong>
              </p>

              <p>
                Os dados não serão compartilhados com terceiros, exceto quando
                exigido por lei ou mediante autorização adequada.
              </p>

              <p>
                <strong>5. Armazenamento e Segurança</strong>
              </p>

              <p>
                Os dados são armazenados de forma segura com acesso restrito
                apenas às lideranças e pessoas autorizadas.
              </p>

              <p>
                <strong>6. Direitos do Titular</strong>
              </p>

              <p>
                O titular ou responsável legal pode solicitar acesso, correção
                ou exclusão dos dados, conforme a legislação aplicável.
              </p>

              <p>
                <strong>7. Base Legal</strong>
              </p>

              <p>
                O tratamento dos dados é realizado com base no consentimento,
                conforme a Lei 13.709/2018, Lei Geral de Proteção de Dados.
              </p>
            </div>
          </Modal>
        </Card>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 className="text-sm font-heading font-semibold text-foreground mt-2 pb-2 border-b border-border">
      {children}
    </h2>
  );
}