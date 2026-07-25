import { db, collection, addDoc, doc, updateDoc, serverTimestamp } from './firebase.js';
import { deleteDoc, getDoc, getDocs, query, where, limit, writeBatch } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

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

    let confirmCallback = null;
    function showConfirmModal(message, onConfirm) {
        const modal = document.getElementById('confirmModal');
        const msgEl = document.getElementById('confirmModalMessage');
        if (modal && msgEl) {
            msgEl.textContent = message;
            confirmCallback = onConfirm;
            modal.classList.add('active');
        } else {
            if (confirm(message)) onConfirm();
        }
    }

    const btnCancelConfirm = document.getElementById('btnCancelConfirm');
    if(btnCancelConfirm) {
        btnCancelConfirm.addEventListener('click', () => {
            document.getElementById('confirmModal').classList.remove('active');
            confirmCallback = null;
        });
    }

    const btnOkConfirm = document.getElementById('btnOkConfirm');
    if(btnOkConfirm) {
        btnOkConfirm.addEventListener('click', () => {
            document.getElementById('confirmModal').classList.remove('active');
            if(confirmCallback) {
                confirmCallback();
                confirmCallback = null;
            }
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
        const btnTransferirAlunos = document.getElementById('btnTransferirAlunos');
        
        if (turmaData.status === 'Encerrada') {
            if (addStudentContainer) addStudentContainer.style.display = 'none';
            if (btnTransferirAlunos) btnTransferirAlunos.style.display = 'flex';
        } else {
            if (btnTransferirAlunos) btnTransferirAlunos.style.display = 'none';
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
                listaInscritos.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 40px; color: var(--text-muted);">Nenhum aluno matriculado nesta turma ainda.</td></tr>';
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
                        frequenciaStr = `${pct}% <span class="hide-on-mobile">(${presencas}/${totalAulas})</span>`;
                        if (pct < 75) frequenciaColor = '#E74C3C'; // Alerta de Falta
                        else frequenciaColor = '#2760AE';
                    }

                    let whatsappBtn = '';
                    if (i.contato_cache && i.contato_cache.replace(/\D/g, '').length >= 10) {
                        let phone = i.contato_cache.replace(/\D/g, '');
                        if (phone.length === 10 || phone.length === 11) phone = '55' + phone;
                        const msg = encodeURIComponent(`Olá ${i.nome_pessoa_cache.split(' ')[0]}, tudo bem? Falando da IEBI, sobre a turma ${turmaData.nome_turma}.`);
                        whatsappBtn = `<a href="https://wa.me/${phone}?text=${msg}" target="_blank" class="btn-whatsapp" title="Enviar WhatsApp">
                                        <i class="ph ph-whatsapp-logo"></i>
                                      </a>`;
                    }

                    let acoesHtml = '';
                    if (turmaData.status === 'Encerrada') {
                        let colorBadge = i.status_final === 'Aprovado' ? '#2760AE' : (i.status_final === 'Desistente' ? '#7F8C8D' : '#E74C3C');
                        
                        let iconClass = 'ph-info';
                        if (i.status_final === 'Aprovado') iconClass = 'ph-check-circle';
                        else if (i.status_final === 'Reprovado') iconClass = 'ph-x-circle';
                        else if (i.status_final === 'Desistente') iconClass = 'ph-minus-circle';

                        acoesHtml = `<span style="display:inline-flex; align-items:center; padding: 6px; background: transparent; color: ${colorBadge}; font-weight:bold;" title="${i.status_final || 'Encerrado'}">
                            <i class="ph ${iconClass}" style="font-size: 1.25rem;"></i>
                            <span class="hide-on-mobile" style="margin-left: 4px; font-size: 0.8rem;">${i.status_final || 'Encerrado'}</span>
                        </span>`;
                        
                        if (i.status_final === 'Aprovado') {
                            acoesHtml += `<button class="btn-certificado" onclick="window.open('certificado.html?inscricaoId=${i.id}', '_blank')" title="Certificado"><i class="ph ph-certificate"></i></button>`;
                        }
                    } else {
                        acoesHtml = `
                            <button class="btn-remover" data-id="${i.id}" data-nome="${i.nome_pessoa_cache}" title="Remover Matrícula">
                                <i class="ph ph-trash"></i>
                            </button>
                        `;
                    }
                    
                    const botoesAcao = `<div class="mobile-action-flex" style="display: flex; gap: 1px; justify-content: center; align-items: center;">
                        ${whatsappBtn}
                        ${acoesHtml}
                    </div>`;

                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td class="hide-on-mobile" style="color: var(--text-muted); font-weight: 600;">${index + 1}</td>
                        <td class="col-nome" style="overflow: hidden;">
                            <div style="font-weight: 500; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${i.nome_pessoa_cache}</div>
                            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${i.contato_cache || '-'}</div>
                        </td>
                        <td class="hide-on-mobile" style="text-align: center; color: var(--text-muted);">${formatDateFromTimestamp(i.data_inscricao)}</td>
                        <td class="col-freq hide-on-mobile" style="text-align: center; font-weight: bold; color: ${frequenciaColor};">${frequenciaStr}</td>
                        <td class="col-acao" style="text-align: center;">${botoesAcao}</td>
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
        
        const efetuarMatricula = async () => {
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
        };

        if (vagasTotais > 0 && inscritosAtuais >= vagasTotais) {
            showConfirmModal("Atenção: A turma já atingiu a capacidade máxima de vagas! Deseja forçar a matrícula mesmo assim?", efetuarMatricula);
        } else {
            efetuarMatricula();
        }
    });

    // Remover
    async function removerInscricao(e) {
        const idInscricao = e.currentTarget.getAttribute('data-id');
        const nomeAluno = e.currentTarget.getAttribute('data-nome');
        
        showConfirmModal(`Tem certeza que deseja remover a matrícula de ${nomeAluno}?`, async () => {
            try {
                await deleteDoc(doc(db, 'igrejas', 'iebi', 'inscricoes', idInscricao));
                await carregarDadosTurma();
            } catch(error) {
                console.error("Erro ao remover:", error);
                showAlertModal("Erro ao remover matrícula.");
            }
        });
    }

    // Init
    carregarDadosTurma();

    // ==========================================
    // LOGICA DE TRANSFERENCIA DE ALUNOS (LOTE)
    // ==========================================
    const btnTransferirAlunos = document.getElementById('btnTransferirAlunos');
    const transferModal = document.getElementById('transferModal');
    const closeTransferModalBtn = document.getElementById('closeTransferModalBtn');
    const btnCancelTransfer = document.getElementById('btnCancelTransfer');
    const transferTurmaSelect = document.getElementById('transferTurmaSelect');
    const transferStudentsList = document.getElementById('transferStudentsList');
    const btnConfirmTransfer = document.getElementById('btnConfirmTransfer');
    
    let currentInscritosDocs = []; // para guardar a lista de alunos atual

    function closeTransferModal() {
        if(transferModal) transferModal.classList.remove('active');
    }

    if(closeTransferModalBtn) closeTransferModalBtn.addEventListener('click', closeTransferModal);
    if(btnCancelTransfer) btnCancelTransfer.addEventListener('click', closeTransferModal);

    if(btnTransferirAlunos) {
        btnTransferirAlunos.addEventListener('click', async () => {
            btnTransferirAlunos.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Carregando...';
            btnTransferirAlunos.disabled = true;

            try {
                // 1. Buscar Turmas Abertas
                const turmasRef = collection(db, 'igrejas', 'iebi', 'turmas');
                const qAbertas = query(turmasRef, where('status', '==', 'Inscrições Abertas'));
                const turmasSnap = await getDocs(qAbertas);
                
                transferTurmaSelect.innerHTML = '<option value="">Selecione uma turma de destino...</option>';
                
                if (turmasSnap.empty) {
                    transferTurmaSelect.innerHTML = '<option value="">Nenhuma turma com inscrições abertas encontrada.</option>';
                    transferTurmaSelect.disabled = true;
                } else {
                    transferTurmaSelect.disabled = false;
                    turmasSnap.forEach(t => {
                        const tData = t.data();
                        transferTurmaSelect.innerHTML += `<option value="${t.id}">${tData.nome_turma} (${tData.nome_curso_cache})</option>`;
                    });
                }

                // 2. Buscar lista de alunos desta turma (se já não estiver na memória)
                const inscricoesRef = collection(db, 'igrejas', 'iebi', 'inscricoes');
                const qInsc = query(inscricoesRef, where('id_turma', '==', turmaId));
                const inscSnap = await getDocs(qInsc);
                
                currentInscritosDocs = [];
                inscSnap.forEach(d => currentInscritosDocs.push({ id: d.id, ...d.data() }));

                // 3. Renderizar checkboxes de alunos
                transferStudentsList.innerHTML = '';
                if(currentInscritosDocs.length === 0) {
                    transferStudentsList.innerHTML = '<div style="padding: 12px; color: var(--text-muted); text-align: center;">Nenhum aluno matriculado nesta turma.</div>';
                } else {
                    // Ordenar A-Z
                    currentInscritosDocs.sort((a,b) => (a.nome_pessoa_cache || '').localeCompare(b.nome_pessoa_cache || ''));
                    
                    currentInscritosDocs.forEach(aluno => {
                        let badgeHtml = '';
                        if (aluno.status_final) {
                            if (aluno.status_final === 'Aprovado') {
                                badgeHtml = '<span style="color:#2760AE; font-size:0.75rem; font-weight:bold;">[Aprovado]</span>';
                            } else if (aluno.status_final === 'Desistente') {
                                badgeHtml = '<span style="color:#7F8C8D; font-size:0.75rem; font-weight:bold;">[Desistente]</span>';
                            } else {
                                badgeHtml = `<span style="color:#E74C3C; font-size:0.75rem; font-weight:bold;">[${aluno.status_final}]</span>`;
                            }
                        }
                        
                        transferStudentsList.innerHTML += `
                            <label style="display: flex; align-items: center; gap: 12px; padding: 10px; border-bottom: 1px solid var(--border-color); cursor: pointer;">
                                <input type="checkbox" class="transfer-student-checkbox" value="${aluno.id_pessoa}" data-nome="${aluno.nome_pessoa_cache}" data-contato="${aluno.contato_cache || ''}" style="width: 18px; height: 18px;" checked>
                                <div style="flex: 1;">
                                    <div class="nome-container" style="font-weight: 500; color: var(--text-main); font-size: 0.9rem;">${aluno.nome_pessoa_cache} ${badgeHtml}</div>
                                    <div style="font-size: 0.8rem; color: var(--text-muted);">${aluno.contato_cache || 'Sem contato'}</div>
                                </div>
                            </label>
                        `;
                    });

                    // Add listener to enable/disable button based on selections
                    const checkboxes = document.querySelectorAll('.transfer-student-checkbox');
                    checkboxes.forEach(cb => {
                        cb.addEventListener('change', checkTransferFormValidity);
                    });
                }
                
                transferTurmaSelect.addEventListener('change', async (e) => {
                    const selectedTurmaId = transferTurmaSelect.value;
                    const allCheckboxes = document.querySelectorAll('.transfer-student-checkbox');

                    if (!selectedTurmaId) {
                        allCheckboxes.forEach(cb => {
                            cb.disabled = false;
                            cb.closest('label').style.opacity = '1';
                            const existBadge = cb.closest('label').querySelector('.already-enrolled-badge');
                            if(existBadge) existBadge.remove();
                        });
                        checkTransferFormValidity();
                        return;
                    }
                    
                    transferTurmaSelect.disabled = true; // prevent changing while fetching

                    try {
                        const destInscricoesRef = collection(db, 'igrejas', 'iebi', 'inscricoes');
                        const qDest = query(destInscricoesRef, where('id_turma', '==', selectedTurmaId));
                        const destSnap = await getDocs(qDest);
                        
                        const alunosJaNaDestino = new Set();
                        destSnap.forEach(d => {
                            const id = d.data().id_pessoa;
                            if(id) alunosJaNaDestino.add(id);
                        });

                        allCheckboxes.forEach(cb => {
                            const label = cb.closest('label');
                            let existBadge = label.querySelector('.already-enrolled-badge');
                            
                            if(alunosJaNaDestino.has(cb.value)) {
                                cb.checked = false;
                                cb.disabled = true;
                                label.style.opacity = '0.5';
                                if(!existBadge) {
                                    const badge = document.createElement('span');
                                    badge.className = 'already-enrolled-badge';
                                    badge.style = "color:#E74C3C; font-size:0.75rem; font-weight:bold; margin-left: 8px;";
                                    badge.textContent = "[Já Matriculado]";
                                    label.querySelector('.nome-container').appendChild(badge);
                                }
                            } else {
                                cb.disabled = false;
                                label.style.opacity = '1';
                                if(existBadge) existBadge.remove();
                            }
                        });
                    } catch(err) {
                        console.error("Erro ao verificar matrículas de destino:", err);
                    } finally {
                        transferTurmaSelect.disabled = false;
                        checkTransferFormValidity();
                    }
                });
                
                checkTransferFormValidity();

                transferModal.classList.add('active');

            } catch (error) {
                console.error("Erro ao preparar transferência:", error);
                showAlertModal("Erro ao carregar dados para transferência.");
            } finally {
                btnTransferirAlunos.innerHTML = '<i class="ph ph-share-network"></i> Transferir Alunos';
                btnTransferirAlunos.disabled = false;
            }
        });
    }

    function checkTransferFormValidity() {
        if(!btnConfirmTransfer) return;
        const selectedTurma = transferTurmaSelect.value;
        const selectedStudents = document.querySelectorAll('.transfer-student-checkbox:checked');
        
        if(selectedTurma && selectedStudents.length > 0) {
            btnConfirmTransfer.disabled = false;
            btnConfirmTransfer.textContent = `Confirmar Matrículas (${selectedStudents.length})`;
        } else {
            btnConfirmTransfer.disabled = true;
            btnConfirmTransfer.textContent = 'Confirmar Matrículas';
        }
    }

    if(btnConfirmTransfer) {
        btnConfirmTransfer.addEventListener('click', async () => {
            const selectedTurmaId = transferTurmaSelect.value;
            const checkboxes = document.querySelectorAll('.transfer-student-checkbox:checked');
            
            if(!selectedTurmaId || checkboxes.length === 0) return;

            btnConfirmTransfer.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Processando...';
            btnConfirmTransfer.disabled = true;

            try {
                // Para evitar erros de duplicação, vamos buscar todos os alunos da turma de destino primeiro
                const destInscricoesRef = collection(db, 'igrejas', 'iebi', 'inscricoes');
                const qDest = query(destInscricoesRef, where('id_turma', '==', selectedTurmaId));
                const destSnap = await getDocs(qDest);
                
                const alunosJaNaDestino = new Set();
                destSnap.forEach(d => {
                    const id = d.data().id_pessoa;
                    if(id) alunosJaNaDestino.add(id);
                });

                const batch = writeBatch(db);
                let matriculasNovas = 0;
                let alunosIgnorados = 0;

                checkboxes.forEach(cb => {
                    const pessoaId = cb.value;
                    if(alunosJaNaDestino.has(pessoaId)) {
                        alunosIgnorados++;
                        return; // Já está na turma de destino
                    }

                    const nomeCache = cb.getAttribute('data-nome');
                    const contatoCache = cb.getAttribute('data-contato');

                    const novaInscricaoRef = doc(collection(db, 'igrejas', 'iebi', 'inscricoes'));
                    batch.set(novaInscricaoRef, {
                        id_turma: selectedTurmaId,
                        id_pessoa: pessoaId,
                        nome_pessoa_cache: nomeCache,
                        contato_cache: contatoCache,
                        data_inscricao: serverTimestamp(),
                        status: 'Ativa'
                    });
                    
                    matriculasNovas++;
                });

                if(matriculasNovas > 0) {
                    await batch.commit();
                }

                closeTransferModal();
                
                if(alunosIgnorados > 0) {
                    showAlertModal(`${matriculasNovas} alunos transferidos com sucesso. ${alunosIgnorados} alunos foram ignorados pois já estavam matriculados na turma de destino.`, false);
                } else {
                    showAlertModal(`${matriculasNovas} alunos transferidos/matriculados com sucesso!`, false);
                }

            } catch (error) {
                console.error("Erro na transferência em lote:", error);
                showAlertModal("Erro ao processar as matrículas. Tente novamente.");
                btnConfirmTransfer.innerHTML = '<i class="ph ph-check-circle"></i> Confirmar Matrículas';
                btnConfirmTransfer.disabled = false;
            }
        });
    }

});
