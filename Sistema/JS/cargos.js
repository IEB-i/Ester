import { db } from './firebase.js';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { MODULES, Permissions } from './permissions.js';

document.addEventListener('DOMContentLoaded', async () => {
    const listaCargos = document.getElementById('listaCargos');
    const listaUsuarios = document.getElementById('listaUsuarios');
    const modalCargo = document.getElementById('modalCargo');
    const formCargo = document.getElementById('formCargo');
    const btnNovoCargo = document.getElementById('btnNovoCargo');
    const btnNovoCargoMobile = document.getElementById('btnNovoCargoMobile');
    const modulesContainer = document.getElementById('modulesContainer');

    const tabCargosBtn = document.getElementById('tabCargosBtn');
    const tabUsuariosBtn = document.getElementById('tabUsuariosBtn');
    const tabCargosContent = document.getElementById('tabCargosContent');
    const tabUsuariosContent = document.getElementById('tabUsuariosContent');
    const searchUsuarios = document.getElementById('searchUsuarios');
    const userCountInfo = document.getElementById('userCountInfo');

    let currentCargoId = null;
    let todosCargos = [];
    let todosUsuarios = [];

    // Proteção de segurança
    if(!Permissions.canAccess('configuracoes')) {
        alert('Acesso negado.');
        window.location.href = '../index.html';
        return;
    }

    const canWrite = Permissions.canWrite('configuracoes');
    if(!canWrite) {
        if (btnNovoCargo) btnNovoCargo.style.display = 'none';
        if (btnNovoCargoMobile) btnNovoCargoMobile.style.display = 'none';
    }

    // Controle de Abas
    function alternarAba(aba) {
        if (aba === 'cargos') {
            tabCargosBtn.classList.add('active');
            tabCargosBtn.style.color = 'var(--primary)';
            tabCargosBtn.style.borderBottomColor = 'var(--primary)';
            
            tabUsuariosBtn.classList.remove('active');
            tabUsuariosBtn.style.color = 'var(--text-muted)';
            tabUsuariosBtn.style.borderBottomColor = 'transparent';

            tabCargosContent.style.display = 'block';
            tabUsuariosContent.style.display = 'none';
            
            if (canWrite && btnNovoCargo) btnNovoCargo.style.display = 'flex';
            if (canWrite && btnNovoCargoMobile) btnNovoCargoMobile.style.display = 'flex';
        } else {
            tabUsuariosBtn.classList.add('active');
            tabUsuariosBtn.style.color = 'var(--primary)';
            tabUsuariosBtn.style.borderBottomColor = 'var(--primary)';
            
            tabCargosBtn.classList.remove('active');
            tabCargosBtn.style.color = 'var(--text-muted)';
            tabCargosBtn.style.borderBottomColor = 'transparent';

            tabUsuariosContent.style.display = 'block';
            tabCargosContent.style.display = 'none';

            if (btnNovoCargo) btnNovoCargo.style.display = 'none';
            if (btnNovoCargoMobile) btnNovoCargoMobile.style.display = 'none';

            carregarUsuarios();
        }
    }

    if (tabCargosBtn) tabCargosBtn.addEventListener('click', () => alternarAba('cargos'));
    if (tabUsuariosBtn) tabUsuariosBtn.addEventListener('click', () => alternarAba('usuarios'));

    // Gerar campos de permissões por módulo
    function renderModulesForm() {
        modulesContainer.innerHTML = '';
        MODULES.forEach(mod => {
            let icon = 'ph-squares-four';
            if(mod.id === 'membresia') icon = 'ph-users';
            if(mod.id === 'ensino') icon = 'ph-graduation-cap';
            if(mod.id === 'celulas') icon = 'ph-users-three';
            if(mod.id === 'financeiro') icon = 'ph-currency-dollar';
            if(mod.id === 'eventos') icon = 'ph-calendar-blank';
            if(mod.id === 'configuracoes') icon = 'ph-gear';

            modulesContainer.innerHTML += `
                <div class="module-card">
                    <div class="module-info">
                        <div class="module-icon"><i class="ph ${icon}"></i></div>
                        <span class="module-title">${mod.name}</span>
                    </div>
                    <div class="perm-options">
                        <select name="perm_${mod.id}" class="form-control" style="width: 120px; padding: 6px 10px; font-size: 0.85rem; border-radius: 8px; cursor: pointer; height: auto;">
                            <option value="none">Nenhum</option>
                            <option value="read">Leitura</option>
                            <option value="write">Edição</option>
                        </select>
                    </div>
                </div>
            `;
        });
    }

    async function carregarCargos() {
        try {
            listaCargos.innerHTML = '<tr><td colspan="3" style="text-align:center;">Carregando...</td></tr>';
            const snapshot = await getDocs(collection(db, 'igrejas', 'iebi', 'cargos'));
            
            listaCargos.innerHTML = '';
            todosCargos = [];
            
            if(snapshot.empty) {
                listaCargos.innerHTML = '<tr><td colspan="3" style="text-align:center;">Nenhum cargo customizado cadastrado.</td></tr>';
                return;
            }

            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                const id = docSnap.id;
                todosCargos.push({ id, ...data });
                
                const acessos = [];
                if(data.permissoes) {
                    Object.keys(data.permissoes).forEach(k => {
                        if(data.permissoes[k] !== 'none') {
                            const modName = MODULES.find(m => m.id === k)?.name || k;
                            acessos.push(modName);
                        }
                    });
                }
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight: 600;">${data.nome || id}</td>
                    <td style="color: var(--text-muted); font-size: 0.9rem;">
                        ${acessos.length > 0 ? acessos.join(', ') : 'Sem acessos'}
                    </td>
                    <td style="text-align: center;">
                        <button class="btn-icon edit btn-editar" data-id="${id}" title="Editar" ${!canWrite ? 'disabled' : ''}>
                            <i class="ph ph-pencil-simple"></i>
                        </button>
                        <button class="btn-icon delete btn-excluir" data-id="${id}" title="Excluir" ${!canWrite ? 'disabled' : ''}>
                            <i class="ph ph-trash"></i>
                        </button>
                    </td>
                `;
                listaCargos.appendChild(tr);

                tr.querySelector('.btn-editar').addEventListener('click', () => {
                    abrirModalEditar(id, data);
                });

                tr.querySelector('.btn-excluir').addEventListener('click', async () => {
                    if(confirm(`Tem certeza que deseja excluir o cargo ${data.nome}?`)) {
                        await deleteDoc(doc(db, 'igrejas', 'iebi', 'cargos', id));
                        carregarCargos();
                    }
                });
            });
            
        } catch (error) {
            console.error("Erro ao carregar cargos", error);
            listaCargos.innerHTML = '<tr><td colspan="3" style="text-align:center;color:red;">Erro ao carregar cargos.</td></tr>';
        }
    }

    // Carregar e listar todos os usuários para atribuição de cargo
    async function carregarUsuarios() {
        if (!listaUsuarios) return;
        try {
            listaUsuarios.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 20px;">Carregando usuários...</td></tr>';
            
            // Garantir que os cargos mais recentes estejam carregados
            if (todosCargos.length === 0) {
                const snapCargos = await getDocs(collection(db, 'igrejas', 'iebi', 'cargos'));
                todosCargos = [];
                snapCargos.forEach(d => todosCargos.push({ id: d.id, ...d.data() }));
            }

            const snapshot = await getDocs(collection(db, 'igrejas', 'iebi', 'usuarios'));
            todosUsuarios = [];
            snapshot.forEach(docSnap => {
                todosUsuarios.push({ id: docSnap.id, ...docSnap.data() });
            });

            renderListaUsuarios(todosUsuarios);
        } catch (error) {
            console.error("Erro ao carregar usuários:", error);
            listaUsuarios.innerHTML = '<tr><td colspan="3" style="text-align:center; color:red;">Erro ao carregar lista de usuários.</td></tr>';
        }
    }

    function renderListaUsuarios(usuarios) {
        listaUsuarios.innerHTML = '';
        if (userCountInfo) userCountInfo.textContent = `${usuarios.length} usuário(s) encontrado(s)`;

        if (usuarios.length === 0) {
            listaUsuarios.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 20px;">Nenhum usuário encontrado.</td></tr>';
            return;
        }

        usuarios.forEach(u => {
            const roleAtual = u.role || 'membro';
            const tr = document.createElement('tr');

            // Montar opções de cargos no select
            let selectHtml = `<select class="form-control select-user-role" data-userid="${u.id}" ${!canWrite ? 'disabled' : ''} style="width: 100%; max-width: 220px; font-size: 0.88rem; padding: 6px 10px; border-radius: 8px; cursor: pointer;">`;
            selectHtml += `<option value="membro" ${roleAtual === 'membro' ? 'selected' : ''}>🌱 Membro (Padrão)</option>`;
            selectHtml += `<option value="admin" ${roleAtual === 'admin' ? 'selected' : ''}>👑 Administrador (Acesso Total)</option>`;
            
            if (todosCargos.length > 0) {
                selectHtml += `<optgroup label="Cargos Personalizados">`;
                todosCargos.forEach(c => {
                    selectHtml += `<option value="${c.id}" ${roleAtual === c.id ? 'selected' : ''}>🛡️ ${c.nome || c.id}</option>`;
                });
                selectHtml += `</optgroup>`;
            }
            selectHtml += `</select>`;

            tr.innerHTML = `
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 34px; height: 34px; border-radius: 50%; background: var(--header-bg); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; flex-shrink: 0;">
                            ${(u.nome || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style="font-weight: 600; color: var(--text-main);">${u.nome || 'Usuário Sem Nome'}</div>
                        </div>
                    </div>
                </td>
                <td style="color: var(--text-muted); font-size: 0.85rem;">
                    <div>${u.email || '-'}</div>
                    <div style="font-size: 0.78rem; opacity: 0.8;">${u.telefone || ''}</div>
                </td>
                <td>
                    ${selectHtml}
                    <span class="save-status" id="status_${u.id}" style="font-size: 0.75rem; display: block; margin-top: 4px;"></span>
                </td>
            `;

            listaUsuarios.appendChild(tr);
        });

        // Adicionar event listener para os selects de cargo
        document.querySelectorAll('.select-user-role').forEach(select => {
            select.addEventListener('change', async (e) => {
                const userId = e.target.getAttribute('data-userid');
                const novoRole = e.target.value;
                const statusEl = document.getElementById(`status_${userId}`);

                if (statusEl) {
                    statusEl.style.color = 'var(--primary)';
                    statusEl.textContent = 'Salvando...';
                }

                try {
                    await updateDoc(doc(db, 'igrejas', 'iebi', 'usuarios', userId), {
                        role: novoRole
                    });

                    if (statusEl) {
                        statusEl.style.color = '#27AE60';
                        statusEl.textContent = '✓ Cargo atualizado!';
                        setTimeout(() => { statusEl.textContent = ''; }, 3000);
                    }
                } catch (err) {
                    console.error("Erro ao alterar cargo do usuário:", err);
                    if (statusEl) {
                        statusEl.style.color = '#E74C3C';
                        statusEl.textContent = '❌ Erro ao salvar';
                    }
                }
            });
        });
    }

    // Filtro de busca na lista de usuários
    if (searchUsuarios) {
        searchUsuarios.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase().trim();
            const filtrados = todosUsuarios.filter(u => 
                (u.nome || '').toLowerCase().includes(term) ||
                (u.email || '').toLowerCase().includes(term) ||
                (u.telefone || '').includes(term)
            );
            renderListaUsuarios(filtrados);
        });
    }

    function abrirModalNovo() {
        currentCargoId = null;
        document.getElementById('modalTitle').textContent = 'Novo Cargo';
        document.getElementById('nomeCargo').value = '';
        MODULES.forEach(mod => {
            const selectEl = document.querySelector(`select[name="perm_${mod.id}"]`);
            if(selectEl) selectEl.value = 'none';
        });
        modalCargo.classList.add('active');
    }

    function abrirModalEditar(id, data) {
        currentCargoId = id;
        document.getElementById('modalTitle').textContent = 'Editar Cargo';
        document.getElementById('nomeCargo').value = data.nome || id;
        
        MODULES.forEach(mod => {
            const val = data.permissoes && data.permissoes[mod.id] ? data.permissoes[mod.id] : 'none';
            const selectEl = document.querySelector(`select[name="perm_${mod.id}"]`);
            if(selectEl) selectEl.value = val;
        });
        
        modalCargo.classList.add('active');
    }

    // Iniciar
    renderModulesForm();
    carregarCargos();

    if (btnNovoCargo) btnNovoCargo.addEventListener('click', abrirModalNovo);
    if (btnNovoCargoMobile) btnNovoCargoMobile.addEventListener('click', abrirModalNovo);
    
    document.getElementById('btnFecharModal').addEventListener('click', () => {
        modalCargo.classList.remove('active');
    });
    
    document.getElementById('btnCancelar').addEventListener('click', () => {
        modalCargo.classList.remove('active');
    });

    formCargo.addEventListener('submit', async (e) => {
        e.preventDefault();
        if(!canWrite) return;

        const nome = document.getElementById('nomeCargo').value.trim();
        const cargoId = currentCargoId || nome.toLowerCase().replace(/[^a-z0-9]/g, '_');
        
        const permissoes = {};
        MODULES.forEach(mod => {
            const selectEl = document.querySelector(`select[name="perm_${mod.id}"]`);
            permissoes[mod.id] = selectEl ? selectEl.value : 'none';
        });

        const btnSubmit = document.getElementById('btnSalvar');
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = 'Salvando...';

        try {
            await setDoc(doc(db, 'igrejas', 'iebi', 'cargos', cargoId), {
                nome: nome,
                permissoes: permissoes
            });
            modalCargo.classList.remove('active');
            carregarCargos();
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar cargo.');
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '<i class="ph ph-floppy-disk"></i> Salvar Cargo';
        }
    });

});
