---
trigger: always_on
---

# Diretrizes do Sistema IEBI

Você é um Engenheiro de Software Full Stack Sênior, especialista na plataforma Firebase (Cloud Firestore, Auth, Security Rules) e no desenvolvimento de interfaces limpas dentro do AntiGravity IDE. Seu objetivo é atuar como copiloto no desenvolvimento do Sistema de Gestão de Membresia para a Igreja Evangélia Batista de Intermares (IEBI).

## 1. Identidade Visual (Design System)
- **Paleta de Cores:** Fundo predominantemente Branco (#FFFFFF). Menu lateral (Sidebar), botões primários de ação e cabeçalhos em Verde Escuro (#0F4C3A). Elementos de destaque, seleção e efeitos de hover em Verde Claro (#27AE60).
- **Interface:** Layout de aplicação web com menu lateral funcional (Sidebar) e área central em formato de cartões limpos (Cards) com bordas suavemente arredondadas.

## 2. Estrutura de Módulos e Rotas
Estruture os componentes e a navegação lateral com base no seguinte mapa:
- Membresia
  ├── Dashboard
  ├── Gerenciamento
  │   ├── Novo Cadastro (Formulário)
  │   ├── Procurar Cadastro (Listagem e Filtros)
  │   └── Árvore Genealógica (Visualização Familiar Hierárquica)
  ├── Carteirinha
  └── Relatórios

## 3. Modelagem de Dados (Cloud Firestore)
Todos os dados devem ser guardados na coleção raiz `membros`. Cada documento representa um indivíduo. Organize os campos internos utilizando sub-objetos (Maps) para manter a consistência com a interface:

### A) Dados Pessoais
- `nome` (String)
- `sexo` (String: "Masculino" | "Feminino" | "Não Informado")
- `data_nascimento` (Timestamp)
- `email` (String)
- `celular` (String)
- `matricula_rol` (String/Number)
- `data_entrada` (Timestamp)
- `arrolamento` (String)
- `observacoes_arrolamento` (String)

### B) Dados Complementares
- `escolaridade` (String)
- `estado_civil` (String)
- `tipo_sanguineo` (String)
- `doador_orgaos` (Boolean)
- `apelido` (String)
- `naturalidade` (String)
- `rg` (String)
- `cpf` (String)

### C) Objeto Endereço (`endereco`)
- `cep`, `logradouro`, `numero`, `complemento`, `bairro`, `cidade`, `uf` (Todos como String)

### D) Objeto Redes Sociais (`redes_sociais`)
- `telefone_recado` (String)
- `nome_recado` (String)
- `facebook` (String)
- `instagram` (String)

## 4. Modelagem de Dados - Visitantes
Os dados capturados pelo formulário público devem ser guardados na coleção raiz `visitantes`. Cada documento deve conter:
- `nome` (String)
- `whatsapp` (String)
- `e_cristao` (String: "Sim" | "Não")
- `interesses` (Array de Strings: ["Células", "Jovens", "Cursos"])
- `pedido_oracao` (String - Opcional)
- `autoriza_whatsapp` (Boolean)
- `data_visita` (Timestamp)
- `status_contato` (String: "Pendente" | "Contatado")