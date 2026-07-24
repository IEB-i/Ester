import { db, collection } from './firebase.js';
import { getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

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
            
            // Formatando Arrolamento com Badge
            let badgeClass = 'badge-gray';
            const arrolamento = pessoa.arrolamento || 'Não informado';
            if (arrolamento === 'Batismo') badgeClass = 'badge-green';
            else if (arrolamento === 'Transferência') badgeClass = 'badge-blue';

            tr.innerHTML = `
                <td><strong>${pessoa.nome || 'Sem nome'}</strong></td>
                <td>${pessoa.celular || '--'}</td>
                <td>${pessoa.email || '--'}</td>
                <td><span class="badge-status ${badgeClass}">${arrolamento}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" title="Ver Detalhes"><i class="ph ph-eye"></i></button>
                        <button class="btn-icon edit" title="Editar"><i class="ph ph-pencil-simple"></i></button>
                        <button class="btn-icon delete" title="Excluir"><i class="ph ph-trash"></i></button>
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
});
