class Topbar extends HTMLElement {
  connectedCallback() {
    // Mapeamento de Títulos por Página
    const pageTitles = {
      'index.html': 'Mural & Agenda IEBI',
      'dashboard_membresia.html': 'Dashboard de Membresia',
      'calendario.html': 'Agenda',
      'procurar-cadastro.html': 'Procurar Cadastro',
      'pessoa-nova.html': 'Novo Cadastro de Membro',
      'ensino-home.html': 'Ensino',
      'dashboard_ensino.html': 'Dashboard de Ensino',
      'cargos.html': 'Gestão de Cargos',
      'cursos.html': 'Cursos de Ensino',
      'turmas.html': 'Turmas & Aulas',
      'tarefas-ensino.html': 'Tarefas & Kanban',
      'professor-area.html': 'Área do Professor',
      'carteirinha.html': 'Carteirinha do Membro'
    };

    const currentFilename = window.location.pathname.split('/').pop() || 'index.html';
    const displayTitle = pageTitles[currentFilename] || 'Sistema IEBI';

    this.innerHTML = `
      <header class="topbar">
        <div class="topbar-brand">
          <img src="../assets/LogoBranco.png" alt="IEBI Logo" class="brand-logo">
        </div>
        <div class="topbar-content">
          <div class="topbar-left">
            <button class="menu-toggle">
              <i class="ph ph-list" style="font-size: 1.5rem;"></i>
            </button>
            <span class="topbar-title">${displayTitle}</span>
          </div>
          <div class="topbar-right">
            <div class="profile-dropdown-container">
              <button class="icon-btn profile-btn" id="profileDropdownBtn" title="Perfil">
                <i class="ph ph-user-circle"></i>
              </button>
              <div class="profile-dropdown-menu" id="profileDropdownMenu">
                <button class="dropdown-item danger" id="btnLogout">
                  <i class="ph ph-sign-out"></i>
                  <span>Sair</span>
                </button>
              </div>
            </div>
            <button class="icon-btn">
              <i class="ph ph-corners-out"></i>
            </button>
            <button class="icon-btn">
              <i class="ph ph-bell"></i>
              <span class="badge">13</span>
            </button>
          </div>
        </div>
      </header>
    `;

    // Lógica do botão de menu (Sidebar Toggle)
    const menuToggle = this.querySelector('.menu-toggle');
    const brandLogo = this.querySelector('.brand-logo');
    
    if (menuToggle) {
      menuToggle.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          // Mobile mode: toggle the off-canvas menu
          document.body.classList.toggle('mobile-open');
        } else {
          // Desktop mode: toggle the collapsed sidebar
          document.body.classList.toggle('sidebar-collapsed');
          if (document.body.classList.contains('sidebar-collapsed')) {
            brandLogo.src = '../assets/default_Branco.png';
          } else {
            brandLogo.src = '../assets/LogoBranco.png';
          }
        }
      });
    }

    // Lógica do dropdown de perfil
    const profileBtn = this.querySelector('#profileDropdownBtn');
    const profileMenu = this.querySelector('#profileDropdownMenu');

    if (profileBtn && profileMenu) {
      profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        profileMenu.classList.toggle('show');
      });

      document.addEventListener('click', (e) => {
        if (!this.contains(e.target)) {
          profileMenu.classList.remove('show');
        }
      });
    }

    // Lógica de logout do botão Sair (backup caso o auth-guard não tenha registrado)
    const btnLogout = this.querySelector('#btnLogout');
    if (btnLogout) {
      btnLogout.addEventListener('click', (e) => {
        e.stopPropagation();
        sessionStorage.removeItem('authenticated_user');
        sessionStorage.removeItem('user_role');
        sessionStorage.removeItem('user_permissions');
        localStorage.removeItem('authenticated_user');
        const inPagesFolder = window.location.pathname.includes('/pages/');
        const loginPath = inPagesFolder ? 'login.html' : 'pages/login.html';
        window.location.href = loginPath;
      });
    }
  }
}

class Sidebar extends HTMLElement {
  connectedCallback() {
    this.render();
    
    // Escuta um evento customizado disparado pelo auth-guard
    window.addEventListener('permissionsLoaded', () => {
        this.render();
    });
  }

