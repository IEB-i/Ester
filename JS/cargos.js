import { db } from './firebase.js';
import { collection, getDocs, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { MODULES, Permissions } from './permissions.js';

document.addEventListener('DOMContentLoaded', async () => {
    const listaCargos = document.getElementById('listaCargos');
    const modalCargo = document.getElementById('modalCargo');
    const formCargo = document.getElementById('formCargo');
    const btnNovoCargo = document.getElementById('btnNovoCargo');
    const btnNovoCargoMobile = document.getElementById('btnNovoCargoMobile');
    const modulesContainer = document.getElementById('modulesContainer');
    
    let currentCargoId = null;

    // Proteção de segurança extra: Se não for admin, nem devia estar vendo essa página, 
    // mas se for apenas leitura, bloqueamos salvar.
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

    // Gerar checkboxes de módulos dinamicamente baseados na lista oficial
    function renderModulesForm() {
        modulesContainer.innerHTML = '';
        MODULES.forEach(mod => {
            // ícone genérico baseado no id
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
            
            if(snapshot.empty) {
                listaCargos.innerHTML = '<tr><td colspan="3" style="text-align:center;">Nenhum cargo customizado cadastrado.</td></tr>';
                return;
            }

            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                const id = docSnap.id;
                
                // Mapeia quais modulos tem acesso
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
        // Gerar um ID amigável a partir do nome
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
