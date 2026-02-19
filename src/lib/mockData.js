import { congregacoes } from "./congregacoes";

export const mockJovens = [
  {
    id: 1,
    nome: "Lucas Oliveira",
    congregacao: congregacoes[2], // 003 JD DO LAGO
    nascimento: "2001-03-15",
    sexo: "Masculino",
    cpf: "12345678901",
    telefone: "(11) 99988-7766",
    batismoAguas: true,
    batismoES: true,
    cargo: "Auxiliar",
    dataCadastro: "2026-01-10",
  },
  {
    id: 2,
    nome: "Maria Santos",
    congregacao: congregacoes[0], // 001 RUDGE RAMOS / SEDE
    nascimento: "2003-07-22",
    sexo: "Feminino",
    cpf: "98765432100",
    telefone: "(11) 98877-6655",
    batismoAguas: true,
    batismoES: false,
    cargo: null,
    dataCadastro: "2026-01-12",
  },
  {
    id: 3,
    nome: "Pedro Almeida",
    congregacao: congregacoes[4], // 007 JD ABC (ajuste se quiser)
    nascimento: "1999-11-08",
    sexo: "Masculino",
    cpf: "11122233344",
    telefone: "(11) 97766-5544",
    batismoAguas: false,
    batismoES: false,
    cargo: null,
    dataCadastro: "2026-01-15",
  },
  {
    id: 4,
    nome: "Ana Ferreira",
    congregacao: congregacoes[1], // 002 V LIVIERO
    nascimento: "2002-01-30",
    sexo: "Feminino",
    cpf: "55566677788",
    telefone: "(11) 96655-4433",
    batismoAguas: true,
    batismoES: true,
    cargo: "Diaconisa",
    dataCadastro: "2026-01-18",
  },
  {
    id: 5,
    nome: "Rafael Costa",
    congregacao: congregacoes[0], // 001 RUDGE RAMOS / SEDE
    nascimento: "2000-09-05",
    sexo: "Masculino",
    cpf: "99988877766",
    telefone: "(11) 95544-3322",
    batismoAguas: true,
    batismoES: true,
    cargo: "Diacono",
    dataCadastro: "2026-01-20",
  },
  {
    id: 6,
    nome: "Julia Ribeiro",
    congregacao: congregacoes[5], // 008 V NOVA CONQUISTA
    nascimento: "2004-05-18",
    sexo: "Feminino",
    cpf: "44433322211",
    telefone: "(11) 94433-2211",
    batismoAguas: false,
    batismoES: false,
    cargo: null,
    dataCadastro: "2026-01-22",
  },
  {
    id: 7,
    nome: "Gabriel Souza",
    congregacao: congregacoes[2], // 003 JD DO LAGO
    nascimento: "1998-12-25",
    sexo: "Masculino",
    cpf: "77788899900",
    telefone: "(11) 93322-1100",
    batismoAguas: true,
    batismoES: false,
    cargo: "Presbitero",
    dataCadastro: "2026-02-01",
  },
  {
    id: 8,
    nome: "Beatriz Lima",
    congregacao: congregacoes[6], // 010 V VERA
    nascimento: "2001-08-14",
    sexo: "Feminino",
    cpf: "22211100099",
    telefone: "(11) 92211-0099",
    batismoAguas: true,
    batismoES: true,
    cargo: "Auxiliar",
    dataCadastro: "2026-02-05",
  },
  {
    id: 9,
    nome: "Mateus Pereira",
    congregacao: congregacoes[0], // 001 RUDGE RAMOS / SEDE
    nascimento: "2005-02-28",
    sexo: "Masculino",
    cpf: "66655544433",
    telefone: "(11) 91100-9988",
    batismoAguas: false,
    batismoES: false,
    cargo: null,
    dataCadastro: "2026-02-10",
  },
  {
    id: 10,
    nome: "Camila Rocha",
    congregacao: congregacoes[3], // 006 V IDEALOPOLIS (ajuste se quiser)
    nascimento: "2003-06-10",
    sexo: "Feminino",
    cpf: "33322211100",
    telefone: "(11) 90099-8877",
    batismoAguas: true,
    batismoES: true,
    cargo: "Missionaria",
    dataCadastro: "2026-02-14",
  },
];

export const mockUsuarios = [
  {
    id: 1,
    nome: "Pastor Roberto",
    email: "admin@umadrur.com",
    role: "admin_sistema",
    congregacao: "Todas",
    status: "Ativo",
  },
  {
    id: 2,
    nome: "Lider Carlos",
    email: "carlos@umadrur.com",
    role: "lider_geral",
    congregacao: "Todas",
    status: "Ativo",
  },
  {
    id: 3,
    nome: "Fernanda Dias",
    email: "fernanda@umadrur.com",
    role: "lider_congregacao",
    congregacao: congregacoes[0], // 001 RUDGE RAMOS / SEDE
    status: "Ativo",
  },
  {
    id: 4,
    nome: "Ricardo Mendes",
    email: "ricardo@umadrur.com",
    role: "lider_congregacao",
    congregacao: congregacoes[2], // 003 JD DO LAGO
    status: "Inativo",
  },
];
