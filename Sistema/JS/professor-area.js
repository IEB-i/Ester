import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { collection, doc, getDoc, getDocs, query, where, updateDoc, writeBatch, arrayUnion, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    let currentUserData = null;
    let turmasDoProfessor = [];
    let currentTurmaId = null;
    let currentAula = null;
    let alunosDaTurma = [];
    let currentTurmaObj = null; // Guardar objeto inteiro da turma ativa

    const teacherNameEl = document.getElementById('teacherName');
    const turmasListEl = document.getElementById('turmasList');
    const aulasListEl = document.getElementById('aulasList');
    const alunosListEl = document.getElementById('alunosList');
    const aulasTurmaTitle = document.getElementById('aulasTurmaTitle');
    const chamadaTitle = document.getElementById('chamadaTitle');
    const chamadaDate = document.getElementById('chamadaDate');
    const btnSalvarChamada = document.getElementById('btnSalvarChamada');

    // Elementos das Abas e Modais do Professor
    const alunosInscritosList = document.getElementById('alunosInscritosList');
    const fechamentoAlunosList = document.getElementById('fechamentoAlunosList');
    const btnSalvarFechamentoProfessor = document.getElementById('btnSalvarFechamentoProfessor');
    const panelFechamentoEncerrado = document.getElementById('panelFechamentoEncerrado');
    const panelFechamentoAtivo = document.getElementById('panelFechamentoAtivo');

    const confirmModal = document.getElementById('confirmModal');
    const confirmModalMessage = document.getElementById('confirmModalMessage');
    const btnCancelConfirm = document.getElementById('btnCancelConfirm');
    const btnOkConfirm = document.getElementById('btnOkConfirm');

    const transferModal = document.getElementById('transferModal');
    const transferTurmaSelect = document.getElementById('transferTurmaSelect');
    const btnCancelTransfer = document.getElementById('btnCancelTransfer');
    const btnConfirmTransfer = document.getElementById('btnConfirmTransfer');

    // Funções de UI
    window.PortalProfessor = {
        showSection: (sectionId) => {
            document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
            document.getElementById(`section-${sectionId}`).classList.add('active');
            if (sectionId === 'aulas') {
                window.switchTab('cronograma'); // Sempre inicia na aba de cronograma
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    window.switchTab = function (tabId) {
        document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
        document.querySelectorAll('.tab-button').forEach(b => {
            b.classList.remove('active');
            b.style.borderBottomColor = '';
            b.style.color = '';
            b.style.fontWeight = '';
        });

        const activeContent = document.getElementById(`tabContent${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`);
        const activeBtn = document.getElementById(`tabBtn${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`);
        if (activeContent) activeContent.style.display = 'block';
        if (activeBtn) {
            activeBtn.classList.add('active');
            setTimeout(() => {
                try {
                    activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                } catch (e) {
                    activeBtn.scrollIntoView(false);
                }
            }, 30);
        }
    };

    function showAlert(title, message, isError = false, onOkCallback = null) {
        document.getElementById('alertModalTitle').textContent = title;
        document.getElementById('alertModalMessage').textContent = message;
        const icon = document.getElementById('alertModalIcon');
        icon.style.color = isError ? "#E74C3C" : "#27AE60";
        icon.innerHTML = isError ? '<i class="ph ph-warning-circle"></i>' : '<i class="ph ph-check-circle"></i>';
        const btnOk = document.getElementById('btnOkAlert');
        btnOk.onclick = () => {
            document.getElementById('alertModal').classList.remove('active');
            if (typeof onOkCallback === 'function') {
                onOkCallback();
            }
        };
        document.getElementById('alertModal').classList.add('active');
    }

    function formatDateBr(dateString) {
        if (!dateString) return '';
        const [y, m, d] = dateString.split('-');
        return `${d}/${m}/${y}`;
    }

    // Inicialização do Usuário Autenticado via Armazenamento Local
    const userDataStr = sessionStorage.getItem('authenticated_user') || localStorage.getItem('authenticated_user');
    const tempUser = userDataStr ? JSON.parse(userDataStr) : null;

    if (tempUser) {
        const userId = tempUser.id || tempUser.uid;
        getDoc(doc(db, 'igrejas', 'iebi', 'usuarios', userId)).then(docSnap => {
            if (docSnap.exists()) {
                currentUserData = docSnap.data();
                loadTurmas();
            } else {
                currentUserData = tempUser;
                loadTurmas();
            }
        }).catch(err => {
            console.error("Erro ao buscar dados atualizados do usuário:", err);
            currentUserData = tempUser;
            loadTurmas();
        });
    } else {
        alert("Sessão inválida ou expirada. Por favor, refaça o login.");
        window.location.href = 'login.html';
    }

    // Carregar Turmas (onde o usuário logado é titular OR substituto)
    async function loadTurmas() {
        turmasListEl.innerHTML = '<div class="loading-state-box"><i class="ph ph-spinner ph-spin" style="font-size: 2rem;"></i></div>';
        try {
            const ref = collection(db, 'igrejas', 'iebi', 'turmas');
            const snap = await getDocs(ref);

            turmasDoProfessor = [];
            const userNomeNorm = (currentUserData.nome || '').trim().toUpperCase();

            snap.forEach(d => {
                const data = d.data();
                if (data.status !== 'Cancelada' && data.status !== 'Encerrada') {
                    const profNorm = (data.professor || '').trim().toUpperCase();
                    const subNorm = (data.professor_substituto || '').trim().toUpperCase();
                    const isMain = profNorm === userNomeNorm;
                    const isSub = subNorm === userNomeNorm;
                    if (isMain || isSub) {
                        turmasDoProfessor.push({ id: d.id, ...data, isSub: isSub });
                    }
                }
            });

            if (turmasDoProfessor.length === 0) {
                const dashEl = document.getElementById('professorDashboard');
                if (dashEl) dashEl.style.display = 'none';
                turmasListEl.innerHTML = `
                    <div style="text-align:center; padding:40px; color:var(--text-muted);">
                        <i class="ph ph-users-three" style="font-size: 2.5rem; margin-bottom: 12px; opacity:0.5;"></i>
                        <p style="font-size: 0.95rem;">Você não possui turmas ativas vinculadas ao seu nome no momento.</p>
                    </div>`;
                return;
            }

            // --- CÁLCULO DAS MÉTRICAS DO DASHBOARD ---
            const totalTurmas = turmasDoProfessor.length;
            const totalAlunos = turmasDoProfessor.reduce((acc, t) => acc + (t.vagas_ocupadas || 0), 0);

            const dashTotalTurmas = document.getElementById('dashTotalTurmas');
            const dashTotalAlunos = document.getElementById('dashTotalAlunos');
            if (dashTotalTurmas) dashTotalTurmas.textContent = totalTurmas;
            if (dashTotalAlunos) dashTotalAlunos.textContent = totalAlunos;

            const allAulas = [];

            // Busca as aulas dessas turmas para calcular aulas realizadas e presença média
            try {
                const ids = turmasDoProfessor.map(t => t.id);
                // O limite do Firestore para query 'in' é de 30 itens.
                const qAulas = query(collection(db, 'igrejas', 'iebi', 'aulas'), where('turmaId', 'in', ids.slice(0, 30)));
                const snapAulas = await getDocs(qAulas);

                snapAulas.forEach(da => {
                    allAulas.push({ id: da.id, ...da.data() });
                });

                let totalAulasRealizadas = 0;
                let totalAlunosNasAulas = 0;
                let totalPresencas = 0;

                allAulas.forEach(aula => {
                    if (aula.status === 'Realizada') {
                        totalAulasRealizadas++;

                        // Busca o total de matriculados da turma referente a esta aula
                        const turmaObj = turmasDoProfessor.find(t => t.id === aula.turmaId);
                        const numMatriculados = turmaObj ? (turmaObj.vagas_ocupadas || 0) : 0;

                        totalAlunosNasAulas += numMatriculados;
                        totalPresencas += (aula.presentes ? aula.presentes.length : 0);
                    }
                });

                const dashAulasMinistradas = document.getElementById('dashAulasMinistradas');
                const dashPresencaMedia = document.getElementById('dashPresencaMedia');

                if (dashAulasMinistradas) {
                    dashAulasMinistradas.textContent = `${totalAulasRealizadas} / ${allAulas.length}`;
                }

                if (totalAlunosNasAulas > 0 && dashPresencaMedia) {
                    const presencaMedia = Math.round((totalPresencas / totalAlunosNasAulas) * 100);
                    dashPresencaMedia.textContent = `${presencaMedia}%`;
                } else if (dashPresencaMedia) {
                    dashPresencaMedia.textContent = '--';
                }
            } catch (err) {
                console.error("Erro ao calcular métricas de aulas do professor:", err);
                const dashAulasMinistradas = document.getElementById('dashAulasMinistradas');
                const dashPresencaMedia = document.getElementById('dashPresencaMedia');
                if (dashAulasMinistradas) dashAulasMinistradas.textContent = '-- / --';
                if (dashPresencaMedia) dashPresencaMedia.textContent = '--';
            }

            const dashEl = document.getElementById('professorDashboard');
            if (dashEl) dashEl.style.display = 'grid';
            // ----------------------------------------

            turmasListEl.innerHTML = '';
            turmasDoProfessor.forEach(turma => {
                const card = document.createElement('div');
                card.className = 'professor-turma-card';

                const roleBadge = turma.isSub ? '<span class="substitute-badge">Substituto</span>' : '';
                const statusClass = turma.status === 'Inscrições Abertas' ? 'status-aberta' : 'status-andamento';

                // Filtrar aulas desta turma
                const aulasTurma = allAulas.filter(a => a.turmaId === turma.id);
                const totalAulas = aulasTurma.length;
                const aulasDadas = aulasTurma.filter(a => a.status === 'Realizada').length;

                // Calcular Frequência Média desta turma
                const aulasRealizadas = aulasTurma.filter(a => a.status === 'Realizada');
                const totalPresencasTurma = aulasRealizadas.reduce((acc, a) => acc + (a.presentes ? a.presentes.length : 0), 0);
                const totalPossivelTurma = aulasRealizadas.length * (turma.vagas_ocupadas || 0);

                let frequenciaTexto = '--';
                let frequenciaCor = 'var(--text-muted)';
                let frequenciaPercent = 0;
                if (totalPossivelTurma > 0) {
                    frequenciaPercent = Math.round((totalPresencasTurma / totalPossivelTurma) * 100);
                    frequenciaTexto = `${frequenciaPercent}%`;
                    if (frequenciaPercent >= 80) frequenciaCor = '#27AE60'; // Verde
                    else if (frequenciaPercent >= 60) frequenciaCor = '#F39C12'; // Laranja
                    else frequenciaCor = '#E74C3C'; // Vermelho
                }

                // Identificar Próxima Aula
                const agendadas = aulasTurma
                    .filter(a => a.status === 'Agendada')
                    .sort((a, b) => new Date(a.data_aula) - new Date(b.data_aula));

                let proximaAulaTexto = 'Nenhuma aula agendada';
                if (agendadas.length > 0) {
                    proximaAulaTexto = `Próxima: <strong>${formatDateBr(agendadas[0].data_aula)}</strong> às <strong>${agendadas[0].horario || turma.horario || '--:--'}</strong>`;
                } else if (totalAulas > 0 && aulasDadas === totalAulas) {
                    proximaAulaTexto = 'Cronograma concluído 🎉';
                }

                const progressoPercent = totalAulas > 0 ? Math.round((aulasDadas / totalAulas) * 100) : 0;

                card.innerHTML = `
                    <div class="card-header-flex" style="margin-bottom: 8px;">
                        <span class="class-status-tag ${statusClass}">${turma.status}</span>
                        ${roleBadge}
                    </div>
                    <h3 style="margin: 0 0 12px 0; color: var(--text-main); font-size: 1.12rem; font-weight: 700; display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; line-height: 1.25;">
                        ${turma.nome_turma}
                        <span style="font-size: 0.85rem; font-weight: 500; color: var(--text-muted); font-family: inherit;">• ${turma.nome_curso_cache || 'Curso sem nome'}</span>
                    </h3>
                    
                    <!-- Indicadores de Progresso e Frequência com Barras de Progresso Compactas -->
                    <div style="display: flex; gap: 24px; margin-bottom: 12px; flex-wrap: wrap;">
                        <!-- Progresso das Aulas -->
                        <div style="display: flex; flex-direction: column; gap: 4px; min-width: 100px;">
                            <div style="font-size: 0.76rem; font-weight: 600; color: var(--text-muted);">
                                Aulas Dadas: <span style="color: var(--text-main); font-weight: 700;">${aulasDadas}/${totalAulas}</span>
                            </div>
                            <div style="height: 5px; width: 100px; background: rgba(0,0,0,0.06); border-radius: 4px; overflow: hidden;">
                                <div style="height: 100%; width: ${progressoPercent}%; background: var(--primary); border-radius: 4px;"></div>
                            </div>
                        </div>
                        <!-- Frequência Média -->
                        <div style="display: flex; flex-direction: column; gap: 4px; min-width: 100px;">
                            <div style="font-size: 0.76rem; font-weight: 600; color: var(--text-muted);">
                                Frequência: <span style="color: ${frequenciaCor}; font-weight: 700;">${frequenciaTexto}</span>
                            </div>
                            <div style="height: 5px; width: 100px; background: rgba(0,0,0,0.06); border-radius: 4px; overflow: hidden;">
                                <div style="height: 100%; width: ${frequenciaPercent}%; background: ${frequenciaCor}; border-radius: 4px;"></div>
                            </div>
                        </div>
                    </div>

                    <div style="margin-top: 10px; font-size: 0.82rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px; border-top: 1px dashed rgba(0,0,0,0.06); padding-top: 10px; margin-bottom: 12px;">
                        <div style="display: flex; align-items: center; gap: 6px;"><i class="ph ph-users" style="color: var(--primary); font-size: 0.95rem;"></i> <span><strong>${turma.vagas_ocupadas || 0}</strong> alunos matriculados</span></div>
                        <div style="display: flex; align-items: center; gap: 6px;"><i class="ph ph-calendar-blank" style="color: var(--primary); font-size: 0.95rem;"></i> <span>${proximaAulaTexto}</span></div>
                    </div>

                    <!-- Botões de Ação do Card -->
                    <div style="display: flex; gap: 10px; margin-top: 12px;">
                        <button class="btn btn-primary btn-acessar-turma" style="flex: 1; padding: 8px 12px; font-size: 0.82rem; border-radius: 6px; justify-content: center; height: 36px; display: inline-flex; align-items: center; gap: 6px; font-weight: bold; background-color: var(--primary);">
                            <i class="ph ph-folder-open" style="font-size: 1rem;"></i> Acessar Turma
                        </button>
                    </div>
                `;

                card.onclick = () => openTurma(turma);
                turmasListEl.appendChild(card);
            });

            // Verificar se veio de ensino-home para abrir a turma diretamente
            const urlParams = new URLSearchParams(window.location.search);
            const autoOpenId = urlParams.get('turmaId') || sessionStorage.getItem('open_turma_id');
            if (autoOpenId) {
                sessionStorage.removeItem('open_turma_id');
                const targetTurma = turmasDoProfessor.find(t => t.id === autoOpenId);
                if (targetTurma) {
                    openTurma(targetTurma);
                } else {
                    getDoc(doc(db, 'igrejas', 'iebi', 'turmas', autoOpenId)).then(tSnap => {
                        if (tSnap.exists()) {
                            openTurma({ id: tSnap.id, ...tSnap.data() });
                        }
                    });
                }
            }

        } catch (e) {
            console.error("Erro ao carregar turmas:", e);
            turmasListEl.innerHTML = '<div style="color:#E74C3C; text-align:center; padding: 20px;">Erro ao carregar turmas.</div>';
        }
    }

    async function quickChamada(turma, aula, allAulas) {
        currentTurmaId = turma.id;
        currentTurmaObj = turma;
        alunosListEl.innerHTML = '<div class="loading-state-box"><i class="ph ph-spinner ph-spin" style="font-size: 2rem;"></i></div>';
        window.PortalProfessor.showSection('chamada');

        try {
            // 1. Busca alunos (Inscrições)
            const qAlunos = query(collection(db, 'igrejas', 'iebi', 'inscricoes'), where('id_turma', '==', turma.id));
            const snapAlunos = await getDocs(qAlunos);
            alunosDaTurma = [];
            snapAlunos.forEach(d => {
                const data = d.data();
                alunosDaTurma.push({
                    id: data.id_pessoa,
                    idInscricao: d.id,
                    nome: data.nome_pessoa_cache,
                    contato: data.contato_cache || ''
                });
            });
            alunosDaTurma.sort((a, b) => a.nome.localeCompare(b.nome));

            // Identificar número da aula hoje
            const aulasTurma = allAulas.filter(a => a.turmaId === turma.id);
            aulasTurma.sort((a, b) => new Date(a.data_aula) - new Date(b.data_aula));
            const idx = aulasTurma.findIndex(a => a.id === aula.id);
            const numAula = idx !== -1 ? idx + 1 : 1;

            openChamada(aula, numAula);
        } catch (e) {
            console.error("Erro ao iniciar chamada rápida:", e);
            showAlert("Erro", "Erro ao carregar dados dos alunos para a chamada.");
        }
    }

    // Ajustar cor do select do fechamento
    function updateSelectColor(selectObj) {
        if (!selectObj) return;
        selectObj.className = 'select-status select-fechamento-aluno';
        if (selectObj.value === 'Aprovado') selectObj.classList.add('aprovado');
        else if (selectObj.value === 'Desistente') selectObj.classList.add('desistente');
        else selectObj.classList.add('reprovado');
    }

    // Lógica de Confirmação e Fechamento de Turma (Visão Professor)
    let transferTurmas = [];

    if (btnSalvarFechamentoProfessor) {
        btnSalvarFechamentoProfessor.onclick = () => {
            if (!currentTurmaId || !currentTurmaObj) return;
            confirmModalMessage.textContent = `Ao fechar a turma "${currentTurmaObj.nome_turma}", você não poderá mais fazer chamadas ou matricular novos alunos. Tem certeza de que deseja encerrá-la?`;
            confirmModal.classList.add('active');
        };
    }

    if (btnCancelConfirm) {
        btnCancelConfirm.onclick = () => {
            confirmModal.classList.remove('active');
        };
    }

    if (btnOkConfirm) {
        btnOkConfirm.onclick = async () => {
            confirmModal.classList.remove('active');

            // Checar se o curso tem sequência direta para sugerir transferência
            try {
                const cursoRef = doc(db, 'igrejas', 'iebi', 'cursos', currentTurmaObj.id_curso);
                const cursoSnap = await getDoc(cursoRef);
                let proximoCursoId = null;
                transferTurmas = [];

                if (cursoSnap.exists()) {
                    const cData = cursoSnap.data();
                    proximoCursoId = cData.proximo_curso_id;

                    if (proximoCursoId) {
                        const qDestino = query(collection(db, 'igrejas', 'iebi', 'turmas'),
                            where('id_curso', '==', proximoCursoId),
                            where('status', '==', 'Inscrições Abertas')
                        );
                        const destSnap = await getDocs(qDestino);
                        destSnap.forEach(d => transferTurmas.push({ id: d.id, ...d.data() }));
                    }
                }

                if (transferTurmas.length > 0 && transferTurmaSelect) {
                    transferTurmaSelect.innerHTML = '<option value="">Não transferir / Apenas encerrar</option>';
                    transferTurmas.forEach(td => {
                        transferTurmaSelect.innerHTML += `<option value="${td.id}">${td.nome_turma}</option>`;
                    });
                    transferModal.classList.add('active');
                } else {
                    await executarFechamentoTurma(null);
                }
            } catch (err) {
                console.error("Erro ao verificar trilha de crescimento:", err);
                await executarFechamentoTurma(null);
            }
        };
    }

    if (btnCancelTransfer) {
        btnCancelTransfer.onclick = () => {
            transferModal.classList.remove('active');
        };
    }

    if (btnConfirmTransfer) {
        btnConfirmTransfer.onclick = async () => {
            transferModal.classList.remove('active');
            const destId = transferTurmaSelect ? transferTurmaSelect.value : null;
            await executarFechamentoTurma(destId || null);
        };
    }

    async function executarFechamentoTurma(destinoTurmaId) {
        const btn = btnSalvarFechamentoProfessor;
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Processando Fechamento...';
        btn.disabled = true;

        try {
            const batch = writeBatch(db);
            const dataConclusao = new Date().toISOString().split('T')[0];
            const selectElList = document.querySelectorAll('.select-fechamento-aluno');

            // 1. Atualizar cada inscrição com o status final
            selectElList.forEach(sel => {
                const inscId = sel.getAttribute('data-id');
                const pessoaId = sel.getAttribute('data-pessoa');
                const statusFinal = sel.value;

                const refInsc = doc(db, 'igrejas', 'iebi', 'inscricoes', inscId);
                batch.update(refInsc, { status_final: statusFinal });

                // 2. Se aprovado, atualizar histórico e transferir
                if (statusFinal === 'Aprovado' && pessoaId && pessoaId !== 'undefined' && pessoaId !== 'null') {
                    const refPessoa = doc(db, 'igrejas', 'iebi', 'pessoas', pessoaId);
                    batch.set(refPessoa, {
                        historico_cursos: arrayUnion({
                            id_turma: currentTurmaId,
                            id_curso: currentTurmaObj.id_curso || '',
                            nome_curso_cache: currentTurmaObj.nome_curso_cache || '',
                            nome_turma: currentTurmaObj.nome_turma || '',
                            data_conclusao: dataConclusao
                        })
                    }, { merge: true });

                    if (destinoTurmaId) {
                        const alunoData = alunosDaTurma.find(i => i.idInscricao === inscId);
                        if (alunoData) {
                            const refNovaInsc = doc(collection(db, 'igrejas', 'iebi', 'inscricoes'));
                            batch.set(refNovaInsc, {
                                id_turma: destinoTurmaId,
                                id_pessoa: pessoaId,
                                nome_pessoa_cache: alunoData.nome,
                                contato_cache: alunoData.contato || '',
                                data_inscricao: new Date()
                            });
                        }
                    }
                }
            });

            // 3. Encerrar Turma
            const turmaRef = doc(db, 'igrejas', 'iebi', 'turmas', currentTurmaId);
            batch.update(turmaRef, { status: 'Encerrada', data_fechamento: dataConclusao });

            await batch.commit();

            showAlert("Sucesso", "A turma foi encerrada e o histórico dos aprovados foi atualizado!", false);
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (err) {
            console.error("Erro ao fechar a turma:", err);
            showAlert("Erro", "Falha ao fechar a turma. Tente novamente.");
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }
    }

    // Carregar Aulas e Alunos da Turma selecionada
    async function openTurma(turma) {
        currentTurmaId = turma.id;
        currentTurmaObj = turma;
        aulasTurmaTitle.textContent = turma.nome_turma;
        window.PortalProfessor.showSection('aulas');

        aulasListEl.innerHTML = '<div class="loading-state-box"><i class="ph ph-spinner ph-spin" style="font-size: 2rem;"></i></div>';
        if (alunosInscritosList) alunosInscritosList.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 24px; color: var(--text-muted);"><i class="ph ph-spinner ph-spin"></i> Carregando alunos...</td></tr>';
        if (fechamentoAlunosList) fechamentoAlunosList.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 24px; color: var(--text-muted);"><i class="ph ph-spinner ph-spin"></i> Carregando dados...</td></tr>';

        try {
            // 1. Busca alunos (Inscrições)
            const qAlunos = query(collection(db, 'igrejas', 'iebi', 'inscricoes'), where('id_turma', '==', turma.id));
            const snapAlunos = await getDocs(qAlunos);
            alunosDaTurma = [];
            snapAlunos.forEach(d => {
                const data = d.data();
                alunosDaTurma.push({
                    id: data.id_pessoa,
                    idInscricao: d.id,
                    nome: data.nome_pessoa_cache,
                    contato: data.contato_cache || '',
                    status_final: data.status_final || null
                });
            });
            alunosDaTurma.sort((a, b) => a.nome.localeCompare(b.nome));

            // 2. Busca Aulas agendadas
            const qAulas = query(collection(db, 'igrejas', 'iebi', 'aulas'), where('turmaId', '==', turma.id));
            const snapAulas = await getDocs(qAulas);

            let aulas = [];
            snapAulas.forEach(d => aulas.push({ id: d.id, ...d.data() }));
            aulas.sort((a, b) => new Date(a.data_aula) - new Date(b.data_aula));

            const aulasRealizadas = aulas.filter(a => a.status === 'Realizada');
            const totalAulasRealizadas = aulasRealizadas.length;

            // --- ABA 1: CRONOGRAMA ---
            aulasListEl.innerHTML = '';

            if (aulas.length === 0) {
                aulasListEl.innerHTML = `
                    <div style="padding:40px; text-align:center; color:var(--text-muted);">
                        <i class="ph ph-calendar-x" style="font-size: 2.2rem; opacity:0.5; margin-bottom: 8px;"></i>
                        <p>Nenhuma aula agendada para esta turma no cronograma.</p>
                    </div>`;
            } else {
                const todayStr = new Date().toLocaleDateString('sv'); // YYYY-MM-DD local format
                aulas.forEach((aula, idx) => {
                    const card = document.createElement('div');
                    card.className = 'aula-item-card';

                    const isRealizada = aula.status === 'Realizada';

                    let actionBtnHtml = '';
                    if (aula.data_aula <= todayStr) {
                        if (isRealizada) {
                            actionBtnHtml = `
                                <button class="btn btn-outline btn-sm btn-fazer-chamada" style="width: 100px; padding: 6px 0; font-size: 0.8rem; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; gap: 4px; background: transparent; border: 1px solid var(--primary); color: var(--primary); font-weight: bold; border-color: var(--primary);">
                                    <i class="ph ph-pencil-simple"></i> Editar
                                </button>
                            `;
                        } else {
                            actionBtnHtml = `
                                <button class="btn btn-primary btn-sm btn-fazer-chamada" style="width: 100px; padding: 6px 0; font-size: 0.8rem; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; gap: 4px; background: var(--primary); border: none; font-weight: bold; color: white;">
                                    <i class="ph ph-checks"></i> Chamada
                                </button>
                            `;
                        }
                    } else {
                        actionBtnHtml = `
                            <button class="btn btn-sm" disabled style="width: 100px; padding: 6px 0; font-size: 0.8rem; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; gap: 4px; background: #e9ecef; border: 1px solid #ced4da; color: #6c757d; font-weight: 500; cursor: not-allowed; opacity: 0.8;">
                                <i class="ph ph-calendar-blank"></i> Futura
                            </button>
                        `;
                    }

                    card.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 14px;">
                            <div class="aula-number-badge">${idx + 1}</div>
                            <div>
                                <h4 style="margin: 0 0 3px 0; font-size: 0.95rem; font-weight: 700; color: var(--text-main);">Aula ${idx + 1}</h4>
                                <div style="font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px;">
                                    <i class="ph ph-calendar-blank"></i> ${formatDateBr(aula.data_aula)}
                                </div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 16px;">
                            ${actionBtnHtml}
                        </div>
                    `;

                    if (aula.data_aula <= todayStr) {
                        card.onclick = () => openChamada(aula, idx + 1);
                    }
                    aulasListEl.appendChild(card);
                });
            }

            // --- ABA 2: ALUNOS (LISTA SIMPLIFICADA) ---
            if (alunosInscritosList) {
                alunosInscritosList.innerHTML = '';
                if (alunosDaTurma.length === 0) {
                    alunosInscritosList.innerHTML = `<tr><td colspan="2" style="text-align: center; padding: 28px; color: var(--text-muted);">Nenhum aluno matriculado nesta turma.</td></tr>`;
                } else {
                    alunosDaTurma.forEach(aluno => {
                        let presencas = 0;
                        aulasRealizadas.forEach(aula => {
                            if (aula.presentes && aula.presentes.includes(aluno.idInscricao)) presencas++;
                        });

                        let freqPct = 100;
                        if (totalAulasRealizadas > 0) {
                            freqPct = Math.round((presencas / totalAulasRealizadas) * 100);
                        }

                        const initial = aluno.nome ? aluno.nome.charAt(0).toUpperCase() : '?';

                        let phoneHtml = '';
                        if (aluno.contato && aluno.contato.replace(/\D/g, '').length >= 10) {
                            let phone = aluno.contato.replace(/\D/g, '');
                            if (phone.length === 10 || phone.length === 11) phone = '55' + phone;
                            const firstFirstName = aluno.nome ? aluno.nome.split(' ')[0] : '';
                            const msg = encodeURIComponent(`Olá ${firstFirstName}, tudo bem? Sou o professor da sua turma ${turma.nome_turma} na Escola Bíblica da IEBI.`);
                            phoneHtml = `
                                <a href="https://wa.me/${phone}?text=${msg}" target="_blank" class="aluno-phone-link" title="Conversar no WhatsApp">
                                    <i class="ph ph-whatsapp-logo" style="color: #25D366; font-size: 0.95rem;"></i> ${aluno.contato}
                                </a>
                            `;
                        } else if (aluno.contato) {
                            phoneHtml = `<span class="aluno-phone-text">${aluno.contato}</span>`;
                        } else {
                            phoneHtml = `<span class="aluno-phone-text">Sem contato registrado</span>`;
                        }

                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>
                                <div class="aluno-cell">
                                    <div class="aluno-avatar">${initial}</div>
                                    <div class="aluno-details">
                                        <div class="aluno-nome" title="${aluno.nome}">${aluno.nome}</div>
                                        ${phoneHtml}
                                    </div>
                                </div>
                            </td>
                            <td style="text-align: center;">
                                <div class="freq-badge-container">
                                    <span class="freq-count">${presencas}/${totalAulasRealizadas}</span>
                                    <span class="freq-pill ${freqPct >= 75 ? 'good' : 'warning'}">${freqPct}%</span>
                                </div>
                            </td>
                        `;
                        alunosInscritosList.appendChild(tr);
                    });
                }
            }

            // --- ABA 3: FECHAMENTO ---
            if (fechamentoAlunosList) {
                fechamentoAlunosList.innerHTML = '';
                if (turma.status === 'Encerrada') {
                    if (panelFechamentoEncerrado) panelFechamentoEncerrado.style.display = 'block';
                    if (panelFechamentoAtivo) panelFechamentoAtivo.style.display = 'none';
                } else {
                    if (panelFechamentoEncerrado) panelFechamentoEncerrado.style.display = 'none';
                    if (panelFechamentoAtivo) panelFechamentoAtivo.style.display = 'block';
                }

                if (alunosDaTurma.length === 0) {
                    fechamentoAlunosList.innerHTML = `<tr><td colspan="2" style="text-align: center; padding: 28px; color: var(--text-muted);">Não há alunos matriculados para fechamento.</td></tr>`;
                    if (btnSalvarFechamentoProfessor) btnSalvarFechamentoProfessor.disabled = true;
                } else {
                    if (btnSalvarFechamentoProfessor) btnSalvarFechamentoProfessor.disabled = false;
                    alunosDaTurma.forEach(aluno => {
                        let presencas = 0;
                        aulasRealizadas.forEach(aula => {
                            if (aula.presentes && aula.presentes.includes(aluno.idInscricao)) presencas++;
                        });

                        let freqPct = 100;
                        if (totalAulasRealizadas > 0) {
                            freqPct = Math.round((presencas / totalAulasRealizadas) * 100);
                        }

                        let sugStatus = freqPct >= 75 ? 'Aprovado' : 'Reprovado por Falta';
                        if (aluno.status_final) {
                            sugStatus = aluno.status_final;
                        }

                        const initial = aluno.nome ? aluno.nome.charAt(0).toUpperCase() : '?';

                        const freqHtml = `
                            <div class="aluno-freq-inline">
                                <span class="freq-count-inline">${presencas}/${totalAulasRealizadas} aulas</span>
                                <span class="freq-pill ${freqPct >= 75 ? 'good' : 'warning'}">${freqPct}%</span>
                            </div>
                        `;

                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>
                                <div class="aluno-cell">
                                    <div class="aluno-avatar">${initial}</div>
                                    <div class="aluno-details">
                                        <div class="aluno-nome" title="${aluno.nome}">${aluno.nome}</div>
                                        ${freqHtml}
                                    </div>
                                </div>
                            </td>
                            <td style="text-align: center;">
                                <select class="select-status select-fechamento-aluno" data-id="${aluno.idInscricao}" data-pessoa="${aluno.id}" ${turma.status === 'Encerrada' ? 'disabled' : ''}>
                                    <option value="Aprovado" ${sugStatus === 'Aprovado' ? 'selected' : ''}>Aprovado</option>
                                    <option value="Reprovado por Falta" ${sugStatus === 'Reprovado por Falta' ? 'selected' : ''}>Reprovado por Falta</option>
                                    <option value="Reprovado por Nota" ${sugStatus === 'Reprovado por Nota' ? 'selected' : ''}>Reprovado por Nota</option>
                                    <option value="Desistente" ${sugStatus === 'Desistente' ? 'selected' : ''}>Desistente</option>
                                </select>
                            </td>
                        `;
                        fechamentoAlunosList.appendChild(tr);

                        const sel = tr.querySelector('select');
                        updateSelectColor(sel);
                        sel.addEventListener('change', () => updateSelectColor(sel));
                    });
                }
            }

        } catch (e) {
            console.error("Erro ao carregar cronograma e alunos da turma:", e);
            aulasListEl.innerHTML = '<div style="color:#E74C3C; text-align:center; padding: 20px;">Erro ao carregar cronograma.</div>';
        }
    }

    // Tela de Chamada e Controle de Presença
    function openChamada(aula, numeroAula) {
        currentAula = aula;
        chamadaTitle.textContent = `Chamada - Aula ${numeroAula}`;
        chamadaDate.textContent = `Aula em ${formatDateBr(aula.data_aula)}`;

        alunosListEl.innerHTML = '';

        if (alunosDaTurma.length === 0) {
            alunosListEl.innerHTML = `
                <div style="text-align:center; color:var(--text-muted); padding: 40px;">
                    <i class="ph ph-users-three" style="font-size: 2.2rem; opacity:0.5; margin-bottom: 8px;"></i>
                    <p>Não há alunos matriculados nesta turma para fazer chamada.</p>
                </div>`;
        } else {
            const temRegistroRealizado = (aula.status === 'Realizada') && Array.isArray(aula.presentes);
            const presentes = new Set(aula.presentes || []);

            alunosDaTurma.forEach(aluno => {
                const isPresente = temRegistroRealizado ? presentes.has(aluno.idInscricao) : true;

                const card = document.createElement('div');
                card.className = 'aluno-presenca-card';

                card.innerHTML = `
                    <div class="aluno-info-flex">
                        <span style="font-weight: 700; font-size: 0.92rem; color: var(--text-main);">${aluno.nome}</span>
                    </div>
                    
                    <button type="button" class="aluno-presence-chip ${isPresente ? 'presente' : 'falta'}" data-id="${aluno.idInscricao}" data-presente="${isPresente}">
                        ${isPresente ? '<i class="ph ph-check-circle" style="font-size: 1.05rem;"></i> PRESENTE' : '<i class="ph ph-x-circle" style="font-size: 1.05rem;"></i> FALTA'}
                    </button>
                `;

                const chipBtn = card.querySelector('.aluno-presence-chip');
                chipBtn.onclick = () => {
                    const currentState = chipBtn.getAttribute('data-presente') === 'true';
                    const newState = !currentState;
                    chipBtn.setAttribute('data-presente', newState ? 'true' : 'false');
                    if (newState) {
                        chipBtn.className = 'aluno-presence-chip presente';
                        chipBtn.innerHTML = '<i class="ph ph-check-circle" style="font-size: 1.05rem;"></i> PRESENTE';
                    } else {
                        chipBtn.className = 'aluno-presence-chip falta';
                        chipBtn.innerHTML = '<i class="ph ph-x-circle" style="font-size: 1.05rem;"></i> FALTA';
                    }
                };

                alunosListEl.appendChild(card);
            });
        }

        window.PortalProfessor.showSection('chamada');
    }

    // Salvar Diário e Lista de Chamada
    btnSalvarChamada.addEventListener('click', async () => {
        const originalText = btnSalvarChamada.innerHTML;
        btnSalvarChamada.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Salvando Presenças...';
        btnSalvarChamada.disabled = true;

        const presentesIds = [];
        document.querySelectorAll('.aluno-presence-chip').forEach(chip => {
            if (chip.getAttribute('data-presente') === 'true') {
                presentesIds.push(chip.getAttribute('data-id'));
            }
        });

        try {
            const aulaRef = doc(db, 'igrejas', 'iebi', 'aulas', currentAula.id);
            await updateDoc(aulaRef, {
                presentes: presentesIds,
                status: 'Realizada'
            });

            currentAula.presentes = presentesIds;
            currentAula.status = 'Realizada';

            if (currentTurmaId) {
                sessionStorage.setItem('open_turma_id', currentTurmaId);
            }
            showAlert("Diário Salvo!", "A presença da aula foi registrada com sucesso.", false, () => {
                window.location.reload();
            });

        } catch (e) {
            console.error("Erro ao salvar diário de chamada:", e);
            showAlert("Erro ao Salvar", "Não foi possível registrar a chamada. Tente novamente.", true);
        } finally {
            btnSalvarChamada.innerHTML = originalText;
            btnSalvarChamada.disabled = false;
        }
    });

});
