import { db, collection, addDoc, doc, updateDoc, serverTimestamp } from './firebase.js';
import { getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    const coursesGrid = document.getElementById('coursesGrid');
    const modal = document.getElementById('cursoModal');
    const form = document.getElementById('cursoForm');
    const modalTitle = document.getElementById('modalTitleText');
    const saveBtn = document.getElementById('saveCursoBtn');
    
    // Form Inputs
    const inputNome = document.getElementById('cursoNome');
    const inputDescricao = document.getElementById('cursoDescricao');
    const inputCargaHoraria = document.getElementById('cursoCargaHoraria');
    const inputStatus = document.getElementById('cursoStatus');
    const inputPublico = document.getElementById('cursoPublico');
    const inputPreRequisito = document.getElementById('cursoPreRequisito');

    let cursoEmEdicaoId = null;
    let listaCursos = [];

    // Modal Handlers
    function openModal(editData = null) {
        // Atualizar lista de pré-requisitos disponíveis (apenas ativos, excluindo o atual, ordem alfabética)
        inputPreRequisito.innerHTML = '<option value="">Nenhum</option>';
        
        const cursosParaPreRequisito = listaCursos.filter(c => c.status === 'Ativo' && (!editData || c.id !== editData.id));
        
        // Ordena por ordem alfabética
        cursosParaPreRequisito.sort((a, b) => a.nome.localeCompare(b.nome));
        
        cursosParaPreRequisito.forEach(c => {
            const option = document.createElement('option');
            option.value = c.id;
            option.textContent = c.nome;
            inputPreRequisito.appendChild(option);
        });

        if (editData) {
            cursoEmEdicaoId = editData.id;
            modalTitle.textContent = 'Editar Curso';
            inputNome.value = editData.nome;
            inputDescricao.value = editData.descricao;
            inputCargaHoraria.value = editData.carga_horaria;
            inputStatus.value = editData.status;
            inputPublico.value = editData.publico || 'Aberto a Todos';
            inputPreRequisito.value = editData.pre_requisito || '';
        } else {
            cursoEmEdicaoId = null;
            form.reset();
            modalTitle.textContent = 'Cadastrar Novo Curso';
            inputStatus.value = 'Ativo';
            inputPublico.value = 'Aberto a Todos';
        }
        modal.classList.add('active');
    }

    function closeModal() {
        modal.classList.remove('active');
        setTimeout(() => form.reset(), 300);
    }

    document.getElementById('btnNovoCurso').addEventListener('click', () => openModal());
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);

    // Carregar Cursos
    async function carregarCursos() {
        coursesGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
              <i class="ph ph-spinner ph-spin" style="font-size: 2rem;"></i>
              <p style="margin-top: 12px;">Carregando cursos...</p>
            </div>
        `;
        
        listaCursos = [];
        try {
            const cursosRef = collection(db, 'igrejas', 'iebi', 'cursos');
            const querySnapshot = await getDocs(cursosRef);
            
            querySnapshot.forEach((doc) => {
                listaCursos.push({ id: doc.id, ...doc.data() });
            });
            
            renderizarCursos();
        } catch (error) {
            console.error("Erro ao carregar cursos:", error);
            coursesGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #E74C3C;">
                  <i class="ph ph-warning-circle" style="font-size: 2rem;"></i>
                  <p style="margin-top: 12px;">Erro ao carregar os cursos.</p>
                </div>
            `;
        }
    }

    function renderizarCursos() {
        if (listaCursos.length === 0) {
            coursesGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px 40px; background: var(--card-bg); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
                  <i class="ph ph-books" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 16px;"></i>
                  <h3 style="color: var(--text-main); font-weight: 600; font-size: 1.1rem; margin-bottom: 8px;">Nenhum curso cadastrado</h3>
                  <p style="color: var(--text-muted); font-size: 0.9rem;">Clique em "Novo Curso" para criar o seu primeiro registro na grade curricular.</p>
                </div>
            `;
            return;
        }

        coursesGrid.innerHTML = '';
        
        listaCursos.forEach(curso => {
            const card = document.createElement('div');
            card.className = 'course-card';
            
            const statusClass = curso.status === 'Ativo' ? 'ativo' : 'inativo';
            
            // Buscar nome do curso pré-requisito se existir
            const preReq = curso.pre_requisito ? listaCursos.find(c => c.id === curso.pre_requisito) : null;
            const preReqNome = preReq ? preReq.nome : '';
            
            card.innerHTML = `
                <span class="course-status ${statusClass}">${curso.status}</span>
                <h3 class="course-title">${curso.nome}</h3>
                <p class="course-desc">${curso.descricao}</p>
                
                <div class="course-meta" style="flex-wrap: wrap; row-gap: 8px;">
                    <span title="Carga Horária"><i class="ph ph-clock"></i> ${curso.carga_horaria}h</span>
                    <span title="Público-Alvo"><i class="ph ph-users"></i> ${curso.publico || 'Aberto a Todos'}</span>
                    ${preReqNome ? `<span title="Pré-requisito"><i class="ph ph-link"></i> Req: ${preReqNome}</span>` : ''}
                </div>
                
                <div class="course-actions">
                    <button class="btn btn-secondary btn-editar" data-id="${curso.id}" style="font-size: 0.8rem; padding: 6px; display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <i class="ph ph-pencil-simple"></i> Editar
                    </button>
                </div>
            `;
            
            coursesGrid.appendChild(card);
        });

        // Add event listeners for edit buttons
        document.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const curso = listaCursos.find(c => c.id === id);
                if(curso) openModal(curso);
            });
        });
    }

    // Salvar Curso
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Salvando...';
        saveBtn.disabled = true;

        const cursoData = {
            nome: inputNome.value,
            descricao: inputDescricao.value,
            carga_horaria: parseInt(inputCargaHoraria.value),
            status: inputStatus.value,
            publico: inputPublico.value,
            pre_requisito: inputPreRequisito.value,
            atualizado_em: serverTimestamp()
        };

        try {
            if (cursoEmEdicaoId) {
                const docRef = doc(db, 'igrejas', 'iebi', 'cursos', cursoEmEdicaoId);
                await updateDoc(docRef, cursoData);
            } else {
                cursoData.criado_em = serverTimestamp();
                const cursosRef = collection(db, 'igrejas', 'iebi', 'cursos');
                await addDoc(cursosRef, cursoData);
            }

            closeModal();
            await carregarCursos(); // Reload
        } catch (error) {
            console.error("Erro ao salvar curso:", error);
            alert("Erro ao salvar. Verifique o console.");
        } finally {
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }
    });

    // Iniciar
    carregarCursos();
});
