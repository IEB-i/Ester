import { db, collection, doc } from './firebase.js';
import { getDoc, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    function showAlertModal(message, isError = true) {
        const modal = document.getElementById('alertModal');
        const titleEl = document.getElementById('alertModalTitle');
        const msgEl = document.getElementById('alertModalMessage');
        if(modal && titleEl && msgEl) {
            msgEl.textContent = message;
            titleEl.textContent = isError ? "Atenção!" : "Sucesso!";
            modal.classList.add('active');
        } else {
            alert(message);
        }
    }

    const btnOkAlert = document.getElementById('btnOkAlert');
    if(btnOkAlert) {
        btnOkAlert.addEventListener('click', () => {
            document.getElementById('alertModal').classList.remove('active');
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const turmaId = urlParams.get('id');

    if (!turmaId) {
        showAlertModal("Nenhuma turma selecionada. Voltando para página de turmas.");
        setTimeout(() => { window.location.href = "turmas.html"; }, 2000);
        return;
    }

    // Elementos da Turma
    const badgeStatus = document.getElementById('badgeStatus');
    const turmaNomeTitle = document.getElementById('turmaNomeTitle');
    const cursoNomeTitle = document.getElementById('cursoNomeTitle');
    const lblProfessor = document.getElementById('lblProfessor');
    const lblDatas = document.getElementById('lblDatas');
    const lblHorario = document.getElementById('lblHorario');
    const listaAulas = document.getElementById('listaAulas');

    function formatDateBr(dateString) {
        if(!dateString) return '--';
        const parts = dateString.split('-');
        if(parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return dateString;
    }

    function getDiaSemana(dateString) {
        // Usa T12:00:00 para evitar problema de fuso
        const d = new Date(dateString + 'T12:00:00');
        const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        return dias[d.getDay()];
    }

    try {
        // Carregar Turma
        const turmaRef = doc(db, 'igrejas', 'iebi', 'turmas', turmaId);
        const turmaSnap = await getDoc(turmaRef);

        if (!turmaSnap.exists()) {
            showAlertModal("Turma não encontrada no banco de dados.");
            return;
        }

        const turmaData = turmaSnap.data();

        // Atualizar Header
        turmaNomeTitle.textContent = turmaData.nome_turma;
        cursoNomeTitle.textContent = turmaData.nome_curso_cache || '--';
        lblProfessor.textContent = turmaData.professor || '--';
        lblDatas.textContent = `${formatDateBr(turmaData.data_inicio)} a ${formatDateBr(turmaData.data_fim)}`;
        lblHorario.textContent = turmaData.horario || '--';
        badgeStatus.textContent = turmaData.status;

        // Cores do Badge
        if(turmaData.status === 'Inscrições Abertas') badgeStatus.style.background = 'var(--primary)';
        else if(turmaData.status === 'Em Andamento') badgeStatus.style.background = '#F39C12';
        else if(turmaData.status === 'Encerrada') badgeStatus.style.background = '#7F8C8D';
        else badgeStatus.style.background = 'var(--text-muted)';
        badgeStatus.style.color = '#fff';

        // Carregar Aulas
        const aulasRef = collection(db, 'igrejas', 'iebi', 'aulas');
        // Firestore requer um índice se usar orderBy + where juntos em subcoleções complexas, mas na web modular padrão ele gera automático se pedir link, 
        // para evitar erro no console do cliente sem o link do indice, vamos buscar com onde e ordenar na memória.
        const qAulas = query(aulasRef, where('turmaId', '==', turmaId));
        const aulasSnap = await getDocs(qAulas);
        
        let aulasArr = [];
        aulasSnap.forEach(d => {
            aulasArr.push({ id: d.id, ...d.data() });
        });

        // Ordenar pela data
        aulasArr.sort((a, b) => new Date(a.data_aula) - new Date(b.data_aula));

        listaAulas.innerHTML = '';

        if(aulasArr.length === 0) {
            listaAulas.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 40px; color: var(--text-muted);">Nenhuma aula gerada para esta turma.</td></tr>`;
        } else {
            aulasArr.forEach(aula => {
                const tr = document.createElement('tr');
                const statusClass = aula.status === 'Realizada' ? 'status-realizada' : 'status-agendada';
                const diaSemana = getDiaSemana(aula.data_aula);
                
                let acaoHtml = '';
                if(turmaData.status === 'Encerrada') {
                    acaoHtml = `<span style="color: var(--text-muted); font-size: 0.85rem;"><i class="ph ph-lock-key"></i> Bloqueado</span>`;
                } else {
                    acaoHtml = `
                        <button class="btn-chamada" data-id="${aula.id}" title="Chamada">
                            <i class="ph ph-check-square-offset"></i> Chamada
                        </button>
                    `;
                }
                
                tr.innerHTML = `
                    <td style="font-weight: 500;">${formatDateBr(aula.data_aula)}</td>
                    <td style="color: var(--text-muted);">${diaSemana}</td>
                    <td style="color: var(--text-muted);">${aula.horario || '--'}</td>
                    <td><span class="${statusClass}">${aula.status}</span></td>
                    <td style="text-align: right;">${acaoHtml}</td>
                `;
                listaAulas.appendChild(tr);
            });

            // Bind dos botões
            document.querySelectorAll('.btn-chamada').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const aulaId = e.currentTarget.getAttribute('data-id');
                    window.location.href = `chamada.html?aulaId=${aulaId}&turmaId=${turmaId}`;
                });
            });
        }

    } catch (e) {
        console.error("Erro ao carregar turma/aulas:", e);
        listaAulas.innerHTML = `<tr><td colspan="5" style="text-align:center; color: #E74C3C;">Erro ao carregar cronograma. Verifique sua conexão.</td></tr>`;
    }
});
