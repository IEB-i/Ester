import { db } from './firebase.js';
import { doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const currentPage = window.location.pathname.split('/').pop() || 'index.html';

// Páginas públicas
const publicPages = ['Visitantes.html', 'agradecimento-visitante.html', 'login.html'];

// Esconde o corpo da página para evitar "flash" de conteúdo protegido
if (!publicPages.includes(currentPage)) {
    const style = document.createElement('style');
    style.id = 'authGuardStyle';
    style.textContent = 'body { display: none !important; }';
    document.head.appendChild(style);
}

function getStoredUser() {
    try {
        const stored = sessionStorage.getItem('authenticated_user') || localStorage.getItem('authenticated_user');
        return stored ? JSON.parse(stored) : null;
    } catch(e) {
        return null;
    }
}

function clearStoredUser() {
    sessionStorage.removeItem('authenticated_user');
    sessionStorage.removeItem('user_role');
    sessionStorage.removeItem('user_permissions');
    localStorage.removeItem('authenticated_user');
}

async function checkAuth() {
    // Páginas públicas que não precisam de login (exceto login.html que trata redirecionamento)
    if (publicPages.includes(currentPage) && currentPage !== 'login.html') return; 

    const user = getStoredUser();

    if (!user) {
        if (currentPage !== 'login.html') {
            const loginPath = window.location.pathname.includes('/pages/') ? 'login.html' : 'pages/login.html';
            window.location.replace(loginPath);
        }
        return;
    }

    try {
        let userData = user;
        if (user.id) {
            try {
                const docRef = doc(db, 'igrejas', 'iebi', 'usuarios', user.id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    userData = { id: docSnap.id, ...docSnap.data() };
                    sessionStorage.setItem('authenticated_user', JSON.stringify(userData));
                    localStorage.setItem('authenticated_user', JSON.stringify(userData));
                }
            } catch(e) {
                console.warn("Usando dados de sessão em cache:", e);
            }
        }

        let role = userData.role || 'membro';
        let nomeUsuario = userData.nome || '';

        sessionStorage.setItem('user_role', role);

        // Buscar configurações dinâmicas do Cargo
        let permissoes = {};
        if (role !== 'admin' && role !== 'membro') {
            try {
                const cargoSnap = await getDoc(doc(db, 'igrejas', 'iebi', 'cargos', role));
                if (cargoSnap.exists()) {
                    permissoes = cargoSnap.data().permissoes || {};
                }
            } catch (err) {
                console.error("Erro ao buscar permissões do cargo", err);
            }
        }
        sessionStorage.setItem('user_permissions', JSON.stringify(permissoes));

        // Dispara evento para a barra lateral recriar os menus com a permissão correta
        window.dispatchEvent(new Event('permissionsLoaded'));

        // Verifica dinamicamente se o usuário é professor (tem turmas ativas vinculadas ao nome dele)
        let isTeacher = false;
        if (nomeUsuario) {
            const userNomeNorm = nomeUsuario.trim().toUpperCase();
            const snap = await getDocs(collection(db, 'igrejas', 'iebi', 'turmas'));
            snap.forEach(d => {
                const data = d.data();
                if (data.status !== 'Encerrada' && data.status !== 'Cancelada') {
                    const profNorm = (data.professor || '').trim().toUpperCase();
                    const subNorm = (data.professor_substituto || '').trim().toUpperCase();
                    if (profNorm === userNomeNorm || subNorm === userNomeNorm) {
                        isTeacher = true;
                    }
                }
            });
        }

        const isAdmin = (role === 'admin');

        // Mapeamento de Rotas -> Módulo para bloqueio de URL
        const routeModules = {
            'cargos.html': 'configuracoes',
            'dashboard_membresia.html': 'membresia',
            'pessoa-nova.html': 'membresia',
            'procurar-cadastro.html': 'membresia',
            'dashboard_ensino.html': 'ensino',
            'calendario.html': 'ensino',
            'cursos.html': 'ensino',
            'turmas.html': 'ensino',
            'tarefas-ensino.html': 'ensino'
        };

        // Roteamento a partir da tela de Login
        if (currentPage === 'login.html') {
            if (isAdmin || Object.keys(permissoes).length > 0) {
                window.location.replace('../index.html');
            } else if (isTeacher) {
                window.location.replace('ensino-home.html');
            } else {
                window.location.replace('index.html');
            }
            return;
        }

        // Validação e Proteção das rotas
        let allowed = false;

        if (isAdmin) {
            allowed = true;
        } else if (Object.keys(permissoes).length > 0) {
            if (currentPage === 'index.html') {
                allowed = true;
            } else {
                const requiredModule = routeModules[currentPage];
                if (requiredModule) {
                    const p = permissoes[requiredModule];
                    allowed = (p === 'read' || p === 'write');
                } else {
                    allowed = true;
                }
            }

            if (!allowed && isTeacher && (currentPage === 'professor-area.html' || currentPage === 'ensino-home.html')) {
                allowed = true;
            }

            if (!allowed) {
                const indexPath = window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
                window.location.replace(indexPath);
                return;
            }
        } else if (isTeacher) {
            if (['ensino-home.html', 'professor-area.html', 'index.html', 'bem-vindo.html'].includes(currentPage)) {
                allowed = true;
            } else {
                const portalPath = window.location.pathname.includes('/pages/') ? 'ensino-home.html' : 'pages/ensino-home.html';
                window.location.replace(portalPath);
                return;
            }
        } else {
            if (['index.html', 'bem-vindo.html'].includes(currentPage)) {
                allowed = true;
            } else {
                const welcomePath = window.location.pathname.includes('/pages/') ? 'index.html' : 'pages/index.html';
                window.location.replace(welcomePath);
                return;
            }
        }

        // Se tem permissão, exibe a página
        if (allowed) {
            const authStyle = document.getElementById('authGuardStyle');
            if (authStyle) authStyle.remove();
        }

        // Configurar botão de logout padrão se existir na página
        const btnLogout = document.getElementById('btnLogout');
        if (btnLogout) {
            const newBtn = btnLogout.cloneNode(true);
            btnLogout.parentNode.replaceChild(newBtn, btnLogout);
            
            newBtn.addEventListener('click', () => {
                clearStoredUser();
                const loginPath = window.location.pathname.includes('/pages/') ? 'login.html' : 'pages/login.html';
                window.location.href = loginPath;
            });
        }

    } catch (e) {
        console.error("Erro ao validar permissões do usuário:", e);
    }
}

checkAuth();
