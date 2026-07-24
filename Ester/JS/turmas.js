import { db, collection, addDoc, doc, updateDoc, serverTimestamp } from './firebase.js';
import { getDocs, query, where, limit, deleteDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    const turmasGrid = document.getElementById('turmasGrid');
    const modal = document.getElementById('turmaModal');
    const form = document.getElementById('turmaForm');
    const modalTitle = document.getElementById('modalTitleText');
    const saveBtn = document.getElementById('saveTurmaBtn');
    
    // Form Inputs
    const inputCurso = document.getElementById('turmaCurso');
    const inputNome = document.getElementById('turmaNome');
    const inputStatus = document.getElementById('turmaStatus');
    const inputProfessor = document.getElementById('turmaProfessor');
    const inputDataInicio = document.getElementById('turmaDataInicio');
    const inputDataFim = document.getElementById('turmaDataFim');
    const inputHorario = document.getElementById('turmaHorario');
    const inputVagas = document.getElementById('turmaVagas');

    let turmaEmEdicaoId = null;
    let listaTurmas = [];
    let listaCursosAtivos = [];

    // Autocomplete do Professor
    const professorDropdown = document.getElementById('professorAutocomplete');
    let timeoutId = null;

    inputProfessor.addEventListener('input', (e) => {
        const val = e.target.value.toUpperCase();
        clearTimeout(timeoutId);
        
        if (val.length < 3) {
            professorDropdown.style.display = 'none';
            return;
        }

        timeoutId = setTimeout(async () => {
            try {
                const q = query(
                    collection(db, 'igrejas', 'iebi', 'pessoas'),
                    where('nome', '>=', val),
                    where('nome', '<=', val + '\uf8ff'),
                    limit(5)
                );
                
                const snap = await getDocs(q);
                professorDropdown.innerHTML = '';
                
                if(snap.empty) {
                    professorDropdown.innerHTML = '<div style="padding:10px; color:gray; font-size: 0.85rem; text-align: center;">Nenhum cadastro encontrado</div>';
                    professorDropdown.style.display = 'block';
                    return;
                }

                snap.forEach(doc => {
                    const data = doc.data();
                    const div = document.createElement('div');
                    div.className = 'autocomplete-item';
                    div.textContent = data.nome;
                    div.onclick = () => {
                        inputProfessor.value = data.nome;
                        professorDropdown.style.display = 'none';
                    };
                    professorDropdown.appendChild(div);
                });
                
                professorDropdown.style.display = 'block';
            } catch(err) {
                console.error("Erro no autocomplete:", err);
            }
        }, 400); // 400ms debounce
    });

    // Fechar dropdown ao clicar fora
    document.addEventListener('click', (e) => {
        if(e.target !== inputProfessor && e.target !== professorDropdown) {
            if(professorDropdown) professorDropdown.style.display = 'none';
        }
    });

    // Carregar lista de cursos ativos para o dropdown
    async function carregarCursosBase() {
        inputCurso.innerHTML = '<option value="">Carregando...</option>';
        try {
            const cursosRef = collection(db, 'igrejas', 'iebi', 'cursos');
            const snap = await getDocs(cursosRef);
            listaCursosAtivos = [];
            snap.forEach(d => {
                const c = d.data();
                if (c.status === 'Ativo') {
                    listaCursosAtivos.push({ id: d.id, nome: c.nome });
                }
            });
            
            listaCursosAtivos.sort((a,b) => a.nome.localeCompare(b.nome));
            
            inputCurso.innerHTML = '<option value="" disabled selected>Selecione o curso base</option>';
            listaCursosAtivos.forEach(c => {
                inputCurso.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
            });
        } catch (e) {
            console.error("Erro ao carregar cursos base:", e);
            inputCurso.innerHTML = '<option value="">Erro ao carregar cursos</option>';
        }
    }

    function openModal(editData = null) {
        if (editData) {
            turmaEmEdicaoId = editData.id;
            modalTitle.textContent = 'Editar Turma';
            inputCurso.value = editData.id_curso;
            inputNome.value = editData.nome_turma;
            inputStatus.value = editData.status;
            inputProfessor.value = editData.professor;
            inputDataInicio.value = editData.data_inicio;
            inputDataFim.value = editData.data_fim;
            inputHorario.value = editData.horario;
            inputVagas.value = editData.vagas_totais;
            
            // Set checkboxes
            document.querySelectorAll('input[name="turmaDias"]').forEach(cb => cb.checked = false);
            if(editData.dias_semana) {
                editData.dias_semana.forEach(d => {
                    const cb = document.querySelector(`input[name="turmaDias"][value="${d}"]`);
                    if(cb) cb.checked = true;
                });
            }
        } else {
            turmaEmEdicaoId = null;
            form.reset();
            document.querySelectorAll('input[name="turmaDias"]').forEach(cb => cb.checked = false);
            modalTitle.textContent = 'Abrir Nova Turma';
            inputStatus.value = 'Inscrições Abertas';
        }
        modal.classList.add('active');
    }

    function closeModal() {
        modal.classList.remove('active');
        setTimeout(() => form.reset(), 300);
    }

    document.getElementById('btnNovaTurma').addEventListener('click', () => openModal());
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);

    async function carregarTurmas() {
        turmasGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
              <i class="ph ph-spinner ph-spin" style="font-size: 2rem;"></i>
              <p style="margin-top: 12px;">Carregando turmas...</p>
            </div>
        `;
        
        listaTurmas = [];
        try {
            const ref = collection(db, 'igrejas', 'iebi', 'turmas');
            const snap = await getDocs(ref);
            
            snap.forEach((doc) => {
                listaTurmas.push({ id: doc.id, ...doc.data() });
            });
            
            renderizarTurmas();
        } catch (error) {
            console.error("Erro ao carregar turmas:", error);
            turmasGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #E74C3C;">
                  <i class="ph ph-warning-circle" style="font-size: 2rem;"></i>
                  <p style="margin-top: 12px;">Erro ao carregar as turmas.</p>
                </div>
            `;
        }
    }

    function getStatusClass(status) {
        if(status === 'Inscrições Abertas') return 'badge-abertas';
        if(status === 'Em Andamento') return 'badge-andamento';
        if(status === 'Concluída') return 'badge-concluida';
        return 'badge-cancelada';
    }

    function formatDateBr(dateString) {
        if(!dateString) return '';
        const [y, m, d] = dateString.split('-');
        return `${d}/${m}/${y}`;
    }

    function renderizarTurmas() {
        if (listaTurmas.length === 0) {
            turmasGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px 40px; background: var(--card-bg); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
                  <i class="ph ph-users-three" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 16px;"></i>
                  <h3 style="color: var(--text-main); font-weight: 600; font-size: 1.1rem; margin-bottom: 8px;">Nenhuma turma encontrada</h3>
                  <p style="color: var(--text-muted); font-size: 0.9rem;">Abra a primeira turma vinculando-a a um curso ativo no catálogo.</p>
                </div>
            `;
            return;
        }

        turmasGrid.innerHTML = '';
        
        // Sort by start date desc
        listaTurmas.sort((a,b) => new Date(b.data_inicio) - new Date(a.data_inicio));

        listaTurmas.forEach(turma => {
            const card = document.createElement('div');
            card.className = 'turma-card';
            
            const badgeClass = getStatusClass(turma.status);
            
            // Calculo da barra de vagas (Fase atual tem inscricoes zeradas)
            const vagasOcupadas = turma.vagas_ocupadas || 0;
            const vagasTotais = parseInt(turma.vagas_totais) || 0;
            const ocupacao = vagasTotais > 0 ? (vagasOcupadas / vagasTotais) * 100 : 0;
            const barraCor = ocupacao >= 100 ? '#E74C3C' : 'var(--primary)';
            
            card.innerHTML = `
                <span class="turma-badge ${badgeClass}">${turma.status}</span>
                <p class="turma-curso">${turma.nome_curso_cache || 'Curso'}</p>
                <h3 class="turma-title">${turma.nome_turma}</h3>
                
                <div class="turma-meta">
                    <div><i class="ph ph-chalkboard-teacher"></i> ${turma.professor}</div>
                    <div><i class="ph ph-calendar"></i> ${formatDateBr(turma.data_inicio)} a ${formatDateBr(turma.data_fim)}</div>
                    <div><i class="ph ph-clock"></i> ${turma.horario}</div>
                </div>
                
                <div class="turma-vagas">
                    <div class="vagas-header">
                        <span>Ocupação das Vagas</span>
                        <span>${vagasOcupadas}/${vagasTotais}</span>
                    </div>
                    <div class="vagas-bar">
                        <div class="vagas-fill" style="width: ${Math.min(ocupacao, 100)}%; background: ${barraCor};"></div>
                    </div>
                </div>
                
                <div class="turma-actions" style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button class="btn btn-secondary btn-editar" style="flex: 1; padding: 10px 0;" data-id="${turma.id}" title="Editar">
                        <i class="ph ph-pencil-simple"></i> Editar
                    </button>
                    <button class="btn btn-secondary" style="flex: 1; padding: 10px 0;" onclick="window.location.href='aulas.html?id=${turma.id}'" title="Cronograma e Diário">
                        <i class="ph ph-calendar-check"></i> Diário
                    </button>
                    <button class="btn btn-primary" style="flex: 1; padding: 10px 0; min-width: 100%;" onclick="window.location.href='inscricoes.html?id=${turma.id}'">
                        <i class="ph ph-users"></i> Ver Inscrições
                    </button>
                    ${turma.status === 'Em Andamento' ? `
                    <button class="btn" style="flex: 1; padding: 10px 0; min-width: 100%; background: #F39C12; color: #fff; border: none; font-weight: 600;" onclick="window.location.href='fechamento.html?id=${turma.id}'">
                        <i class="ph ph-graduation-cap"></i> Encerrar Turma
                    </button>
                    ` : ''}
                </div>
            `;
            
            turmasGrid.appendChild(card);
        });

        document.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const t = listaTurmas.find(x => x.id === id);
                if(t) openModal(t);
            });
        });
    }

    async function gerarCronogramaAulas(idTurma, turma) {
        const aulasRef = collection(db, 'igrejas', 'iebi', 'aulas');
        
        // Buscar todas as aulas existentes desta turma
        const q = query(aulasRef, where('turmaId', '==', idTurma));
        const snap = await getDocs(q);
        
        let aulasExistentes = [];
        snap.forEach(d => {
            aulasExistentes.push({ id: d.id, ...d.data() });
        });

        // Determinar quais datas deveriam existir no novo cronograma
        const startStr = turma.data_inicio;
        const endStr = turma.data_fim;
        if (startStr > endStr) return; // Datas inválidas

        let currentDate = new Date(startStr + 'T12:00:00');
        let endDateObj = new Date(endStr + 'T12:00:00');
        
        let datasDesejadas = new Set();
        
        while (currentDate <= endDateObj) {
            let dayStr = currentDate.getDay().toString();
            if (turma.dias_semana && turma.dias_semana.includes(dayStr)) {
                datasDesejadas.add(currentDate.toISOString().split('T')[0]);
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        let promises = [];

        // 1. Apagar aulas antigas que NÃO estão nas datasDesejadas e AINDA estão "Agendada"
        aulasExistentes.forEach(aula => {
            if (!datasDesejadas.has(aula.data_aula)) {
                if (aula.status === 'Agendada') {
                    promises.push(deleteDoc(doc(db, 'igrejas', 'iebi', 'aulas', aula.id)));
                }
            }
        });

        // 2. Criar aulas para as datasDesejadas que AINDA NÃO EXISTEM
        const datasExistentesSet = new Set(aulasExistentes.map(a => a.data_aula));
        
        datasDesejadas.forEach(dataStr => {
            if (!datasExistentesSet.has(dataStr)) {
                promises.push(addDoc(aulasRef, {
                    turmaId: idTurma,
                    nome_turma: turma.nome_turma,
                    data_aula: dataStr,
                    horario: turma.horario,
                    status: 'Agendada',
                    presentes: [],
                    title: 'Aula: ' + turma.nome_turma,
                    date: dataStr,
                    color: '#27AE60',
                    tipo: 'Aula'
                }));
            }
        });

        await Promise.all(promises);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Salvando...';
        saveBtn.disabled = true;
        
        const opt = inputCurso.options[inputCurso.selectedIndex];
        const nomeCursoCache = opt ? opt.textContent : '';
        
        const diasMarcados = Array.from(document.querySelectorAll('input[name="turmaDias"]:checked')).map(cb => cb.value);
        if(diasMarcados.length === 0) {
            alert("Selecione pelo menos um dia da semana para as aulas.");
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
            return;
        }

        const turmaData = {
            id_curso: inputCurso.value,
            nome_curso_cache: nomeCursoCache,
            nome_turma: inputNome.value,
            status: inputStatus.value,
            professor: inputProfessor.value,
            data_inicio: inputDataInicio.value,
            data_fim: inputDataFim.value,
            horario: inputHorario.value,
            dias_semana: diasMarcados,
            vagas_totais: parseInt(inputVagas.value),
            atualizado_em: serverTimestamp()
        };

        try {
            if (turmaEmEdicaoId) {
                const docRef = doc(db, 'igrejas', 'iebi', 'turmas', turmaEmEdicaoId);
                await updateDoc(docRef, turmaData);
                await gerarCronogramaAulas(turmaEmEdicaoId, turmaData);
            } else {
                turmaData.criado_em = serverTimestamp();
                turmaData.vagas_ocupadas = 0; // Inicializa com 0 inscrições
                const ref = collection(db, 'igrejas', 'iebi', 'turmas');
                const docRef = await addDoc(ref, turmaData);
                await gerarCronogramaAulas(docRef.id, turmaData);
            }

            closeModal();
            await carregarTurmas(); // Reload
        } catch (error) {
            console.error("Erro ao salvar turma:", error);
            alert("Erro ao salvar. Verifique o console.");
        } finally {
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }
    });

    // Iniciar
    carregarCursosBase().then(() => {
        carregarTurmas();
    });
});
