export const MODULES = [
    { id: 'membresia', name: 'Membresia' },
    { id: 'ensino', name: 'Ensino' },
    { id: 'celulas', name: 'Células' },
    { id: 'financeiro', name: 'Financeiro / Tesouraria' },
    { id: 'eventos', name: 'Eventos' },
    { id: 'configuracoes', name: 'Configurações do Sistema' }
];

export class Permissions {
    /**
     * Retorna o objeto de permissões armazenado na sessão.
     * Exemplo: { membresia: 'write', ensino: 'read', configuracoes: 'none' }
     */
    static getMyPermissions() {
        try {
            const perms = sessionStorage.getItem('user_permissions');
            return perms ? JSON.parse(perms) : {};
        } catch (e) {
            return {};
        }
    }

    /**
     * Verifica se o usuário atual é o Master (Desenvolvedor)
     */
    static isMaster() {
        return sessionStorage.getItem('user_role') === 'admin';
    }

    /**
     * Verifica se o usuário tem algum nível de acesso ao módulo (read ou write)
     * @param {string} moduleId ID do módulo
     */
    static canAccess(moduleId) {
        if (this.isMaster()) return true;
        const perms = this.getMyPermissions();
        return perms[moduleId] === 'read' || perms[moduleId] === 'write';
    }

    /**
     * Verifica se o usuário tem permissão total (write) no módulo
     * @param {string} moduleId ID do módulo
     */
    static canWrite(moduleId) {
        if (this.isMaster()) return true;
        const perms = this.getMyPermissions();
        return perms[moduleId] === 'write';
    }

    /**
     * Bloqueia a interface para modo Apenas Leitura (Read-Only)
     * Procura botões com a classe .btn-save, .btn-delete, ou botões de submit e desabilita.
     * @param {string} moduleId Opcional, o módulo atual para avaliar o canWrite.
     */
    static enforceReadOnly(moduleId) {
        if (!moduleId) return;
        if (this.canWrite(moduleId)) return; // Se pode escrever, não bloqueia.

        // Se chegou aqui, é Read-Only
        setTimeout(() => {
            document.querySelectorAll('input, select, textarea').forEach(el => {
                el.disabled = true;
            });
            
            // Ocultar botões que alteram dados
            document.querySelectorAll('button[type="submit"], .btn-save, .btn-delete, .action-edit, .action-delete').forEach(btn => {
                btn.style.display = 'none';
            });

            // Banner avisando
            const banner = document.createElement('div');
            banner.innerHTML = `<i class="ph ph-lock-key"></i> Modo Apenas Leitura (Você não tem permissão para editar dados neste módulo)`;
            banner.style.cssText = 'background: #F39C12; color: white; padding: 10px; text-align: center; border-radius: 4px; font-weight: 500; margin-bottom: 20px; font-size: 0.9rem;';
            const mainContent = document.querySelector('.main-content') || document.body;
            if (mainContent.firstChild) {
                mainContent.insertBefore(banner, mainContent.firstChild);
            }
        }, 500); // pequeno timeout pro DOM montar (se frameworks/componentes)
    }
}