  render() {
    const activeMenu = this.getAttribute('active-menu') || '';
    
    const isActive = (menu) => activeMenu === menu ? 'active' : '';
    const isMenuOpen = (menus) => menus.includes(activeMenu) ? 'style="display: block;"' : 'style="display: none;"';
    const isMenuActive = (menus) => menus.includes(activeMenu) ? 'active' : '';

    const isMaster = sessionStorage.getItem('user_role') === 'admin';
    const getPerms = () => {
        try { return JSON.parse(sessionStorage.getItem('user_permissions') || '{}'); } catch(e) { return {}; }
    };
    const canAccess = (mod) => {
        if(isMaster) return true;
        const p = getPerms()[mod];
        return p === 'read' || p === 'write';
    };

    this.innerHTML = `
      <div class="sidebar-overlay"></div>
      <aside class="sidebar">
        <div class="sidebar-search">
          <input type="text" placeholder="Pesquisar..." class="search-input">
        </div>
        <nav class="sidebar-nav">
          <ul class="nav-menu">
            
            <li class="nav-item">
              <a href="index.html" class="nav-link ${isActive('home')}">
                <i class="ph ph-house nav-icon"></i>
                <span class="nav-text">Mural de Avisos</span>
              </a>
            </li>

            ${canAccess('membresia') ? `
            <li class="nav-item has-submenu ${isMenuActive(['membresia', 'pessoa-nova', 'dashboard', 'procurar-cadastro'])}">
              <a href="#" class="nav-link submenu-toggle ${isMenuActive(['membresia', 'pessoa-nova', 'dashboard', 'procurar-cadastro'])}">
                <i class="ph ph-user nav-icon"></i>
                <span class="nav-text">Membresia</span>
                <span class="nav-arrow">▼</span>
              </a>
              <ul class="submenu" ${isMenuOpen(['membresia', 'pessoa-nova', 'dashboard', 'procurar-cadastro'])}>
                <li>
                  <a href="dashboard_membresia.html" class="nav-link ${isActive('dashboard')}">
                    <i class="ph ph-chart-bar nav-icon"></i> Dashboard
                  </a>
                </li>
                <li>
                  <a href="#" class="nav-link">
                    <i class="ph ph-gauge nav-icon"></i> Gerenciamento
                  </a>
                </li>
                <li class="nav-item has-submenu ${isMenuActive(['pessoa-nova', 'procurar-cadastro'])}">
                  <a href="#" class="nav-link submenu-toggle ${isMenuActive(['pessoa-nova', 'procurar-cadastro'])}">
                    <i class="ph ph-users nav-icon"></i> 
                    <span class="nav-text">Pessoas</span>
                    <span class="nav-arrow">▼</span>
                  </a>
                  <ul class="submenu" ${isMenuOpen(['pessoa-nova', 'procurar-cadastro'])}>
                    <li><a href="pessoa-nova.html" class="nav-link ${isActive('pessoa-nova')}">Novo Cadastro</a></li>
                    <li><a href="procurar-cadastro.html" class="nav-link ${isActive('procurar-cadastro')}">Procurar Cadastro</a></li>
                    <li><a href="#" class="nav-link">Alterar Arrolamentos</a></li>
                    <li><a href="#" class="nav-link">Transferência Igreja</a></li>
                    <li><a href="#" class="nav-link">Unificar Cadastros</a></li>
                    <li><a href="#" class="nav-link">Aprovação</a></li>
                  </ul>
                </li>
              </ul>
            </li>
            ` : ''}

            <!-- Área Pastoral removida a pedido do usuário -->

            <li class="nav-item">
              <a href="#" class="nav-link ${isActive('igrejas')}">
                <i class="ph ph-bank nav-icon"></i>
                <span class="nav-text">Igrejas</span>
              </a>
            </li>
            
            ${canAccess('celulas') ? `
            <li class="nav-item">
              <a href="#" class="nav-link ${isActive('celulas')}">
                <i class="ph ph-users-three nav-icon"></i>
                <span class="nav-text">Células</span>
              </a>
            </li>
            ` : ''}

            <li class="nav-item">
              <a href="#" class="nav-link ${isActive('ministerios')}">
                <i class="ph ph-puzzle-piece nav-icon"></i>
                <span class="nav-text">Ministérios</span>
              </a>
            </li>
            
            ${canAccess('eventos') ? `
            <li class="nav-item">
              <a href="calendario.html" class="nav-link ${isActive('eventos') || isActive('calendario')}">
                <i class="ph ph-calendar-blank nav-icon"></i>
                <span class="nav-text">Eventos & Calendário</span>
              </a>
            </li>
            ` : ''}

            ${canAccess('ensino') ? `
            <li class="nav-item has-submenu ${isActive('ensino') || isMenuActive(['ensino-home', 'dashboard_ensino', 'cursos', 'turmas'])}">
              <a href="#" class="nav-link submenu-toggle ${isActive('ensino') || isMenuActive(['ensino-home', 'dashboard_ensino', 'cursos', 'turmas'])}">
                <i class="ph ph-graduation-cap nav-icon"></i>
                <span class="nav-text">Ensino</span>
                <span class="nav-arrow">▼</span>
              </a>
              <ul class="submenu" ${isMenuOpen(['ensino', 'ensino-home', 'dashboard_ensino', 'cursos', 'turmas'])}>
                <li>
                  <a href="ensino-home.html" class="nav-link ${isActive('ensino-home')}">
                    <i class="ph ph-house nav-icon"></i> Início Ensino
                  </a>
                </li>
                <li>
                  <a href="dashboard_ensino.html" class="nav-link ${isActive('dashboard_ensino')}">
                    <i class="ph ph-chart-line-up nav-icon"></i> Dashboard
                  </a>
                </li>
                <li>
                  <a href="cursos.html" class="nav-link ${isActive('cursos')}">
                    <i class="ph ph-books nav-icon"></i> Cursos
                  </a>
                </li>
                <li>
                  <a href="turmas.html" class="nav-link ${isActive('turmas')}">
                    <i class="ph ph-users-three nav-icon"></i> Turmas e Alunos
                  </a>
                </li>
                <li>
                  <a href="tarefas-ensino.html" class="nav-link ${isActive('ensino')}">
                    <i class="ph ph-check-square nav-icon"></i> Gestão de Tarefas
                  </a>
                </li>
              </ul>
            </li>
            ` : ''}

            <li class="nav-item">
              <a href="#" class="nav-link ${isActive('kids')}">
                <i class="ph ph-teddy-bear nav-icon"></i>
                <span class="nav-text">Kids</span>
              </a>
            </li>

            ${canAccess('configuracoes') ? `
            <li class="nav-item has-submenu ${isActive('configuracoes') || isMenuActive(['cargos'])}">
              <a href="#" class="nav-link submenu-toggle ${isActive('configuracoes') || isMenuActive(['cargos'])}">
                <i class="ph ph-gear nav-icon"></i>
                <span class="nav-text">Configurações</span>
                <span class="nav-arrow">▼</span>
              </a>
              <ul class="submenu" ${isMenuOpen(['configuracoes', 'cargos'])}>
                <li>
                  <a href="cargos.html" class="nav-link ${isActive('cargos')}">
                    <i class="ph ph-shield-check nav-icon"></i> Cargos
                  </a>
                </li>
              </ul>
            </li>
            ` : ''}

          </ul>
        </nav>
      </aside>
    `;

    // Lógica do submenu transferida para o componente
    const submenuToggles = this.querySelectorAll('.submenu-toggle');
    submenuToggles.forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const parentItem = toggle.closest('.has-submenu');
        parentItem.classList.toggle('active');
        
        // Pega apenas o submenu direto para não afetar submenus filhos
        const submenu = Array.from(parentItem.children).find(el => el.classList.contains('submenu'));
        
        if (submenu) {
          submenu.style.display = parentItem.classList.contains('active') ? 'block' : 'none';
        }
      });
    });

    const overlay = this.querySelector('.sidebar-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => {
        document.body.classList.remove('mobile-open');
      });
    }
  }
}

