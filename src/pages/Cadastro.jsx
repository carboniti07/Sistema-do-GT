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
import { createJovem } from "../lib/jovensApi";
import { toast } from "sonner";
import { congregacoes } from "../lib/congregacoes";

import bgImg from "../assets/bg-visitors.png";

const cargosMasc = ["Auxiliar", "Diácono", "Presbítero", "Evangelista", "Pastor"];
const cargosFem = ["Auxiliar", "Diaconisa", "Evangelista", "Missionária"];

const initialForm = {
  congregacao: "",
  nome: "",
  nascimento: "",
  sexo: "",
  cpf: "",
  telefone: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
  batismoAguas: "",
  batismoES: "",
  possuiCargo: "",
  cargo: "",
  lgpd: false,
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

export default function Cadastro() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [loadingCEP, setLoadingCEP] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
  };

  useEffect(() => {
    const cep = unmask(form.cep);
    if (cep.length === 8) {
      setLoadingCEP(true);
      fetchAddress(cep)
        .then((data) => {
          if (data) {
            setForm((p) => ({
              ...p,
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

    if (!form.sexo) e.sexo = "Selecione o sexo";
    if (!validateCPF(unmask(form.cpf))) e.cpf = "CPF inválido";
    if (unmask(form.telefone).length < 10) e.telefone = "Telefone inválido";
    if (unmask(form.cep).length !== 8) e.cep = "CEP inválido";
    if (!form.numero.trim()) e.numero = "Informe o número";
    if (!form.batismoAguas) e.batismoAguas = "Selecione uma opção";
    if (!form.batismoES) e.batismoES = "Selecione uma opção";
    if (!form.possuiCargo) e.possuiCargo = "Selecione uma opção";
    if (form.possuiCargo === "Sim" && !form.cargo) e.cargo = "Selecione o cargo";
    if (!form.lgpd) e.lgpd = "Aceite a Política de Privacidade";

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
        cep: unmask(form.cep),
        logradouro: form.logradouro?.trim() || "",
        numero: form.numero.trim(),
        complemento: form.complemento?.trim() || "",
        bairro: form.bairro?.trim() || "",
        cidade: form.cidade?.trim() || "",
        uf: form.uf?.trim() || "",
        batismoAguas: form.batismoAguas === "Sim",
        batismoES: form.batismoES === "Sim",
        possuiCargo: form.possuiCargo === "Sim",
        cargo: form.possuiCargo === "Sim" ? form.cargo : "",
        lgpd: form.lgpd,
      };

      await createJovem(payload);

      toast.success("Jovem cadastrado com sucesso!");
      setForm(initialForm);
      setErrors({});
    } catch (err) {
      toast.error(err?.message || "Erro ao cadastrar jovem");
    } finally {
      setSaving(false);
    }
  };

  const cargos = form.sexo === "Feminino" ? cargosFem : cargosMasc;

  const congOptions = useMemo(
    () => congregacoes.map((c) => ({ value: c, label: c })),
    []
  );

  const cargoOptions = useMemo(
    () => cargos.map((c) => ({ value: c, label: c })),
    [cargos]
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
            <div className="flex justify-center pt-0 -mt-1">
              <Logo size="cadastro" />
            </div>

            <h1 className="text-base md:text-lg font-heading font-semibold text-foreground text-center -mt-2">
              Formulário de Cadastro
            </h1>

            <SectionTitle>Dados Pessoais</SectionTitle>

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
                onChange={(v) => set("nome", formatPersonName(v))}
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
                onChange={(opt) => {
                  const v = opt?.value || "";
                  set("sexo", v);
                  set("cargo", "");
                }}
                error={errors.sexo}
                placeholder="Selecione..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Input
                label="CPF"
                value={form.cpf}
                onChange={(v) => set("cpf", maskCPF(v))}
                error={errors.cpf}
                placeholder="000.000.000-00"
                maxLength={14}
                inputMode="numeric"
              />
              <Input
                label="Telefone"
                value={form.telefone}
                onChange={(v) => set("telefone", maskPhone(v))}
                error={errors.telefone}
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
                value={simNaoOptions.find((o) => o.value === form.batismoAguas) || null}
                onChange={(opt) => set("batismoAguas", opt?.value || "")}
                error={errors.batismoAguas}
                placeholder="Selecione..."
              />
              <SelectField
                label="Batizado com Espírito Santo?"
                options={simNaoOptions}
                value={simNaoOptions.find((o) => o.value === form.batismoES) || null}
                onChange={(opt) => set("batismoES", opt?.value || "")}
                error={errors.batismoES}
                placeholder="Selecione..."
              />
            </div>

            <SectionTitle>Cargo Eclesiástico</SectionTitle>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <SelectField
                label="Possui cargo eclesiástico?"
                options={simNaoOptions}
                value={simNaoOptions.find((o) => o.value === form.possuiCargo) || null}
                onChange={(opt) => {
                  const v = opt?.value || "";
                  set("possuiCargo", v);
                  if (v !== "Sim") set("cargo", "");
                }}
                error={errors.possuiCargo}
                placeholder="Selecione..."
              />

              {form.possuiCargo === "Sim" ? (
                <SelectField
                  label="Cargo"
                  options={cargoOptions}
                  value={cargoOptions.find((o) => o.value === form.cargo) || null}
                  onChange={(opt) => set("cargo", opt?.value || "")}
                  error={errors.cargo}
                  placeholder="Selecione..."
                />
              ) : (
                <div className="hidden md:block" />
              )}
            </div>

            <div className="rounded-xl border border-border bg-surface-2/60 p-2.5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.lgpd}
                  onChange={(e) => set("lgpd", e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-primary flex-shrink-0"
                />
                <span className="text-sm text-foreground leading-relaxed">
                  Declaro que li e concordo com a{" "}
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
                  e autorizo o uso dos meus dados conforme a LGPD.
                </span>
              </label>

              {errors.lgpd && (
                <p className="text-sm text-destructive mt-2">{errors.lgpd}</p>
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
              <Button type="submit" disabled={saving}>
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
              <p><strong>1. Coleta de Dados</strong></p>
              <p>
                Coletamos apenas os dados necessários para o cadastro de membros da UMADRUR,
                incluindo nome, CPF, telefone, endereço, informações de batismo e cargo eclesiástico.
              </p>
              <p><strong>2. Finalidade</strong></p>
              <p>
                Os dados coletados são utilizados exclusivamente para gestão interna da união de
                mocidades, organização de eventos e comunicação com os membros.
              </p>
              <p><strong>3. Compartilhamento</strong></p>
              <p>
                Seus dados não serão compartilhados com terceiros, exceto quando exigido por lei ou
                autorização expressa do titular.
              </p>
              <p><strong>4. Armazenamento e Segurança</strong></p>
              <p>
                Os dados são armazenados de forma segura com acesso restrito apenas a líderes
                autorizados da UMADRUR.
              </p>
              <p><strong>5. Direitos do Titular</strong></p>
              <p>
                Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento
                entrando em contato com a liderança da sua congregação.
              </p>
              <p><strong>6. Base Legal</strong></p>
              <p>
                O tratamento dos dados é realizado com base no consentimento do titular, conforme
                Art. 7 da Lei 13.709/2018 (LGPD).
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