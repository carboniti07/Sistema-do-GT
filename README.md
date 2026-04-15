# UMADRUR | Sistema Oficial

Sistema oficial da UMADRUR para cadastro, gestão e acompanhamento de jovens por congregação, com controle de acesso por perfil, autenticação segura e integração com backend em Node.js e MongoDB.

---

## Visão geral

O sistema foi desenvolvido para centralizar o cadastro de jovens da UMADRUR, permitindo organização administrativa, acompanhamento por congregação e acesso segmentado conforme o perfil do usuário.

A plataforma conta com área pública de cadastro e painel administrativo com autenticação, dashboard, relatórios, listagem de jovens e controle de usuários.

---

## Funcionalidades principais

- Cadastro de jovens com validação de dados
- Consulta automática de endereço por CEP
- Controle de congregações
- Dashboard com indicadores gerais
- Relatórios administrativos
- Controle de usuários e permissões
- Acesso limitado por congregação
- Autenticação com JWT
- Integração com MongoDB
- Backend separado para deploy independente

---

## Perfis de acesso

O sistema opera com perfis distintos de permissão:

- **ADMIN**
  - acesso total ao sistema

- **SECRETARIA_GERAL**
  - gestão ampla com visão global

- **SECRETARIA_LOCAL**
  - atuação restrita à congregação vinculada

- **LIDER**
  - visualização e gestão da própria congregação

- **VISUALIZADOR**
  - acesso de leitura, sem poder administrativo amplo

---

## Tecnologias utilizadas

### Frontend
- React
- Vite
- Tailwind CSS
- Lucide React
- TanStack Query
- React Router DOM
- Sonner

### Backend
- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- Zod
- Bcrypt
- CORS
- Dotenv

---

## Estrutura do projeto

### Frontend
```bash
src/
components/
pages/
auth/
lib/
assets/
public/
index.html
package.json

---

Backend
src/
  middleware/
  models/
  routes/
  seed/
app.js
server.js
config.js
db.js
package.json
Fluxo do sistema
Área pública

O usuário realiza o cadastro do jovem com dados pessoais, endereço, situação espiritual e informações eclesiásticas.

Área administrativa

Usuários autenticados acessam o painel conforme seu perfil, visualizando apenas os dados permitidos para sua congregação ou escopo global.

Segurança e controle
Autenticação por token JWT
Proteção de rotas no frontend e backend
Restrição de acesso por perfil
Restrição de visualização por congregação
Validação de dados no frontend e no backend
Cadastro protegido contra CPF duplicado

---

Identidade do sistema
Nome oficial: UMADRUR | Sistema Oficial
Finalidade: gestão administrativa e cadastro de jovens
Desenvolvimento: Carboni
Status do projeto

Projeto em evolução contínua, com base funcional já estruturada para uso administrativo real.

Contato do desenvolvedor

Carboni

Instagram: https://www.instagram.com/carboni._/
LinkedIn: https://www.linkedin.com/in/matheus-carboni-332a97304/
WhatsApp: https://wa.me/5511994551544
Licença

Projeto desenvolvido para uso institucional da UMADRUR.
Todos os direitos reservados conforme definição do responsável pelo sistema.