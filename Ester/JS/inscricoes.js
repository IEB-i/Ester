import { db, collection, addDoc, doc, updateDoc, serverTimestamp } from './firebase.js';
import { deleteDoc, getDoc, getDocs, query, where, limit } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    function showAlertModal(message, isError = true) {
        const modal = document.getElementById('alertModal');
        const titleEl = document.getElementById('alertModalTitle');
        const msgEl = document.getElementById('alertModalMessage');
        const iconEl = document.getElementById('alertModalIcon');
        if(modal && titleEl && msgEl && iconEl) {
            msgEl.textContent = message;
            if(isError) {
                titleEl.textContent = "Atenção!";
                iconEl.style.color = "#E74C3C";
                iconEl.innerHTML = '<i class="ph ph-warning-circle"></i>';
            } else {
                titleEl.textContent = "Sucesso!";
                iconEl.style.color = "var(--primary)";
                iconEl.innerHTML = '<i class="ph ph-check-circle"></i>';
            }
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

    let turmaData = null;
    let inscritosAtuais = 0;

    // Elementos da Turma
    const badgeStatus = document.getElementById('badgeStatus');
    const turmaNomeTitle = document.getElementById('turmaNomeTitle');
    const cursoNomeTitle = document.getElementById('cursoNomeTitle');
    const lblProfessor = document.getElementById('lblProfessor');
    const lblDatas = document.getElementById('lblDatas');
    const lblHorario = document.getElementById('lblHorario');
    const lblVagas = document.getElementById('lblVagas');
    const vagasFill = document.getElementById('vagasFill');
    
    // Lista e Busca
    const listaInscritos = document.getElementById('listaInscritos');
    const buscaAluno = document.getElementById('buscaAluno');
    const alunoAutocomplete = document.getElementById('alunoAutocomplete');
    const selectedAlunoId = document.getElementById('selectedAlunoId');
    const selectedAlunoNome = document.getElementById('selectedAlunoNome');
    const selectedAlunoContato = document.getElementById('selectedAlunoContato');
    const btnMatricular = document.getElementById('btnMatricular');

    // Funções utilitárias
    function formatDateBr(dateString) {
        if(!dateString) return '';
        const [y, m, d] = dateString.split('-');
        return `${d}/${m}/${y}`;
    }

    function formatDateFromTimestamp(ts) {
        if(!ts) return '';
        const d = ts.toDate();
        return d.toLocaleDateString('pt-BR');
    }

    function getStatusColor(status) {
        if(status === 'Inscrições Abertas') return { bg: 'rgba(39, 174, 96, 0.1)', color: 'var(--primary)' };
        if(status === 'Em Andamento') return { bg: 'rgba(243, 156, 18, 0.1)', color: '#F39C12' };
        if(status === 'Concluída') return { bg: 'rgba(41, 128, 185, 0.1)', color: '#2980B9' };
        return { bg: 'rgba(231, 76, 60, 0.1)', color: '#E74C3C' };
    }

    async function carregarDadosTurma() {
        try {
            const docRef = doc(db, 'igrejas', 'iebi', 'turmas', turmaId);
            const snap = await getDoc(docRef);
            
            if(!snap.exists()) {
                showAlertModal("Turma não encontrada.");
                setTimeout(() => { window.location.href = "turmas.html"; }, 2000);
                return;
            }

            turmaData = snap.data();
            
            if(turmaData.status === 'Inscrições Abertas') badgeStatus.style.background = 'var(--primary)';
        else if(turmaData.status === 'Em Andamento') badgeStatus.style.background = '#F39C12';
        else if(turmaData.status === 'Encerrada') badgeStatus.style.background = '#7F8C8D';
        else badgeStatus.style.background = 'var(--text-muted)';
        badgeStatus.style.color = '#fff';

        const addStudentContainer = document.getElementById('addStudentContainer');
        
        if (turmaData.status === 'Encerrada') {
            if (addStudentContainer) addStudentContainer.style.display = 'none';
        }
            
            badgeStatus.textContent = turmaData.status;
            
            turmaNomeTitle.textContent = turmaData.nome_turma;
            cursoNomeTitle.textContent = turmaData.nome_curso_cache;
            lblProfessor.textContent = turmaData.professor || 'Não definido';
            lblDatas.textContent = `${formatDateBr(turmaData.data_inicio)} a ${formatDateBr(turmaData.data_fim)}`;
            lblHorario.textContent = turmaData.horario || 'Não definido';

            // Verificamos quantas inscrições existem de fato
            const inscricoesRef = collection(db, 'igrejas', 'iebi', 'inscricoes');
            const qInsc = query(inscricoesRef, where('id_turma', '==', turmaId));
            const inscSnap = await getDocs(qInsc);
            
            inscritosAtuais = inscSnap.size;
            
            // Garantir que a turma tenha a contagem correta sincronizada
            if (turmaData.vagas_ocupadas !== inscritosAtuais) {
                await updateDoc(docRef, { vagas_ocupadas: inscritosAtuais });
                turmaData.vagas_ocupadas = inscritosAtuais;
            }

            const vagasTotais = parseInt(turmaData.vagas_totais) || 0;
            lblVagas.textContent = `${inscritosAtuais}/${vagasTotais}`;
            
            const ocupacao = vagasTotais > 0 ? (inscritosAtuais / vagasTotais) * 100 : 0;
            vagasFill.style.width = `${Math.min(ocupacao, 100)}%`;
            vagasFill.style.backgroundColor = ocupacao >= 100 ? '#E74C3C' : 'var(--primary)';
            
            // Renderizar Lista
            listaInscritos.innerHTML = '';
            
            if(inscSnap.empty) {
                listaInscritos.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px; color: var(--text-muted);">Nenhum aluno matriculado nesta turma ainda.</td></tr>';
            } else {
                // Converter para array para podermos ordenar
                let docsArr = [];
                inscSnap.forEach(d => {
                    docsArr.push({ id: d.id, ...d.data() });
                });
                
                // Ordenar por ordem alfabética de nome A-Z
                docsArr.sort((a,b) => {
                    let nomeA = (a.nome_pessoa_cache || '').toLowerCase();
                    let nomeB = (b.nome_pessoa_cache || '').toLowerCase();
                    if (nomeA < nomeB) return -1;
                    if (nomeA > nomeB) return 1;
                    return 0;
                });
                
                // --- Buscar Aulas para Frequência ---
                const aulasRef = collection(db, 'igrejas', 'iebi', 'aulas');
                const qAulas = query(aulasRef, where('turmaId', '==', turmaId));
                const aulasSnap = await getDocs(qAulas);
                let aulasRealizadas = [];
                aulasSnap.forEach(d => {
                    const adata = d.data();
                    if(adata.status === 'Realizada') aulasRealizadas.push(adata);
                });
                const totalAulas = aulasRealizadas.length;
                
                docsArr.forEach((i, index) => {
                    // Calcular presenças
                    let presencas = 0;
                    aulasRealizadas.forEach(aula => {
                        if (aula.presentes && aula.presentes.includes(i.id)) presencas++;
                    });
                    
                    let frequenciaStr = '--';
                    let frequenciaColor = 'var(--text-muted)';
                    if (totalAulas > 0) {
                        const pct = Math.round((presencas / totalAulas) * 100);
                        frequenciaStr = `${pct}% (${presencas}/${totalAulas})`;
                        if (pct < 75) frequenciaColor = '#E74C3C'; // Alerta de Falta
                        else frequenciaColor = '#27AE60';
                    }

                    let acoesHtml = '';
                    if (turmaData.status === 'Encerrada') {
                        let colorBadge = i.status_final === 'Aprovado' ? '#27AE60' : (i.status_final === 'Desistente' ? '#7F8C8D' : '#E74C3C');
                        acoesHtml = `<span style="display:inline-block; padding: 4px 8px; border-radius: 4px; background: ${colorBadge}22; color: ${colorBadge}; font-size:0.8rem; font-weight:bold; margin-right: 8px;">${i.status_final || 'Encerrado'}</span>`;
                        if (i.status_final === 'Aprovado') {
                            acoesHtml += `<button class="btn btn-primary btn-certificado" style="padding: 4px 12px; font-size: 0.8rem; display:inline-flex; align-items:center; gap: 4px;" onclick="window.open('certificado.html?inscricaoId=${i.id}', '_blank')"><i class="ph ph-certificate"></i> Certificado</button>`;
                        }
                    } else {
                        acoesHtml = `
                            <button class="btn-remover" data-id="${i.id}" data-nome="${i.nome_pessoa_cache}">
                                <i class="ph ph-trash"></i> Remover
                            </button>
                        `;
                    }

                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td style="color: var(--text-muted); font-weight: 600;">${index + 1}</td>
                        <td style="font-weight: 500; color: var(--text-main);">${i.nome_pessoa_cache}</td>
                        <td style="color: var(--text-muted);">${formatDateFromTimestamp(i.data_inscricao)}</td>
                        <td style="color: var(--text-muted);">${i.contato_cache || '-'}</td>
                        <td style="font-weight: bold; color: ${frequenciaColor};">${frequenciaStr}</td>
                        <td style="text-align: right;">${acoesHtml}</td>
                    `;
                    listaInscritos.appendChild(tr);
                });

                // Bind remove buttons
                document.querySelectorAll('.btn-remover').forEach(btn => {
                    btn.addEventListener('click', removerInscricao);
                });
            }

        } catch (e) {
            console.error("Erro ao carregar dados:", e);
            showAlertModal("Erro ao carregar turma.");
        }
    }

    // Autocomplete
    let timeoutId = null;
    buscaAluno.addEventListener('input', (e) => {
        const val = e.target.value.toUpperCase();
        clearTimeout(timeoutId);
        
        selectedAlunoId.value = '';
        btnMatricular.disabled = true;
        
        if (val.length < 3) {
            alunoAutocomplete.style.display = 'none';
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
                alunoAutocomplete.innerHTML = '';
                
                if(snap.empty) {
                    alunoAutocomplete.innerHTML = '<div style="padding:10px; color:gray; font-size: 0.85rem; text-align: center;">Nenhum aluno encontrado</div>';
                    alunoAutocomplete.style.display = 'block';
                    return;
                }

                snap.forEach(doc => {
                    const data = doc.data();
                    const div = document.createElement('div');
                    div.className = 'autocomplete-item';
                    div.innerHTML = `<strong>${data.nome}</strong><br><span style="font-size:0.8rem; color:gray;">${data.celular || 'Sem número'}</span>`;
                    div.onclick = () => {
                        buscaAluno.value = data.nome;
                        selectedAlunoId.value = doc.id;
                        selectedAlunoNome.value = data.nome;
                        selectedAlunoContato.value = data.celular || '';
                        alunoAutocomplete.style.display = 'none';
                        btnMatricular.disabled = false;
                    };
                    alunoAutocomplete.appendChild(div);
                });
                
                alunoAutocomplete.style.display = 'block';
            } catch(err) {
                console.error("Erro no autocomplete:", err);
            }
        }, 400);
    });

    document.addEventListener('click', (e) => {
        if(e.target !== buscaAluno && e.target !== alunoAutocomplete) {
            alunoAutocomplete.style.display = 'none';
        }
    });

    // Matricular
    btnMatricular.addEventListener('click', async () => {
        const pId = selectedAlunoId.value;
        const pNome = selectedAlunoNome.value;
        const pContato = selectedAlunoContato.value;
        
        if(!pId) return;
        
        const vagasTotais = parseInt(turmaData.vagas_totais) || 0;
        if (vagasTotais > 0 && inscritosAtuais >= vagasTotais) {
            if(!confirm("Atenção: A turma já atingiu a capacidade máxima de vagas! Deseja forçar a matrícula mesmo assim?")) {
                return;
            }
        }

        btnMatricular.disabled = true;
        btnMatricular.innerHTML = '<i class="ph ph-spinner ph-spin"></i>';

        try {
            // Verificar duplicidade
            const qDup = query(
                collection(db, 'igrejas', 'iebi', 'inscricoes'), 
                where('id_turma', '==', turmaId),
                where('id_pessoa', '==', pId)
            );
            const snapDup = await getDocs(qDup);
            if(!snapDup.empty) {
                showAlertModal("Este aluno já está matriculado nesta turma!");
                btnMatricular.disabled = false;
                btnMatricular.innerHTML = '<i class="ph ph-user-plus"></i> Matricular';
                return;
            }

            // Inserir
            await addDoc(collection(db, 'igrejas', 'iebi', 'inscricoes'), {
                id_turma: turmaId,
                id_pessoa: pId,
                nome_pessoa_cache: pNome,
                contato_cache: pContato,
                data_inscricao: serverTimestamp(),
                status: 'Ativa'
            });

            // Recarregar tudo
            buscaAluno.value = '';
            selectedAlunoId.value = '';
            await carregarDadosTurma();

        } catch (error) {
            console.error("Erro ao matricular:", error);
            showAlertModal("Erro ao realizar matrícula.");
        } finally {
            btnMatricular.innerHTML = '<i class="ph ph-user-plus"></i> Matricular';
        }
    });

    // Remover
    async function removerInscricao(e) {
        const idInscricao = e.currentTarget.getAttribute('data-id');
        const nomeAluno = e.currentTarget.getAttribute('data-nome');
        
        if(confirm(`Tem certeza que deseja remover a matrícula de ${nomeAluno}?`)) {
            try {
                await deleteDoc(doc(db, 'igrejas', 'iebi', 'inscricoes', idInscricao));
                await carregarDadosTurma();
            } catch(error) {
                console.error("Erro ao remover:", error);
                showAlertModal("Erro ao remover matrícula.");
            }
        }
    }

    // Init
    carregarDadosTurma();
});
