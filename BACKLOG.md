# 📋 Backlog do Sistema IEBI - Módulo de Ensino

Este documento serve como mapa de desenvolvimento para as próximas etapas do módulo de Ensino. O ciclo inicial (Cursos > Turmas > Matrícula) foi concluído, e as fases abaixo definem o funcionamento operacional de uma escola.

## Fase 4: Dashboard Gerencial de Ensino (Analytics & KPIs)
Antes de focar na rotina de sala de aula, construir um painel visual exclusivo para os líderes de Ensino analisarem a saúde dos cursos.
- [ ] **Métricas Principais (Cards):** Total de Cursos Ativos, Turmas em Andamento e Alunos Matriculados no semestre atual.
- [ ] **Taxa de Ocupação:** Gráfico ou indicador mostrando a ociosidade das turmas (Vagas Preenchidas vs. Disponíveis).
- [ ] **Engajamento e Retenção:** Indicadores de Evasão Escolar (Desistentes) e Taxa de Aprovação após o fechamento de turmas.
- [ ] **Ranking de Demanda:** Gráfico listando os cursos mais procurados vs. os menos procurados.
- [ ] **Alertas Operacionais:** Avisos automáticos no painel (Ex: "Turma X está sem professor alocado", "Turma Y encerra nesta semana").

## Fase 5: Gestão de Aulas e Diário de Classe
O objetivo desta fase é permitir o acompanhamento da rotina semanal das turmas ativas.
- [ ] **Cronograma de Aulas:** Ao criar uma turma com uma data de Início e Fim e dias da semana definidos, o sistema deve ser capaz de prever/gerar a lista de "Aulas" dessa turma.
- [ ] **Diário de Frequência (Chamada):** Tela onde o administrador ou professor acessa uma Aula específica e marca `[✓] Presente` ou `[✗] Falta` para cada aluno inscrito.
- [ ] **Integração com Calendário:** As datas geradas pelo cronograma de aulas de cada turma devem aparecer no Calendário de Ensino automaticamente, evitando retrabalho.

## Fase 6: Comunicação e Material de Apoio
Melhorar a interação e gestão de conteúdo da turma.
- [ ] **Mural de Recados:** Espaço para o professor postar avisos que ficam visíveis na página da turma.
- [ ] **Arquivos e Apostilas:** Possibilidade de anexar links de arquivos (Google Drive/PDFs) para os alunos da turma acessarem os materiais de estudo.

## Fase 7: Avaliação e Formatura (Histórico do Membro)
O objetivo final de um curso é formar o membro e habilitá-lo para próximos níveis (Trilha de Crescimento).
- [ ] **Registro de Status/Nota:** Capacidade de avaliar cada aluno no fim do curso (Aprovado, Reprovado por Falta, Reprovado por Nota, Desistente).
- [ ] **Formatura e Encerramento:** Ação irreversível de "Encerrar Turma".
- [ ] **Atualização do Perfil do Membro:** Ao encerrar a turma, o sistema deve ir automaticamente na coleção `pessoas` e adicionar este curso no Histórico Acadêmico/Eclesiástico do membro, permitindo que o sistema saiba quem já fez o "Curso de Batismo" ou "Maturidade Cristã", por exemplo.
- [ ] **Geração de Certificados:** (Opcional/Futuro) Geração automática de um PDF de certificado com o nome do aluno.

## Fase 8: Painel Exclusivo do Professor
Adesão de múltiplos perfis de acesso ao sistema (Níveis de Segurança).
- [ ] **Login com Perfil Restrito:** Professores poderão fazer login no sistema, mas não terão acesso aos menus Administrativos, Financeiros ou de Células.
- [ ] **"Minhas Turmas":** Uma tela limpa apenas com os cartões das turmas em que aquele usuário é o Professor designado.
- [ ] **Ação Mobile:** O professor usará a versão PWA (Mobile) pelo próprio celular para fazer a chamada diretamente de dentro da sala de aula.
