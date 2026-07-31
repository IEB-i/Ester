# 📋 Backlog do Sistema IEBI - Módulo de Ensino (v2.0)

Este documento serve como mapa de desenvolvimento para as próximas etapas do módulo de Ensino. O ciclo inicial (Fases 1 a 3: Cursos > Turmas > Matrícula) foi concluído e recentemente refinado com melhorias de UX (modais de confirmação customizados) e responsividade focada na experiência Mobile. As fases abaixo definem os próximos passos para o funcionamento operacional, pastoral e analítico da escola bíblica.

## Fase 4: Dashboard Gerencial de Ensino (Analytics & KPIs)
Antes de focar na rotina de sala de aula, construir um painel visual exclusivo para os líderes de Ensino analisarem a saúde dos cursos.
- [x] **Métricas Principais (Cards):** Total de Cursos Ativos, Turmas em Andamento, Alunos Matriculados no semestre atual e Total de Formandos no período.
- [x] **Taxa de Ocupação:** Gráfico ou indicador mostrando a ociosidade das turmas (Vagas Preenchidas vs. Disponíveis).
- [x] **Engajamento e Retenção:** Indicadores de Evasão Escolar (Desistentes/Inativos) e Taxa de Aprovação após o fechamento das turmas.
- [x] **Ranking de Demanda:** Gráfico listando os cursos mais procurados vs. os menos procurados.
- [ ] **Alertas Operacionais:** Avisos automáticos no painel (Ex: "Turma X está sem professor alocado", "Turma Y encerra nesta semana", "Sala Z com conflito de horário").

## Fase 5: Gestão de Aulas, Diário e Cuidado Pastoral
O objetivo desta fase é permitir o acompanhamento da rotina semanal das turmas ativas, aliando o controle acadêmico ao acompanhamento pastoral.
- [x] **Cronograma de Aulas:** Gerador automático da lista de aulas com base nas datas de início/fim e dias da semana definidos.
- [ ] **Mapeamento de Salas e Recursos:** Vinculação de salas físicas (Ex: "Sala 101", "Auditório B") com alerta de conflito de uso/horário entre turmas.
- [x] **Diário de Frequência (Chamada):** Tela onde o administrador ou professor acessa uma aula específica e marca `[✓] Presente` ou `[✗] Falta` para cada aluno.
- [x] **Cálculo Automático de Frequência:** Sistema calcula em tempo real a % de presença para validação da regra de aprovação (Ex: Mínimo de 75%).
- [ ] **Alertas de Cuidado Pastoral:** Notificação visual no painel do professor/líder para alunos com 2 ou mais faltas consecutivas (sinal de alerta para contato).
- [ ] **Acompanhamento Pastoral Privado:** Campo restrito na ficha da aula para o professor anotar pedidos de oração, necessidades específicas ou observações do aluno.
- [x] **Integração com Calendário:** Espelhamento automático das datas do cronograma no Calendário Geral de Ensino.
- [ ] **Modo Contingência (Impressão PDF):** Opção de gerar a lista de chamada formatada em PDF para turmas que precisarem de registro físico no papel.
- [ ] **Transição Automática de Status:** Regra cronológica (Cloud Function ou Client-side) para alterar o status da turma de "Inscrições Abertas" para "Em Andamento" automaticamente quando a data atual atingir a data de início da turma.

## Fase 6: Comunicação, Material e Engajamento
Melhorar a interação e gestão de conteúdo da turma para evitar a evasão.
- [ ] **Mural de Recados:** Espaço de avisos da turma visível para professores e alunos.
- [ ] **Arquivos e Apostilas:** Anexo de links de arquivos (Google Drive/PDFs) e controle simples de entrega de material físico (Ex: "Recebeu Apostila? [✓]").
- [x] **Lembretes 1-Click (WhatsApp):** Botões inteligentes no sistema que geram a mensagem de lembrete (com nome do aluno e sala) e abrem o WhatsApp Web do professor/secretário para envio imediato (Zero custo de API).

