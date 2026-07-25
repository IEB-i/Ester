import { db, collection, doc } from './firebase.js';
import { getDoc, getDocs, query, where, orderBy, updateDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

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

    let currentConfirmAction = null;
    const confirmModal = document.getElementById('confirmModal');
    const btnCancelConfirm = document.getElementById('btnCancelConfirm');
    const btnOkConfirm = document.getElementById('btnOkConfirm');

    function showConfirmModal(message, onConfirm) {
        if(confirmModal) {
            document.getElementById('confirmModalMessage').textContent = message;
            currentConfirmAction = onConfirm;
            confirmModal.classList.add('active');
        } else {
            if(confirm(message)) onConfirm();
        }
    }

    if(btnCancelConfirm) {
        btnCancelConfirm.addEventListener('click', () => {
            confirmModal.classList.remove('active');
            currentConfirmAction = null;
        });
    }

    if(btnOkConfirm) {
        btnOkConfirm.addEventListener('click', () => {
            confirmModal.classList.remove('active');
            if(currentConfirmAction) currentConfirmAction();
            currentConfirmAction = null;
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
                const statusClass = aula.status === 'Realizada' ? 'status-realizada' : (aula.status === 'Cancelada' ? 'status-cancelada' : 'status-agendada');
                const diaSemana = getDiaSemana(aula.data_aula);
                
                let iconHtml = '';
                if(aula.status === 'Realizada') iconHtml = '<i class="ph ph-check-circle status-icon"></i>';
                else if(aula.status === 'Cancelada') iconHtml = '<i class="ph ph-x-circle status-icon"></i>';
                else iconHtml = '<i class="ph ph-clock status-icon"></i>';
                
                const totalInscritos = turmaData.vagas_ocupadas || 0;
                const qtdPresentes = aula.presentes ? aula.presentes.length : 0;
                let relacaoHtml = '';
                if(aula.status === 'Realizada') {
                    relacaoHtml = `<span style="font-size: 0.85rem; color: var(--text-muted); margin-left: 12px; font-weight: 600; white-space: nowrap;" title="${qtdPresentes} presentes de ${totalInscritos} inscritos"><i class="ph ph-users" style="vertical-align: middle; font-size: 1rem;"></i> ${qtdPresentes}/${totalInscritos}</span>`;
                }
                
                let acaoHtml = '';
                if(turmaData.status === 'Encerrada') {
                    acaoHtml = `<div style="display:flex; justify-content: center;"><span style="color: var(--text-muted); font-size: 0.85rem;" title="Bloqueado"><i class="ph ph-lock-key" style="font-size: 1.2rem;"></i></span></div>`;
                } else if (aula.status === 'Cancelada') {
                    acaoHtml = `
                        <div style="display:flex; justify-content: center;">
                            <button class="btn-restaurar" data-id="${aula.id}" title="Restaurar Aula">
                                <i class="ph ph-arrow-counter-clockwise"></i>
                            </button>
                        </div>
                    `;
                } else {
                    acaoHtml = `
                        <div style="display:flex; gap: 8px; justify-content: center;">
                            <button class="btn-chamada" data-id="${aula.id}" title="Realizar Chamada">
                                <i class="ph ph-check-square-offset"></i>
                            </button>
                            <button class="btn-cancelar btn-cancel-aula" data-id="${aula.id}" title="Cancelar Aula (Feriado ou Imprevisto)">
                                <i class="ph ph-prohibit"></i>
                            </button>
                        </div>
                    `;
                }
                
                tr.innerHTML = `
                    <td style="font-weight: 500;">
                        ${formatDateBr(aula.data_aula)}
                        <div class="show-on-mobile-block" style="display:none; color: var(--text-muted); font-size: 0.8rem; margin-top: 4px;">${aula.horario || '--'}</div>
                    </td>
                    <td class="hide-on-mobile" style="color: var(--text-muted);">${diaSemana}</td>
                    <td class="hide-on-mobile" style="color: var(--text-muted);">${aula.horario || '--'}</td>
                    <td><div style="display:flex; align-items:center;"><span class="${statusClass}">${iconHtml} <span class="status-text">${aula.status}</span></span>${relacaoHtml}</div></td>
                    <td style="text-align: center;">${acaoHtml}</td>
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

            document.querySelectorAll('.btn-cancel-aula').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const aulaId = e.currentTarget.getAttribute('data-id');
                    const targetBtn = e.currentTarget;
                    showConfirmModal("Tem certeza que deseja marcar esta aula como cancelada? (Ex: Feriado ou Imprevisto)", async () => {
                        try {
                            targetBtn.disabled = true;
                            targetBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i>';
                            const aulaRef = doc(db, 'igrejas', 'iebi', 'aulas', aulaId);
                            await updateDoc(aulaRef, { status: 'Cancelada' });
                            location.reload();
                        } catch(err) {
                            console.error(err);
                            showAlertModal("Erro ao cancelar a aula.");
                        }
                    });
                });
            });

            document.querySelectorAll('.btn-restaurar').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const aulaId = e.currentTarget.getAttribute('data-id');
                    const targetBtn = e.currentTarget;
                    showConfirmModal("Deseja restaurar esta aula para o cronograma?", async () => {
                        try {
                            targetBtn.disabled = true;
                            targetBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i>';
                            const aulaRef = doc(db, 'igrejas', 'iebi', 'aulas', aulaId);
                            await updateDoc(aulaRef, { status: 'Agendada' });
                            location.reload();
                        } catch(err) {
                            console.error(err);
                            showAlertModal("Erro ao restaurar a aula.");
                        }
                    });
                });
            });
        }

        // =====================================
        // LOGICA DE IMPRESSÃO DO DIÁRIO
        // =====================================
        const btnImprimirDiario = document.getElementById('btnImprimirDiario');
        let diarioPreparado = false;

        if (btnImprimirDiario) {
            btnImprimirDiario.addEventListener('click', async () => {
                if (!diarioPreparado) {
                    try {
                        btnImprimirDiario.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Preparando...';
                        btnImprimirDiario.disabled = true;

                        // 1. Preencher Cabeçalho de Impressão
                        document.getElementById('printCurso').textContent = turmaData.nome_curso_cache || '--';
                        document.getElementById('printTurma').textContent = turmaData.nome_turma || '--';
                        document.getElementById('printProfessor').textContent = turmaData.professor || '--';
                        document.getElementById('printPeriodo').textContent = `${formatDateBr(turmaData.data_inicio)} a ${formatDateBr(turmaData.data_fim)}`;

                        // 2. Buscar Alunos Matriculados
                        const inscricoesRef = collection(db, 'igrejas', 'iebi', 'inscricoes');
                        const qInsc = query(inscricoesRef, where('id_turma', '==', turmaId), where('status', '==', 'Ativa'));
                        const inscSnap = await getDocs(qInsc);
                        
                        let alunos = [];
                        inscSnap.forEach(d => {
                            const data = d.data();
                            alunos.push({ id: d.id, nome: data.nome_pessoa_cache || 'Sem nome' });
                        });
                        
                        alunos.sort((a,b) => a.nome.localeCompare(b.nome));

                        // 3. Montar Cabeçalho da Tabela (Colunas de Datas)
                        const printTableHeader = document.getElementById('printTableHeader');
                        let thHtml = `<th style="width: 30px; text-align: center;">Nº</th><th style="width: 240px;">Nome do Aluno</th>`;
                        
                        // Lista todas as aulas exceto canceladas para o diário de presença
                        const aulasAtivas = aulasArr.filter(a => a.status !== 'Cancelada');
                        
                        aulasAtivas.forEach(aula => {
                            const dataFormatada = formatDateBr(aula.data_aula).substring(0, 5); // DD/MM
                            thHtml += `<th class="col-data" style="width: 40px; text-align: center;">${dataFormatada}</th>`;
                        });
                        // Coluna extra para Faltas totais e Observações
                        thHtml += `<th style="width: 50px; text-align:center; font-size:10px;">Faltas</th>`;
                        thHtml += `<th style="text-align: center;">Observações</th>`;
                        printTableHeader.innerHTML = thHtml;

                        // 4. Montar Linhas da Tabela (Alunos)
                        const printTableBody = document.getElementById('printTableBody');
                        let tbodyHtml = '';
                        
                        if(alunos.length === 0) {
                            tbodyHtml = `<tr><td colspan="${aulasAtivas.length + 4}" style="text-align:center; padding: 20px;">Nenhum aluno matriculado nesta turma.</td></tr>`;
                        } else {
                            alunos.forEach((aluno, index) => {
                                let row = `<tr>
                                    <td style="text-align: center;">${index + 1}</td>
                                    <td style="font-weight: 500; font-size: 10px;">${aluno.nome.toUpperCase()}</td>`;
                                
                                let faltasCount = 0;

                                // Células de Aulas
                                aulasAtivas.forEach((aula) => {
                                    if (aula.status === 'Realizada') {
                                        const isPresent = (aula.presentes || []).includes(aluno.id);
                                        if (isPresent) {
                                            // Ponto centralizado para presença
                                            row += `<td style="text-align:center; font-size: 14px; font-weight: bold;">&bull;</td>`;
                                        } else {
                                            // F para falta
                                            row += `<td style="text-align:center; color: #333; font-weight: bold;">F</td>`;
                                            faltasCount++;
                                        }
                                    } else {
                                        // Aula agendada, deixa em branco para o professor preencher na caneta
                                        row += `<td></td>`;
                                    }
                                });
                                
                                // Célula extra faltas totais e observações
                                row += `<td style="text-align:center; font-weight: bold;">${faltasCount > 0 ? faltasCount : ''}</td><td style="text-align:center;"></td></tr>`;
                                tbodyHtml += row;
                            });
                        }
                        printTableBody.innerHTML = tbodyHtml;
                        
                        diarioPreparado = true;
                    } catch(err) {
                        console.error("Erro ao preparar diário:", err);
                        showAlertModal("Erro ao gerar o diário de classe. Tente novamente.");
                        btnImprimirDiario.innerHTML = '<i class="ph ph-printer"></i> Imprimir Diário de Classe';
                        btnImprimirDiario.disabled = false;
                        return;
                    } finally {
                        btnImprimirDiario.innerHTML = '<i class="ph ph-printer"></i> Imprimir Diário de Classe';
                        btnImprimirDiario.disabled = false;
                    }
                }
                
                // Dispara a impressão
                window.print();
            });
        }

    } catch (e) {
        console.error("Erro ao carregar turma/aulas:", e);
        listaAulas.innerHTML = `<tr><td colspan="5" style="text-align:center; color: #E74C3C;">Erro ao carregar cronograma. Verifique sua conexão.</td></tr>`;
    }
});
