import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { collection, doc, getDoc, getDocs, query, where, updateDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    let currentUserData = null;
    let turmasDoProfessor = [];
    let currentTurmaId = null;
    let currentAula = null;
    let alunosDaTurma = [];

    const teacherNameEl = document.getElementById('teacherName');
    const turmasListEl = document.getElementById('turmasList');
    const aulasListEl = document.getElementById('aulasList');
    const alunosListEl = document.getElementById('alunosList');
    const aulasTurmaTitle = document.getElementById('aulasTurmaTitle');
    const chamadaTitle = document.getElementById('chamadaTitle');
    const chamadaDate = document.getElementById('chamadaDate');
    const btnSalvarChamada = document.getElementById('btnSalvarChamada');

    // Funções de UI
    window.PortalProfessor = {
        showSection: (sectionId) => {
            document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
            document.getElementById(`section-${sectionId}`).classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    function showAlert(title, message, isError = false) {
        document.getElementById('alertModalTitle').textContent = title;
        document.getElementById('alertModalMessage').textContent = message;
        const icon = document.getElementById('alertModalIcon');
        icon.style.color = isError ? "#E74C3C" : "#27AE60";
        icon.innerHTML = isError ? '<i class="ph ph-warning-circle"></i>' : '<i class="ph ph-check-circle"></i>';
        document.getElementById('alertModal').classList.add('active');
    }

    document.getElementById('btnOkAlert').addEventListener('click', () => {
        document.getElementById('alertModal').classList.remove('active');
    });

    function formatDateBr(dateString) {
        if(!dateString) return '';
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
                turmasListEl.innerHTML = `
                    <div style="text-align:center; padding:40px; color:var(--text-muted);">
                        <i class="ph ph-users-three" style="font-size: 2.5rem; margin-bottom: 12px; opacity:0.5;"></i>
                        <p style="font-size: 0.95rem;">Você não possui turmas ativas vinculadas ao seu nome no momento.</p>
                    </div>`;
                return;
            }

            turmasListEl.innerHTML = '';
            turmasDoProfessor.forEach(turma => {
                const card = document.createElement('div');
                card.className = 'professor-turma-card';
                
                const roleBadge = turma.isSub ? '<span class="substitute-badge">Substituto</span>' : '';
                const statusClass = turma.status === 'Inscrições Abertas' ? 'status-aberta' : 'status-andamento';
                
                card.innerHTML = `
                    <div class="card-header-flex">
                        <span class="class-status-tag ${statusClass}">${turma.status}</span>
                        ${roleBadge}
                    </div>
                    <h3 style="margin: 0 0 6px 0; color: var(--text-main); font-size: 1.15rem; font-weight: 700;">${turma.nome_turma}</h3>
                    <p style="margin: 0; color: var(--text-muted); font-size: 0.88rem; font-weight: 500;">${turma.nome_curso_cache || 'Curso sem nome'}</p>
                    
                    <div style="margin-top: 16px; font-size: 0.82rem; color: var(--text-muted); display:flex; gap:16px; flex-wrap: wrap;">
                        <span><i class="ph ph-calendar"></i> Início: ${formatDateBr(turma.data_inicio)}</span>
                        <span><i class="ph ph-users"></i> ${turma.vagas_ocupadas || 0} alunos</span>
                    </div>
                `;
                card.onclick = () => openTurma(turma);
                turmasListEl.appendChild(card);
            });

        } catch (e) {
            console.error("Erro ao carregar turmas:", e);
            turmasListEl.innerHTML = '<div style="color:#E74C3C; text-align:center; padding: 20px;">Erro ao carregar turmas.</div>';
        }
    }

    // Carregar Aulas e Alunos da Turma selecionada
    async function openTurma(turma) {
        currentTurmaId = turma.id;
        aulasTurmaTitle.textContent = turma.nome_turma;
        window.PortalProfessor.showSection('aulas');
        
        aulasListEl.innerHTML = '<div class="loading-state-box"><i class="ph ph-spinner ph-spin" style="font-size: 2rem;"></i></div>';

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
                    nome: data.nome_pessoa_cache 
                });
            });
            alunosDaTurma.sort((a,b) => a.nome.localeCompare(b.nome));

            // 2. Busca Aulas agendadas
            const qAulas = query(collection(db, 'igrejas', 'iebi', 'aulas'), where('turmaId', '==', turma.id));
            const snapAulas = await getDocs(qAulas);
            
            let aulas = [];
            snapAulas.forEach(d => aulas.push({ id: d.id, ...d.data() }));
            aulas.sort((a,b) => new Date(a.data_aula) - new Date(b.data_aula));

            aulasListEl.innerHTML = '';
            
            if(aulas.length === 0) {
                aulasListEl.innerHTML = `
                    <div style="padding:40px; text-align:center; color:var(--text-muted);">
                        <i class="ph ph-calendar-x" style="font-size: 2.2rem; opacity:0.5; margin-bottom: 8px;"></i>
                        <p>Nenhuma aula agendada para esta turma no cronograma.</p>
                    </div>`;
                return;
            }

            aulas.forEach((aula, idx) => {
                const card = document.createElement('div');
                card.className = 'aula-item-card';

                const isRealizada = aula.status === 'Realizada';
                const statusClass = isRealizada ? 'status-realizada' : 'status-agendada';

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
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span class="aula-status-pill ${statusClass}">${aula.status}</span>
                        <i class="ph ph-caret-right" style="color: var(--text-muted); font-size: 1.1rem;"></i>
                    </div>
                `;
                
                card.onclick = () => openChamada(aula, idx + 1);
                aulasListEl.appendChild(card);
            });

        } catch (e) {
            console.error("Erro ao carregar aulas da turma:", e);
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
            const presentes = new Set(aula.presentes || []);
            
            alunosDaTurma.forEach(aluno => {
                const isPresente = presentes.has(aluno.idInscricao);
                
                const card = document.createElement('div');
                card.className = 'aluno-presenca-card';
                
                // Abreviação do Avatar (Iniciais)
                const iniciais = aluno.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
                
                card.innerHTML = `
                    <div class="aluno-info-flex">
                        <div class="aluno-avatar">${iniciais}</div>
                        <div>
                            <span style="font-weight: 700; font-size: 0.92rem; color: var(--text-main); display: block;">${aluno.nome}</span>
                        </div>
                    </div>
                    
                    <div class="presence-segmented" data-id="${aluno.idInscricao}">
                        <button type="button" class="presence-btn falta ${!isPresente ? 'active' : ''}">FALTA</button>
                        <button type="button" class="presence-btn presenca ${isPresente ? 'active' : ''}">PRESENÇA</button>
                    </div>
                `;
                
                // Lógica de Alternância nos Segmentados
                const segment = card.querySelector('.presence-segmented');
                const btnFalta = segment.querySelector('.falta');
                const btnPresenca = segment.querySelector('.presenca');
                
                btnFalta.addEventListener('click', () => {
                    btnFalta.classList.add('active');
                    btnPresenca.classList.remove('active');
                });
                
                btnPresenca.addEventListener('click', () => {
                    btnPresenca.classList.add('active');
                    btnFalta.classList.remove('active');
                });

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
        document.querySelectorAll('.presence-segmented').forEach(segment => {
            const btnPresenca = segment.querySelector('.presenca');
            if (btnPresenca.classList.contains('active')) {
                presentesIds.push(segment.dataset.id);
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

            showAlert("Diário Salvo!", "A presença da aula foi registrada com sucesso.");
            window.PortalProfessor.showSection('aulas');
            
            // Recarrega as aulas da turma para atualizar o status em tela
            const turmaObj = turmasDoProfessor.find(t => t.id === currentTurmaId);
            openTurma(turmaObj);

        } catch (e) {
            console.error("Erro ao salvar diário de chamada:", e);
            showAlert("Erro ao Salvar", "Não foi possível registrar a chamada. Tente novamente.", true);
        } finally {
            btnSalvarChamada.innerHTML = originalText;
            btnSalvarChamada.disabled = false;
        }
    });

});