class BottomNav extends HTMLElement {
  connectedCallback() {
    const activeItem = this.getAttribute('active-item') || '';
    const isActive = (item) => activeItem === item ? 'active' : '';

    const inPagesFolder = window.location.pathname.includes('/pages/');
    const muralUrl = inPagesFolder ? 'index.html' : 'pages/index.html';
    const membresiaUrl = inPagesFolder ? 'dashboard_membresia.html' : 'pages/dashboard_membresia.html';
    const ensinoUrl = inPagesFolder ? 'ensino-home.html' : 'pages/ensino-home.html';
    const inscricoesUrl = inPagesFolder ? 'inscricoes.html' : 'pages/inscricoes.html';

    this.innerHTML = `
      <nav class="bottom-nav">
        <!-- 1. Pessoas -->
        <a href="${membresiaUrl}" class="nav-item ${isActive('membresia') || isActive('pessoas')}">
          <i class="ph ph-users"></i>
          <span>Pessoas</span>
        </a>

        <!-- 2. Células -->
        <a href="#" class="nav-item ${isActive('celulas')}">
          <i class="ph ph-circles-three"></i>
          <span>Células</span>
        </a>

        <!-- 3. Mural (Centro) -->
        <a href="${muralUrl}" class="nav-item nav-item-center ${isActive('home') || isActive('mural')}">
          <div class="center-fab-circle" style="background:#0F3A4C!important;border-radius:50%!important;width:54px!important;height:54px!important;min-width:54px!important;min-height:54px!important;display:flex!important;align-items:center!important;justify-content:center!important;flex-shrink:0!important;box-shadow:0 4px 14px rgba(15,58,76,0.4)!important;">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 256 256" fill="#FFFFFF" style="display:block;flex-shrink:0;">
              <path d="M218.83,103.77l-80-75.48a1.14,1.14,0,0,1-.11-.11,16,16,0,0,0-21.53,0l-.11.11L37.17,103.77A16,16,0,0,0,32,115.55V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V160h32v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V115.55A16,16,0,0,0,218.83,103.77Z"/>
            </svg>
          </div>
          <span>Mural</span>
        </a>

        <!-- 4. Ensino -->
        <a href="${ensinoUrl}" class="nav-item ${isActive('ensino')}">
          <i class="ph ph-graduation-cap"></i>
          <span>Ensino</span>
        </a>

        <!-- 5. Inscrições -->
        <a href="${inscricoesUrl}" class="nav-item ${isActive('inscricoes')}">
          <i class="ph ph-clipboard-text"></i>
          <span>Inscrições</span>
        </a>
      </nav>
    `;
  }
}

customElements.define('iebi-topbar', Topbar);
customElements.define('iebi-sidebar', Sidebar);
customElements.define('iebi-bottom-nav', BottomNav);
