import { db, collection, doc } from './firebase.js';
import { getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.getElementById('tableBody');
    const searchInput = document.getElementById('searchInput');
    let pessoasData = [];

    // Função para buscar os dados no Firebase
    async function fetchPessoas() {
        try {
            const pessoasRef = collection(db, 'igrejas', 'iebi', 'pessoas');
            const querySnapshot = await getDocs(pessoasRef);
            
            pessoasData = [];
            querySnapshot.forEach((doc) => {
                pessoasData.push({ id: doc.id, ...doc.data() });
            });

            renderTable(pessoasData);
        } catch (error) {
            console.error("Erro ao buscar pessoas: ", error);
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #E74C3C;">Erro ao carregar dados. Verifique a conexão.</td></tr>`;
        }
    }

    // Função para renderizar a tabela
    function renderTable(data) {
        tableBody.innerHTML = ''; // Limpar a tabela

        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 32px;">Nenhum cadastro encontrado.</td></tr>`;
            return;
        }

        data.forEach(pessoa => {
            const tr = document.createElement('tr');
            
            // Calculate Age and Format Date
            let idade = '--';
            let dataNascFormatada = '--';
            if (pessoa.data_nascimento) {
                const birthDate = pessoa.data_nascimento.toDate ? pessoa.data_nascimento.toDate() : new Date(pessoa.data_nascimento);
                if (!isNaN(birthDate)) {
                    dataNascFormatada = birthDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                    const today = new Date();
                    let age = today.getFullYear() - birthDate.getFullYear();
                    const m = today.getMonth() - birthDate.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                        age--;
                    }
                    idade = `${age} anos`;
                }
            }

            const arrolamento = pessoa.arrolamento ? pessoa.arrolamento.toUpperCase() : 'ARROLAMENTO NÃO INFORMADO';
            const subtitle = `IGREJA EVANG BATISTA DE INTERMARES - ${arrolamento}`;
            const rol = pessoa.matricula_rol ? `Rol.: ${pessoa.matricula_rol}` : 'Rol.: --';
            const cod = `Cód.: ${pessoa.id.substring(0,4).toUpperCase()}`;
            const nome = pessoa.nome ? pessoa.nome.toUpperCase() : 'SEM NOME';

            tr.innerHTML = `
                <td style="text-align: center;">
                    <div class="user-avatar-placeholder">
                        <i class="ph ph-user"></i>
                    </div>
                </td>
                <td>
                    <div class="table-cell-flex">
                        <div class="cell-main-info">
                            <strong class="cell-title">${nome}</strong>
                            <span class="cell-subtitle">${subtitle}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="cell-stacked">
                        <span class="cell-primary">${dataNascFormatada}</span>
                        <span class="cell-secondary italic">${idade}</span>
                    </div>
                </td>
                <td>
                    <div class="cell-stacked">
                        <span class="cell-primary">${pessoa.celular || '--'}</span>
                        <span class="cell-secondary">${pessoa.email || '--'}</span>
                    </div>
                </td>
                <td style="text-align: center;">
                    <div class="action-buttons" style="justify-content: center;">
                        <button class="btn-icon btn-view" data-id="${pessoa.id}" title="Ver Detalhes"><i class="ph ph-eye"></i></button>
                        <button class="btn-icon btn-edit" data-id="${pessoa.id}" title="Editar"><i class="ph ph-pencil-simple"></i></button>
                        <button class="btn-icon btn-delete" data-id="${pessoa.id}" title="Excluir"><i class="ph ph-trash"></i></button>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // Evento de Pesquisa (Filtro local em tempo real)
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            
            const filteredData = pessoasData.filter(pessoa => {
                const nomeMatch = (pessoa.nome || '').toLowerCase().includes(searchTerm);
                const celularMatch = (pessoa.celular || '').toLowerCase().includes(searchTerm);
                return nomeMatch || celularMatch;
            });

            renderTable(filteredData);
        });
    }

    // Iniciar a busca quando a página carrega
    fetchPessoas();

    // Event delegation para os botões de ação na tabela
    tableBody.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const id = btn.getAttribute('data-id');
        if (!id) return;

        if (btn.classList.contains('btn-view')) {
            window.location.href = `pessoa-nova.html?id=${id}&view=true`;
        } else if (btn.classList.contains('btn-edit')) {
            window.location.href = `pessoa-nova.html?id=${id}`;
        } else if (btn.classList.contains('btn-delete')) {
            deleteId = id;
            if (document.getElementById('deleteModal')) {
                document.getElementById('deleteModal').classList.add('active');
            }
        }
    });

    let deleteId = null;
    const deleteModal = document.getElementById('deleteModal');
    const btnCancelDelete = document.getElementById('btnCancelDelete');
    const btnConfirmDelete = document.getElementById('btnConfirmDelete');
    
    const sucessoModal = document.getElementById('sucessoModal');
    const btnOkSucesso = document.getElementById('btnOkSucesso');

    if (btnCancelDelete && deleteModal) {
        btnCancelDelete.addEventListener('click', () => {
            deleteModal.classList.remove('active');
            deleteId = null;
        });
    }

    if (btnConfirmDelete && deleteModal) {
        btnConfirmDelete.addEventListener('click', async () => {
            if (!deleteId) return;
            
            const originalText = btnConfirmDelete.innerHTML;
            btnConfirmDelete.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Excluindo...';
            btnConfirmDelete.disabled = true;

            try {
                const pessoaRef = doc(db, 'igrejas', 'iebi', 'pessoas', deleteId);
                await deleteDoc(pessoaRef);
                
                deleteModal.classList.remove('active');
                if (sucessoModal) {
                    sucessoModal.classList.add('active');
                }
                
                fetchPessoas(); // Recarregar a lista
            } catch (error) {
                console.error("Erro ao excluir pessoa:", error);
                alert('Erro ao excluir o cadastro. Verifique sua permissão ou conexão.');
                deleteModal.classList.remove('active');
            } finally {
                btnConfirmDelete.innerHTML = originalText;
                btnConfirmDelete.disabled = false;
                deleteId = null;
            }
        });
    }

    if (btnOkSucesso && sucessoModal) {
        btnOkSucesso.addEventListener('click', () => {
            sucessoModal.classList.remove('active');
        });
    }
});
