import { db, doc, collection, updateDoc } from './firebase.js';
import { getDoc, getDocs, query, where, writeBatch, arrayUnion } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    function showAlertModal(message, isError = true) {
        const modal = document.getElementById('alertModal');
        const titleEl = document.getElementById('alertModalTitle');
        const msgEl = document.getElementById('alertModalMessage');
        const iconEl = document.getElementById('alertModalIcon');
        if(modal && titleEl && msgEl) {
            msgEl.textContent = message;
            titleEl.textContent = isError ? "Atenção!" : "Sucesso!";
            iconEl.style.color = isError ? "#E74C3C" : "var(--primary)";
            iconEl.innerHTML = isError ? '<i class="ph ph-warning-circle"></i>' : '<i class="ph ph-check-circle"></i>';
            modal.classList.add('active');
        } else {
            alert(message);
        }
    }

    document.getElementById('btnOkAlert')?.addEventListener('click', () => {
        document.getElementById('alertModal').classList.remove('active');
    });

    const urlParams = new URLSearchParams(window.location.search);
    const turmaId = urlParams.get('id');

    if (!turmaId) {
        showAlertModal("Turma não identificada.");
        return;
    }

    document.getElementById('linkVoltar').href = `inscricoes.html?id=${turmaId}`;

    let turmaData = null;
    let inscritos = [];

    const listaAlunos = document.getElementById('listaAlunos');

    function updateSelectColor(selectObj) {
        selectObj.className = 'select-status';
        if(selectObj.value === 'Aprovado') selectObj.classList.add('aprovado');
        else if(selectObj.value === 'Desistente') selectObj.classList.add('desistente');
        else selectObj.classList.add('reprovado');
    }

    try {
        // Carregar Turma
        const turmaRef = doc(db, 'igrejas', 'iebi', 'turmas', turmaId);
        const turmaSnap = await getDoc(turmaRef);
        if(!turmaSnap.exists()){
            showAlertModal("Turma não encontrada.");
            return;
        }
        turmaData = turmaSnap.data();
        if(turmaData.status === 'Encerrada') {
            showAlertModal("Esta turma já foi encerrada.");
            setTimeout(() => { window.location.href = `inscricoes.html?id=${turmaId}`; }, 2000);
            return;
        }
        document.getElementById('lblTurma').textContent = `Fechamento: ${turmaData.nome_turma}`;

        // Checar Curso Base e Trilha
        const cursoRef = doc(db, 'igrejas', 'iebi', 'cursos', turmaData.id_curso);
        const cursoSnap = await getDoc(cursoRef);
        let proximoCursoId = null;
        let turmasDestino = [];
        
        if(cursoSnap.exists()) {
            const cData = cursoSnap.data();
            proximoCursoId = cData.proximo_curso_id;
            
            if(proximoCursoId) {
                const qDestino = query(collection(db, 'igrejas', 'iebi', 'turmas'), 
                    where('id_curso', '==', proximoCursoId),
                    where('status', '==', 'Inscrições Abertas')
                );
                const destSnap = await getDocs(qDestino);
                destSnap.forEach(d => turmasDestino.push({ id: d.id, ...d.data() }));
                
                const selectDest = document.getElementById('transferTurmaSelect');
                turmasDestino.forEach(td => {
                    selectDest.innerHTML += `<option value="${td.id}">${td.nome_turma}</option>`;
                });
            }
        }

        // Buscar Aulas Realizadas para calcular Frequência
        const aulasRef = collection(db, 'igrejas', 'iebi', 'aulas');
        const qAulas = query(aulasRef, where('turmaId', '==', turmaId));
        const aulasSnap = await getDocs(qAulas);
        let aulasRealizadas = [];
        aulasSnap.forEach(d => {
            const ad = d.data();
            if(ad.status === 'Realizada') aulasRealizadas.push(ad);
        });
        const totalAulas = aulasRealizadas.length;

        // Buscar Inscrições
        const inscricoesRef = collection(db, 'igrejas', 'iebi', 'inscricoes');
        const qInsc = query(inscricoesRef, where('id_turma', '==', turmaId));
        const inscSnap = await getDocs(qInsc);
        
        inscSnap.forEach(d => {
            inscritos.push({ id: d.id, ...d.data() });
        });

        // Order A-Z
        inscritos.sort((a,b) => (a.nome_pessoa_cache||'').localeCompare(b.nome_pessoa_cache||''));

        listaAlunos.innerHTML = '';
        if(inscritos.length === 0){
            listaAlunos.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 40px;">Não há alunos nesta turma.</td></tr>`;
        }

        inscritos.forEach(aluno => {
            let presencas = 0;
            aulasRealizadas.forEach(aula => {
                if (aula.presentes && aula.presentes.includes(aluno.id)) presencas++;
            });
            
            let pct = 0;
            if(totalAulas > 0) pct = Math.round((presencas / totalAulas) * 100);
            
            let freqStr = `${pct}% (${presencas}/${totalAulas})`;
            let freqColor = pct >= 75 ? '#27AE60' : '#E74C3C';
            
            let sugStatus = pct >= 75 ? 'Aprovado' : 'Reprovado por Falta';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight: 500;">${aluno.nome_pessoa_cache}</td>
                <td style="color: ${freqColor}; font-weight: bold;">${freqStr}</td>
                <td style="color: var(--text-muted);">${sugStatus}</td>
                <td>
                    <select class="select-status" data-id="${aluno.id}" data-pessoa="${aluno.id_pessoa}">
                        <option value="Aprovado" ${sugStatus==='Aprovado'?'selected':''}>Aprovado</option>
                        <option value="Reprovado por Falta" ${sugStatus==='Reprovado por Falta'?'selected':''}>Reprovado por Falta</option>
                        <option value="Reprovado por Nota">Reprovado por Nota</option>
                        <option value="Desistente">Desistente</option>
                    </select>
                </td>
            `;
            listaAlunos.appendChild(tr);

            const sel = tr.querySelector('select');
            updateSelectColor(sel);
            sel.addEventListener('change', () => updateSelectColor(sel));
        });

        // Lógica de Confirmação
        const confirmModal = document.getElementById('confirmModal');
        
        document.getElementById('btnSalvarFechamento').addEventListener('click', () => {
            confirmModal.classList.add('active');
        });

        document.getElementById('btnCancelConfirm').addEventListener('click', () => {
            confirmModal.classList.remove('active');
        });

        document.getElementById('btnConfirmAction').addEventListener('click', async () => {
            confirmModal.classList.remove('active');
            
            if(turmasDestino.length > 0) {
                document.getElementById('transferModal').classList.add('active');
            } else {
                await executeBatch(null);
            }
        });

        document.getElementById('btnConfirmTransfer').addEventListener('click', async () => {
            document.getElementById('transferModal').classList.remove('active');
            const destId = document.getElementById('transferTurmaSelect').value;
            await executeBatch(destId);
        });

        async function executeBatch(destinoTurmaId) {
            const btn = document.getElementById('btnSalvarFechamento');
            const originalHtml = btn.innerHTML;
            btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Processando Fechamento...';
            btn.disabled = true;

            try {
                const batch = writeBatch(db);
                const dataConclusao = new Date().toISOString().split('T')[0];
                
                // 1. Atualizar cada inscrição com o status final
                document.querySelectorAll('.select-status').forEach(sel => {
                    const inscId = sel.getAttribute('data-id');
                    const pessoaId = sel.getAttribute('data-pessoa');
                    const statusFinal = sel.value;

                    const refInsc = doc(db, 'igrejas', 'iebi', 'inscricoes', inscId);
                    batch.update(refInsc, { status_final: statusFinal });

                    // 2. Se aprovado, atualizar histórico e transferir
                    if(statusFinal === 'Aprovado' && pessoaId) {
                        const refPessoa = doc(db, 'igrejas', 'iebi', 'pessoas', pessoaId);
                        batch.update(refPessoa, {
                            historico_cursos: arrayUnion({
                                id_turma: turmaId,
                                id_curso: turmaData.id_curso,
                                nome_curso_cache: turmaData.nome_curso_cache,
                                nome_turma: turmaData.nome_turma,
                                data_conclusao: dataConclusao
                            })
                        });
                        
                        if(destinoTurmaId) {
                            const alunoData = inscritos.find(i => i.id === inscId);
                            if(alunoData) {
                                const refNovaInsc = doc(collection(db, 'igrejas', 'iebi', 'inscricoes'));
                                batch.set(refNovaInsc, {
                                    id_turma: destinoTurmaId,
                                    id_pessoa: pessoaId,
                                    nome_pessoa_cache: alunoData.nome_pessoa_cache,
                                    contato_cache: alunoData.contato_cache || '',
                                    data_inscricao: new Date()
                                });
                            }
                        }
                    }
                });

                // 3. Encerrar Turma
                batch.update(turmaRef, { status: 'Encerrada', data_fechamento: dataConclusao });

                await batch.commit();

                showAlertModal("Turma fechada com sucesso! Históricos atualizados.", false);
                setTimeout(() => {
                    window.location.href = `inscricoes.html?id=${turmaId}`;
                }, 2000);

            } catch (err) {
                console.error("Erro no batch:", err);
                showAlertModal("Falha ao salvar o fechamento. Tente novamente.");
                btn.innerHTML = originalHtml;
                btn.disabled = false;
            }
        }

    } catch (e) {
        console.error("Erro geral:", e);
        showAlertModal("Erro de carregamento.");
    }
});
