# Backlog do Sistema - IEBI Site

Este documento contém a lista de tarefas e melhorias identificadas para o site da IEBI.

## 🚀 Melhorias de Performance
- [x] Minificar os arquivos CSS (`styles.css`) e JavaScript (`app.js`) para produção.
- [x] Implementar carregamento tardio (lazy loading) em todas as imagens que estão abaixo da área inicial (abaixo da dobra).
- [x] Adicionar atributos `width` e `height` nas tags de imagem para evitar que o layout pule enquanto a página carrega (Cumulative Layout Shift).
- [x] Otimizar os arquivos de imagem (utilizar formatos modernos e mais leves como WebP).

## ♿ Acessibilidade (A11y) e Usabilidade
- [x] Revisar o contraste de cores entre o texto e o fundo em todas as seções (especialmente em badges coloridas e botões) para facilitar a leitura.
- [ ] Garantir que todos os elementos interativos, como os modais e os filtros de células, possam ser utilizados apenas pelo teclado.
- [x] Adicionar os atributos adequados (`aria-labels`, etc.) nos formulários para melhorar a experiência de quem usa leitores de tela.

## 🔍 SEO e Compartilhamento
- [ ] Adicionar as meta tags do Open Graph (OG) e Twitter Cards. Isso deixará o link mais bonito e informativo quando compartilhado no WhatsApp, Facebook, etc.
- [ ] Implementar dados estruturados (JSON-LD) para igrejas/organizações locais. Isso ajuda o Google a mostrar informações como endereço e horários de culto diretamente nos resultados de busca.

## 🏗️ Qualidade de Código e Arquitetura
- [ ] Refatorar o `styles.css` (que já está muito grande) e dividi-lo em arquivos menores (variáveis, tipografia, componentes, etc.).
- [ ] Avaliar a adoção de uma ferramenta de build/bundler moderna (como o Vite) para gerenciar o ambiente de desenvolvimento, facilitando o hot-reload e a minificação do código final.
- [ ] Melhorar a validação visual dos formulários (Pedido de Oração e Eventos) mostrando mensagens de erro claras sob os campos quando o preenchimento estiver incorreto.

## ✨ Funcionalidades e Dinamismo
- [ ] Integração com um CMS (Sistema de Gerenciamento de Conteúdo). Assim, a equipe da igreja pode adicionar novos eventos, avisos e atualizar líderes de células sem precisar editar o HTML.
- [ ] Fazer com que os formulários de pedido de oração e contato de fato enviem os dados para um e-mail ou sistema (atualmente necessita de integração com backend ou serviço como EmailJS).
- [ ] Criar uma galeria de fotos dinâmica conectada às redes sociais da igreja.


