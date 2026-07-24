import { db, collection, addDoc, doc, updateDoc, serverTimestamp } from './firebase.js';
import { deleteDoc, getDoc, getDocs, query, where, limit } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const turmaId = urlParams.get('id');

    if (!turmaId) {
        alert("Nenhuma turma selecionada. Voltando para página de turmas.");
        window.location.href = "turmas.html";
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
                alert("Turma não encontrada.");
                window.location.href = "turmas.html";
                return;
            }

            turmaData = snap.data();
            
            const cores = getStatusColor(turmaData.status);
            badgeStatus.textContent = turmaData.status;
            badgeStatus.style.backgroundColor = cores.bg;
            badgeStatus.style.color = cores.color;
            
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
                listaInscritos.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 40px; color: var(--text-muted);">Nenhum aluno matriculado nesta turma ainda.</td></tr>';
            } else {
                // Converter para array para podermos ordenar por data de inscrição (decrescente)
                let docsArr = [];
                inscSnap.forEach(d => {
                    docsArr.push({ id: d.id, ...d.data() });
                });
                
                docsArr.sort((a,b) => {
                    let d1 = a.data_inscricao ? a.data_inscricao.toMillis() : 0;
                    let d2 = b.data_inscricao ? b.data_inscricao.toMillis() : 0;
                    return d2 - d1;
                });
                
                docsArr.forEach(i => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td style="font-weight: 500; color: var(--text-main);">${i.nome_pessoa_cache}</td>
                        <td style="color: var(--text-muted);">${formatDateFromTimestamp(i.data_inscricao)}</td>
                        <td style="color: var(--text-muted);">${i.contato_cache || '-'}</td>
                        <td style="text-align: right;">
                            <button class="btn-remover" data-id="${i.id}" data-nome="${i.nome_pessoa_cache}">
                                <i class="ph ph-trash"></i> Remover
                            </button>
                        </td>
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
            alert("Erro ao carregar turma.");
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
                alert("Este aluno já está matriculado nesta turma!");
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
            alert("Erro ao realizar matrícula.");
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
                alert("Erro ao remover matrícula.");
            }
        }
    }

    // Init
    carregarDadosTurma();
});
