import { db, doc, collection } from './firebase.js';
import { getDoc, getDocs, updateDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

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

    document.getElementById('btnOkAlert')?.addEventListener('click', () => {
        document.getElementById('alertModal').classList.remove('active');
    });

    const urlParams = new URLSearchParams(window.location.search);
    const aulaId = urlParams.get('aulaId');
    const turmaId = urlParams.get('turmaId');

    if (!aulaId || !turmaId) {
        showAlertModal("Faltam parâmetros para carregar o diário.");
        setTimeout(() => { window.location.href = "turmas.html"; }, 2000);
        return;
    }

    const linkVoltar = document.getElementById('linkVoltar');
    if(linkVoltar) linkVoltar.href = `aulas.html?id=${turmaId}`;

    function formatDateBr(dateString) {
        if(!dateString) return '--/--/----';
        const parts = dateString.split('-');
        if(parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return dateString;
    }

    let aulaData = null;
    let inscritosArr = [];
    const listaAlunos = document.getElementById('listaAlunos');
    const countPresentes = document.getElementById('countPresentes');
    const countTotal = document.getElementById('countTotal');

    function updateCounters() {
        const checkboxes = document.querySelectorAll('.chamada-checkbox');
        let presentes = 0;
        checkboxes.forEach(cb => { if(cb.checked) presentes++; });
        countPresentes.textContent = presentes;
    }

    window.marcarTodos = function() {
        const checkboxes = document.querySelectorAll('.chamada-checkbox');
        checkboxes.forEach(cb => cb.checked = true);
        updateCounters();
        
        // Altera visual do texto
        document.querySelectorAll('.toggle-label').forEach(lbl => {
            lbl.textContent = 'Presente';
            lbl.style.color = '#27AE60';
        });
    };

    try {
        // 1. Carregar Aula e Turma
        const aulaRef = doc(db, 'igrejas', 'iebi', 'aulas', aulaId);
        const aulaSnap = await getDoc(aulaRef);
        
        const turmaRef = doc(db, 'igrejas', 'iebi', 'turmas', turmaId);
        const turmaSnap = await getDoc(turmaRef);

        if (!aulaSnap.exists() || !turmaSnap.exists()) {
            showAlertModal("Aula ou Turma não encontrada.");
            return;
        }

        aulaData = aulaSnap.data();
        const turmaData = turmaSnap.data();

        // 2. Preencher Header
        document.getElementById('lblTurma').textContent = turmaData.nome_turma;
        document.getElementById('lblProfessor').textContent = turmaData.professor || 'Sem Professor';
        document.getElementById('lblData').textContent = formatDateBr(aulaData.data_aula);
        document.getElementById('lblHorario').textContent = aulaData.horario || '--:--';

        // 3. Carregar Alunos Matriculados
        const inscricoesRef = collection(db, 'igrejas', 'iebi', 'inscricoes');
        const qInsc = query(inscricoesRef, where('id_turma', '==', turmaId));
        const inscSnap = await getDocs(qInsc);
        
        inscSnap.forEach(d => {
            inscritosArr.push({ id: d.id, ...d.data() });
        });

        // Ordenar alfabeticamente
        inscritosArr.sort((a, b) => a.nome_pessoa_cache.localeCompare(b.nome_pessoa_cache));

        listaAlunos.innerHTML = '';
        countTotal.textContent = inscritosArr.length;

        if (inscritosArr.length === 0) {
            listaAlunos.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-muted);">Nenhum aluno matriculado nesta turma.</div>`;
            return;
        }

        const presentesSet = new Set(aulaData.presentes || []);
        const isNovaChamada = aulaData.status === 'Agendada';

        inscritosArr.forEach(aluno => {
            // Se for uma aula nova, marca todos como presente. Se for uma aula já realizada, respeita o banco de dados.
            const isPresente = isNovaChamada ? true : presentesSet.has(aluno.id);
            const labelStr = isPresente ? 'Presente' : 'Falta';
            const labelColor = isPresente ? '#27AE60' : '#E74C3C';

            const card = document.createElement('div');
            card.className = 'student-card';
            card.innerHTML = `
                <div class="student-info">
                    <div class="student-name">${aluno.nome_pessoa_cache}</div>
                    <div class="student-meta">${aluno.contato_cache || 'Sem Contato'}</div>
                </div>
                <div class="toggle-container">
                    <span class="toggle-label" id="lbl_${aluno.id}" style="color: ${labelColor};">${labelStr}</span>
                    <label class="switch">
                        <input type="checkbox" class="chamada-checkbox" value="${aluno.id}" ${isPresente ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
            `;
            listaAlunos.appendChild(card);

            // Listener para mudar o texto e cor do label instantaneamente
            const cb = card.querySelector('.chamada-checkbox');
            const lbl = card.querySelector('.toggle-label');
            cb.addEventListener('change', (e) => {
                if(e.target.checked) {
                    lbl.textContent = 'Presente';
                    lbl.style.color = '#27AE60';
                } else {
                    lbl.textContent = 'Falta';
                    lbl.style.color = '#E74C3C';
                }
                updateCounters();
            });
        });

        updateCounters();

        // 4. Salvar Chamada
        document.getElementById('btnSalvarDiario').addEventListener('click', async () => {
            const btn = document.getElementById('btnSalvarDiario');
            const originalHtml = btn.innerHTML;
            btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Salvando...';
            btn.disabled = true;

            try {
                const presentes = [];
                document.querySelectorAll('.chamada-checkbox').forEach(cb => {
                    if(cb.checked) presentes.push(cb.value);
                });

                await updateDoc(aulaRef, {
                    presentes: presentes,
                    status: 'Realizada' // Atualiza o status para concluída
                });

                showAlertModal("Diário salvo com sucesso!", false);
                setTimeout(() => {
                    window.location.href = `aulas.html?id=${turmaId}`;
                }, 1500);

            } catch (err) {
                console.error("Erro ao salvar diário:", err);
                showAlertModal("Erro ao salvar. Tente novamente.");
                btn.innerHTML = originalHtml;
                btn.disabled = false;
            }
        });

    } catch (e) {
        console.error("Erro ao inicializar diário:", e);
        listaAlunos.innerHTML = `<div style="text-align:center; padding: 40px; color: #E74C3C;">Erro ao carregar dados.</div>`;
    }
});
