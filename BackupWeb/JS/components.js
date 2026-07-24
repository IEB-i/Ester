class Topbar extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header class="topbar">
        <div class="topbar-brand">
          <img src="../assets/LogoBranco2.png" alt="IEBI Logo" class="brand-logo">
        </div>
        <div class="topbar-content">
          <div class="topbar-left">
            <button class="menu-toggle">
              <i class="ph ph-list" style="font-size: 1.5rem;"></i>
            </button>
            <span class="topbar-title">IGREJA EVANG BATISTA DE INTERMARES</span>
          </div>
          <div class="topbar-right">
            <button class="icon-btn">
              <i class="ph ph-user-circle"></i>
            </button>
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
  }
}

class Sidebar extends HTMLElement {
  connectedCallback() {
    const activeMenu = this.getAttribute('active-menu') || '';
    
    const isActive = (menu) => activeMenu === menu ? 'active' : '';
    const isMenuOpen = (menus) => menus.includes(activeMenu) ? 'style="display: block;"' : 'style="display: none;"';
    const isMenuActive = (menus) => menus.includes(activeMenu) ? 'active' : '';

    this.innerHTML = `
      <div class="sidebar-overlay"></div>
      <aside class="sidebar">
        <div class="sidebar-search">
          <input type="text" placeholder="Pesquisar..." class="search-input">
        </div>
        <nav class="sidebar-nav">
          <ul class="nav-menu">
            <li class="nav-item has-submenu ${isMenuActive(['membresia', 'pessoa-nova', 'dashboard', 'procurar-cadastro'])}">
              <a href="#" class="nav-link submenu-toggle ${isMenuActive(['membresia', 'pessoa-nova', 'dashboard', 'procurar-cadastro'])}">
                <i class="ph ph-user nav-icon"></i>
                <span class="nav-text">Membresia</span>
                <span class="nav-arrow">▼</span>
              </a>
              <ul class="submenu" ${isMenuOpen(['membresia', 'pessoa-nova', 'dashboard', 'procurar-cadastro'])}>
                <li>
                  <a href="index.html" class="nav-link ${isActive('dashboard')}">
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
            <li class="nav-item">
              <a href="#" class="nav-link ${isActive('pastoral')}">
                <i class="ph ph-church nav-icon"></i>
                <span class="nav-text">Área Pastoral</span>
              </a>
            </li>
            <li class="nav-item">
              <a href="#" class="nav-link ${isActive('igrejas')}">
                <i class="ph ph-bank nav-icon"></i>
                <span class="nav-text">Igrejas</span>
              </a>
            </li>
            <li class="nav-item">
              <a href="#" class="nav-link ${isActive('celulas')}">
                <i class="ph ph-users nav-icon"></i>
                <span class="nav-text">Células</span>
              </a>
            </li>
            <li class="nav-item">
              <a href="#" class="nav-link ${isActive('ministerios')}">
                <i class="ph ph-puzzle-piece nav-icon"></i>
                <span class="nav-text">Ministérios</span>
              </a>
            </li>
            <li class="nav-item">
              <a href="#" class="nav-link ${isActive('eventos')}">
                <i class="ph ph-calendar-blank nav-icon"></i>
                <span class="nav-text">Eventos</span>
              </a>
            </li>
            <li class="nav-item has-submenu ${isActive('ensino') || isMenuActive(['calendario', 'cursos', 'turmas'])}">
              <a href="#" class="nav-link submenu-toggle ${isActive('ensino') || isMenuActive(['calendario', 'cursos', 'turmas'])}">
                <i class="ph ph-graduation-cap nav-icon"></i>
                <span class="nav-text">Ensino</span>
                <span class="nav-arrow">▼</span>
              </a>
              <ul class="submenu" ${isMenuOpen(['ensino', 'calendario', 'cursos', 'turmas'])}>
                <li>
                  <a href="calendario.html" class="nav-link ${isActive('calendario')}">
                    <i class="ph ph-calendar nav-icon"></i> Calendário
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
            <li class="nav-item">
              <a href="#" class="nav-link ${isActive('kids')}">
                <i class="ph ph-teddy-bear nav-icon"></i>
                <span class="nav-text">Kids</span>
              </a>
            </li>
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

    this.innerHTML = `
      <nav class="bottom-nav">
        <a href="#" class="nav-item ${isActive('home')}">
          <i class="ph ph-house"></i>
          <span>Home</span>
        </a>
        <a href="#" class="nav-item ${isActive('pessoas')}">
          <i class="ph ph-users"></i>
          <span>Pessoas</span>
        </a>
        <a href="#" class="nav-item ${isActive('ensino')}">
          <i class="ph ph-graduation-cap"></i>
          <span>Ensino</span>
        </a>
        <a href="#" class="nav-item ${isActive('perfil')}">
          <i class="ph ph-user-circle"></i>
          <span>Perfil</span>
        </a>
      </nav>
    `;
  }
}

customElements.define('iebi-topbar', Topbar);
customElements.define('iebi-sidebar', Sidebar);
customElements.define('iebi-bottom-nav', BottomNav);