## Fase 7: Avaliação, Formatura e Auto-Matrícula Inteligente
Gerenciamento da Trilha de Crescimento, avaliação final e validação de elegibilidade do aluno.
- [ ] **Configuração de Elegibilidade (No Curso):** Definição de regras de pré-requisitos no cadastro do curso (Ex: "Requer aprovação no Curso de Batismo" ou "Apenas para membros batizados").
- [ ] **Auto-Matrícula com Validação Automática:** No portal do aluno, o sistema valida se ele cumpre os pré-requisitos da Trilha de Crescimento.
  - Se elegível: Matrícula liberada/confirmada automaticamente.
  - Se inelegível: Botão bloqueado com mensagem explicativa (Ex: "Para se matricular neste curso, você precisa ter concluído o curso X").
- [x] **Registro de Status/Nota Final:** Avaliação de cada aluno no encerramento (Aprovado, Reprovado por Falta, Reprovado por Nota, Desistente).
- [x] **Formatura e Encerramento:** Ação de "Encerrar Turma" (com travamento de edição posterior).
- [x] **Atualização Automática do Perfil do Membro:** Atualização na coleção `pessoas` inserindo o curso concluído no Histórico Acadêmico/Eclesiástico do membro, liberando os novos pré-requisitos para o próximo nível da trilha.
- [x] **Geração de Certificados:** Emissão automática do PDF do certificado assinado para alunos aprovados.

## Fase 8: Painéis por Perfil (Professores e Alunos)
Adesão de múltiplos perfis de acesso ao sistema com níveis de segurança adequados (Custom Claims do Firebase).
- [x] **Segurança Blindada (Role-Based Access):** Regras de banco de dados que bloqueiam sumariamente alunos de verem finanças/cadastros e professores de verem turmas de outros.
- [x] **Perfil do Professor (PWA / Mobile):**
  - [x] Login restrito (sem acesso a menus administrativos/financeiros).
  - [x] Visão "Minhas Turmas" limpa e focada em ações rápidas.
  - [x] Chamada mobile rápida em sala de aula.
  - Suporte a Co-professores e Auxiliares vinculados à mesma turma.
  - Opção de Substituição de Professor pontual em uma aula específica.
- [ ] **Portal do Aluno Gamificado (PWA / Mobile):**
  - Tela de Check-in de presença via QRCode ou proximidade.
  - Mural de recados e visualização da "Trilha de Crescimento".
  - Área "Meus Cursos" (aulas, presença e materiais).
  - **Trilha de Crescimento Visual:** Mapa interativo (estilo videogame) mostrando os cursos concluídos desbloqueados e os próximos passos bloqueados com cadeado.
  - Catálogo de Cursos Disponíveis para Auto-Matrícula (com checagem dos pré-requisitos em tempo real).
  - Download de Certificados obtidos.

## Fase 9: Sistema de Permissões Enterprise (RBAC Dinâmico)
Sistema avançado e multi-tenant para gestão de cargos e acessos via Banco de Dados (UI-Driven).
- [ ] **Modelagem de Dados (Cargos):** Criação da coleção `cargos` no Firestore mapeando permissões de Leitura (Read) e Escrita (Write) por módulo do sistema.
- [ ] **Tela de Gestão de Cargos:** Interface no painel para criar, editar e excluir cargos customizados com checkboxes granulares (Membresia, Ensino, Células, etc).
- [ ] **Injeção de Segurança (Auth-Guard):** Middleware inteligente que busca o cargo do usuário no momento do login e bloqueia navegação não autorizada via URL.
- [ ] **Menu Adaptativo:** Ocultação automática de menus e submenus no sidebar com base nas permissões.
- [ ] **Bloqueio de UI (Read-Only):** Desativação automática de botões de Salvar, Excluir e Editar em todo o sistema quando o cargo possuir apenas permissão de leitura naquele módulo.
