import { db } from './firebase.js';
import { doc, collection, query, where, getDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const pessoaId = urlParams.get('id');

    if (!pessoaId) {
        alert('Nenhum membro selecionado. Redirecionando para a busca.');
        window.location.href = 'procurar-cadastro.html';
        return;
    }

    // Elementos DOM da Coluna Esquerda
    const avatarInitials = document.getElementById('avatarInitials');
    const lblNomeMembro = document.getElementById('lblNomeMembro');
    const lblSubtituloMembro = document.getElementById('lblSubtituloMembro');
    const containerBadges = document.getElementById('containerBadges');
    
    const btnEditarMembro = document.getElementById('btnEditarMembro');
    const btnWhatsapp = document.getElementById('btnWhatsapp');
    const btnCarteirinha = document.getElementById('btnCarteirinha');

    const lblCelular = document.getElementById('lblCelular');
    const lblEmail = document.getElementById('lblEmail');
    const lblInstagram = document.getElementById('lblInstagram');

    const lblNascimento = document.getElementById('lblNascimento');
    const lblEstadoCivil = document.getElementById('lblEstadoCivil');
    const lblTipoSanguineo = document.getElementById('lblTipoSanguineo');
    const lblDoadorOrgaos = document.getElementById('lblDoadorOrgaos');
    const lblCidadeUf = document.getElementById('lblCidadeUf');
    const lblBairro = document.getElementById('lblBairro');

    // Elementos DOM das Abas
    const containerTimeline = document.getElementById('containerTimeline');
    const lblTotalEventos = document.getElementById('lblTotalEventos');
    const listaCursosMembro = document.getElementById('listaCursosMembro');
    const containerDadosCompletos = document.getElementById('containerDadosCompletos');

    // Gerenciador de Abas
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');

            const targetTab = e.currentTarget.getAttribute('data-tab');
            e.currentTarget.classList.add('active');
            const pane = document.getElementById(targetTab);
            if (pane) pane.style.display = 'block';
        });
    });

    function formatDateBr(dateInput) {
        if (!dateInput) return '--';
        let dateObj = null;
        if (dateInput.toDate) dateObj = dateInput.toDate();
        else if (typeof dateInput === 'string' || typeof dateInput === 'number') dateObj = new Date(dateInput);
        else dateObj = dateInput;

        if (isNaN(dateObj)) return '--';
        return dateObj.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    }

    function calculateAge(birthDateInput) {
        if (!birthDateInput) return null;
        let birthDate = birthDateInput.toDate ? birthDateInput.toDate() : new Date(birthDateInput);
        if (isNaN(birthDate)) return null;

        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    function getInitials(name) {
        if (!name) return 'MB';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    try {
        // 1. Carregar Dados da Pessoa no Firestore
        let pessoaRef = doc(db, 'igrejas', 'iebi', 'pessoas', pessoaId);
        let pessoaSnap = await getDoc(pessoaRef);

        if (!pessoaSnap.exists()) {
            // Tentar na coleção membros se não achar em pessoas
            pessoaRef = doc(db, 'membros', pessoaId);
            pessoaSnap = await getDoc(pessoaRef);
        }

        if (!pessoaSnap.exists()) {
            alert('Cadastro do membro não foi encontrado.');
            window.location.href = 'procurar-cadastro.html';
            return;
        }

        const pessoaData = pessoaSnap.data();

        // 2. Preencher Coluna da Esquerda (Perfil)
        const nome = pessoaData.nome || 'Membro IEBI';
        lblNomeMembro.textContent = nome.toUpperCase();
        avatarInitials.textContent = getInitials(nome);

        const rol = pessoaData.matricula_rol ? `Rol Nº ${pessoaData.matricula_rol}` : 'Cód: ' + pessoaId.substring(0, 6).toUpperCase();
        const arrolamentoText = pessoaData.arrolamento ? pessoaData.arrolamento.toUpperCase() : 'MEMBRO';
        lblSubtituloMembro.textContent = `IEBI • ${rol}`;

        // Badges Dinâmicos conforme Tipo de Arrolamento / Situação
        const arrolamentoRaw = pessoaData.arrolamento || '';
        const arrolamentoLower = arrolamentoRaw.toLowerCase();
        const isVisitante = arrolamentoLower === 'visitante';

        let badgesHtml = '';

        if (isVisitante) {
            badgesHtml += `<span class="badge-pill badge-info">VISITANTE</span>`;
        } else {
            badgesHtml += `<span class="badge-pill badge-success">MEMBRO ATIVO</span>`;
            if (arrolamentoRaw && arrolamentoLower !== 'membro') {
                badgesHtml += `<span class="badge-pill badge-primary">${arrolamentoRaw.toUpperCase()}</span>`;
            }
        }
        
        const idade = calculateAge(pessoaData.data_nascimento);
        if (idade !== null) {
            badgesHtml += `<span class="badge-pill badge-secondary">${idade} Anos</span>`;
        }
        containerBadges.innerHTML = badgesHtml;

        // Links dos Botões de Ação
        btnEditarMembro.href = `pessoa-nova.html?id=${pessoaId}`;
        btnCarteirinha.href = `carteirinha.html?id=${pessoaId}`;

        if (pessoaData.celular) {
            const rawNumber = pessoaData.celular.replace(/\D/g, '');
            btnWhatsapp.href = `https://wa.me/55${rawNumber}?text=Olá%20${encodeURIComponent(nome)},%20paz%20do%20Senhor!`;
        } else {
            btnWhatsapp.style.display = 'none';
        }

        // Informações Pessoais
        lblCelular.textContent = pessoaData.celular || '--';
        lblEmail.textContent = pessoaData.email || '--';
        if (pessoaData.redes_sociais && pessoaData.redes_sociais.instagram) {
            lblInstagram.textContent = `@${pessoaData.redes_sociais.instagram.replace('@', '')}`;
        } else {
            lblInstagram.textContent = pessoaData.instagram || '--';
        }

        lblNascimento.textContent = formatDateBr(pessoaData.data_nascimento);
        lblEstadoCivil.textContent = pessoaData.estado_civil || '--';
        lblTipoSanguineo.textContent = pessoaData.tipo_sanguineo || '--';
        lblDoadorOrgaos.textContent = pessoaData.doador_orgaos ? 'Sim' : 'Não';

        if (pessoaData.endereco) {
            const cid = pessoaData.endereco.cidade || 'Cabedelo';
            const uf = pessoaData.endereco.uf || 'PB';
            lblCidadeUf.textContent = `${cid}/${uf}`;
            lblBairro.textContent = pessoaData.endereco.bairro || '--';
        } else {
            lblCidadeUf.textContent = '--';
            lblBairro.textContent = '--';
        }

        // 3. Buscar Inscrições em Cursos (Coleção inscricoes)
        const inscRef = collection(db, 'igrejas', 'iebi', 'inscricoes');
        const qInsc = query(inscRef, where('id_pessoa', '==', pessoaId));
        const inscSnap = await getDocs(qInsc);

        let inscricoes = [];
        for (const d of inscSnap.docs) {
            const inscData = { id: d.id, ...d.data() };
            
            let nomeTurma = inscData.nome_turma_cache || '';
            let nomeCurso = inscData.nome_curso_cache || '';
            let statusTurma = '';

            if (inscData.id_turma) {
                try {
                    const turmaRef = doc(db, 'igrejas', 'iebi', 'turmas', inscData.id_turma);
                    const turmaSnap = await getDoc(turmaRef);
                    if (turmaSnap.exists()) {
                        const tData = turmaSnap.data();
                        nomeTurma = tData.nome_turma || tData.nome || nomeTurma;
                        nomeCurso = tData.nome_curso_cache || tData.curso_nome || tData.curso || nomeCurso;
                        statusTurma = tData.status || '';

                        if ((!nomeCurso || nomeCurso === 'Curso IEBI') && tData.id_curso) {
                            const cursoRef = doc(db, 'igrejas', 'iebi', 'cursos', tData.id_curso);
                            const cursoSnap = await getDoc(cursoRef);
                            if (cursoSnap.exists()) {
                                nomeCurso = cursoSnap.data().nome || 'Curso IEBI';
                            }
                        }
                    }
                } catch (eTurma) {
                    console.error("Erro ao buscar detalhes da turma/curso:", eTurma);
                }
            }

            inscData.nome_turma_display = nomeTurma || 'Turma Sem Nome';
            inscData.nome_curso_display = nomeCurso || 'Curso IEBI';

            // Determinar o status de referência da Turma / Fechamento (Aprovado vs Reprovado)
            let statusFinal = inscData.status_final || inscData.status || '';
            let statusReal = statusFinal || 'Ativa';

            if (statusTurma) {
                const sLower = statusTurma.toLowerCase();
                if (sLower.includes('encerrad')) {
                    if (statusFinal === 'Aprovado' || statusFinal === 'Concluída') {
                        statusReal = 'Aprovado';
                    } else if (statusFinal.toLowerCase().includes('reprovad') || statusFinal === 'Desistente') {
                        statusReal = statusFinal;
                    } else {
                        // Turma encerrada sem status de aprovação registrado para a pessoa
                        statusReal = 'Reprovado por Falta';
                    }
                } else if (sLower.includes('andamento')) {
                    statusReal = (statusFinal === 'Aprovado' || statusFinal === 'Concluída') ? 'Aprovado' : 'Em Andamento';
                } else if (sLower.includes('inscr')) {
                    statusReal = statusFinal || 'Inscrições Abertas';
                } else {
                    statusReal = statusFinal || statusTurma;
                }
            }

            inscData.status_display = statusReal;
            inscData.is_aprovado = (statusReal === 'Aprovado' || statusReal === 'Concluída');
            inscData.is_reprovado = (statusReal.toLowerCase().includes('reprovad') || statusReal === 'Desistente');

            inscricoes.push(inscData);
        }

        // 4. Montar a Linha do Tempo (Timeline Events)
        let timelineEvents = [];

        // Evento: Cadastro / Entrada no Rol
        if (pessoaData.data_entrada || pessoaData.created_at) {
            timelineEvents.push({
                data: pessoaData.data_entrada || pessoaData.created_at,
                titulo: 'Entrada na Igreja / Arrolamento',
                descricao: `Ingresso registrado por ${pessoaData.arrolamento || 'Arrolamento de Membresia'}. ${pessoaData.observacoes_arrolamento || ''}`,
                categoria: 'cadastro',
                icone: 'ph-user-check'
            });
        }

        // Evento: Batismo (se houver campo)
        if (pessoaData.data_batismo) {
            timelineEvents.push({
                data: pessoaData.data_batismo,
                titulo: 'Batismo nas Águas',
                descricao: 'Profissão pública de fé e batismo nas águas.',
                categoria: 'batismo',
                icone: 'ph-drop'
            });
        }

        // Eventos de Cursos (Inscrições)
        inscricoes.forEach(insc => {
            const dataInsc = insc.data_inscricao || insc.created_at;
            timelineEvents.push({
                data: dataInsc,
                titulo: `Matrícula: ${insc.nome_curso_display}`,
                descricao: `Inscrito na turma "${insc.nome_turma_display}" com status: ${insc.status_display}.`,
                categoria: 'curso',
                icone: 'ph-book-open'
            });

            if (insc.is_aprovado) {
                timelineEvents.push({
                    data: insc.updated_at || dataInsc,
                    titulo: `Conclusão de Curso: ${insc.nome_curso_display}`,
                    descricao: `Concluiu com sucesso a turma "${insc.nome_turma_display}". Certificado disponível.`,
                    categoria: 'conclusao',
                    icone: 'ph-graduation-cap'
                });
            }
        });

        // Evento de Célula (se houver)
        if (pessoaData.celula || pessoaData.nome_celula) {
            timelineEvents.push({
                data: pessoaData.data_entrada || new Date(),
                titulo: `Membro da Célula: ${pessoaData.celula || pessoaData.nome_celula}`,
                descricao: `Integrado aos encontros e comunhão da célula. Líder: ${pessoaData.lider_celula || '--'}.`,
                categoria: 'celula',
                icone: 'ph-house-line'
            });
        }

        // Ordenar Timeline por Data Descendente (mais recentes primeiro)
        timelineEvents.sort((a, b) => {
            const dA = a.data ? (a.data.toDate ? a.data.toDate() : new Date(a.data)) : new Date(0);
            const dB = b.data ? (b.data.toDate ? b.data.toDate() : new Date(b.data)) : new Date(0);
            return dB - dA;
        });

        // Renderizar Timeline
        containerTimeline.innerHTML = '';
        lblTotalEventos.textContent = `${timelineEvents.length} marco(s) registrado(s)`;

        if (timelineEvents.length === 0) {
            containerTimeline.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-muted);">Nenhum histórico registrado na linha do tempo.</div>`;
        } else {
            timelineEvents.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'timeline-item';
                
                itemDiv.innerHTML = `
                    <div class="timeline-icon ${item.categoria}">
                        <i class="ph ${item.icone}"></i>
                    </div>
                    <div class="timeline-content">
                        <div class="timeline-date"><i class="ph ph-calendar-blank"></i> ${formatDateBr(item.data)}</div>
                        <div class="timeline-title">${item.titulo}</div>
                        <div class="timeline-description">${item.descricao}</div>
                    </div>
                `;
                containerTimeline.appendChild(itemDiv);
            });
        }

        // 5. Renderizar Tabela de Cursos
        listaCursosMembro.innerHTML = '';
        if (inscricoes.length === 0) {
            listaCursosMembro.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 30px; color: var(--text-muted);">Nenhum curso ou turma matriculada.</td></tr>`;
        } else {
            inscricoes.forEach(insc => {
                const tr = document.createElement('tr');
                let badgeStatusClass = 'badge-primary';
                let badgeStyle = '';
                
                if (insc.is_aprovado) {
                    badgeStatusClass = 'badge-success';
                } else if (insc.is_reprovado) {
                    badgeStatusClass = '';
                    badgeStyle = 'background-color: #E74C3C; color: #fff;';
                } else if (insc.status_display === 'Em Andamento') {
                    badgeStatusClass = 'badge-info';
                }

                // Definir ação do certificado (Apenas para Aprovados)
                let acaoCertificadoHtml = '';
                if (insc.is_aprovado) {
                    acaoCertificadoHtml = `
                        <a href="certificado.html?inscricaoId=${insc.id}" class="btn-icon" title="Ver Certificado / Frequência" style="display:inline-flex; align-items:center; justify-content:center; color: var(--primary);">
                            <i class="ph ph-certificate" style="font-size: 1.2rem;"></i>
                        </a>
                    `;
                } else if (insc.is_reprovado) {
                    acaoCertificadoHtml = `
                        <span title="Reprovado - Sem direito a certificado" style="color: #E74C3C; font-size: 1.1rem; display:inline-flex; align-items:center; justify-content:center;">
                            <i class="ph ph-prohibit"></i>
                        </span>
                    `;
                } else {
                    acaoCertificadoHtml = `<span style="color: var(--text-muted); font-size: 0.85rem;">--</span>`;
                }
                
                tr.innerHTML = `
                    <td>
                        <strong style="color: #0F3A4C;">${insc.nome_curso_display}</strong><br>
                        <span style="font-size: 0.8rem; color: var(--text-muted);">Turma: ${insc.nome_turma_display}</span>
                    </td>
                    <td style="font-size: 0.85rem; color: var(--text-muted);">${formatDateBr(insc.data_inscricao)}</td>
                    <td style="text-align: center;"><span class="badge-pill ${badgeStatusClass}" style="${badgeStyle}">${insc.status_display}</span></td>
                    <td style="text-align: center;">${acaoCertificadoHtml}</td>
                `;
                listaCursosMembro.appendChild(tr);
            });
        }

        // 6. Renderizar Dados Completos em Seções Organizadas
        const renderCampo = (label, value) => {
            const valDisplay = (value !== undefined && value !== null && value !== '' && value !== false) 
                ? (value === true ? 'Sim' : value) 
                : '--';
            return `
                <div style="background: #F8FAFC; padding: 12px 14px; border-radius: 8px; border: 1px solid var(--border-color);">
                    <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${label}</span>
                    <div style="font-size: 0.92rem; font-weight: 600; color: var(--text-main); margin-top: 3px; word-break: break-word;">${valDisplay}</div>
                </div>
            `;
        };

        const endObj = pessoaData.endereco || {};
        const redObj = pessoaData.redes_sociais || {};

        containerDadosCompletos.innerHTML = `
            <!-- Seção 1: Dados Pessoais & Documentos -->
            <div style="margin-bottom: 24px;">
                <div style="font-size: 0.95rem; font-weight: 700; color: #0F3A4C; border-bottom: 2px solid #27AE60; padding-bottom: 6px; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
                    <i class="ph ph-user-circle" style="color: #27AE60; font-size: 1.2rem;"></i> Dados Pessoais & Documentos
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
                    ${renderCampo('Nome Completo', pessoaData.nome)}
                    ${renderCampo('Apelido', pessoaData.apelido)}
                    ${renderCampo('Sexo', pessoaData.sexo)}
                    ${renderCampo('Data de Nascimento', formatDateBr(pessoaData.data_nascimento))}
                    ${renderCampo('RG / Identidade', pessoaData.rg)}
                    ${renderCampo('CPF', pessoaData.cpf)}
                    ${renderCampo('Estado Civil', pessoaData.estado_civil)}
                    ${renderCampo('Escolaridade', pessoaData.escolaridade)}
                    ${renderCampo('Naturalidade', pessoaData.naturalidade)}
                    ${renderCampo('Tipo Sanguíneo', pessoaData.tipo_sanguineo)}
                    ${renderCampo('Doador de Órgãos', pessoaData.doador_orgaos ? 'Sim' : (pessoaData.doador_orgaos === false ? 'Não' : '--'))}
                </div>
            </div>

            <!-- Seção 2: Membresia & Vida Eclesiástica -->
            <div style="margin-bottom: 24px;">
                <div style="font-size: 0.95rem; font-weight: 700; color: #0F3A4C; border-bottom: 2px solid #27AE60; padding-bottom: 6px; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
                    <i class="ph ph-church" style="color: #27AE60; font-size: 1.2rem;"></i> Membresia & Vida Eclesiástica
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
                    ${renderCampo('Código / Rol', pessoaData.matricula_rol)}
                    ${renderCampo('Forma de Arrolamento', pessoaData.arrolamento)}
                    ${renderCampo('Data de Entrada', formatDateBr(pessoaData.data_entrada || pessoaData.created_at))}
                    ${renderCampo('Data de Batismo', formatDateBr(pessoaData.data_batismo))}
                    ${renderCampo('Célula / Grupo', pessoaData.celula || pessoaData.nome_celula)}
                    ${renderCampo('Líder da Célula', pessoaData.lider_celula)}
                </div>
                ${pessoaData.observacoes_arrolamento ? `
                    <div style="margin-top: 12px;">
                        ${renderCampo('Observações de Arrolamento', pessoaData.observacoes_arrolamento)}
                    </div>
                ` : ''}
            </div>

            <!-- Seção 3: Endereço Residencial -->
            <div style="margin-bottom: 24px;">
                <div style="font-size: 0.95rem; font-weight: 700; color: #0F3A4C; border-bottom: 2px solid #27AE60; padding-bottom: 6px; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
                    <i class="ph ph-map-pin" style="color: #27AE60; font-size: 1.2rem;"></i> Endereço Residencial
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
                    ${renderCampo('CEP', endObj.cep)}
                    ${renderCampo('Logradouro', endObj.logradouro)}
                    ${renderCampo('Número', endObj.numero)}
                    ${renderCampo('Complemento', endObj.complemento)}
                    ${renderCampo('Bairro', endObj.bairro)}
                    ${renderCampo('Cidade / UF', (endObj.cidade || endObj.uf) ? `${endObj.cidade || ''}/${endObj.uf || ''}` : '--')}
                </div>
            </div>

            <!-- Seção 4: Contatos & Redes Sociais -->
            <div style="margin-bottom: 12px;">
                <div style="font-size: 0.95rem; font-weight: 700; color: #0F3A4C; border-bottom: 2px solid #27AE60; padding-bottom: 6px; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
                    <i class="ph ph-phone" style="color: #27AE60; font-size: 1.2rem;"></i> Contatos & Redes Sociais
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
                    ${renderCampo('Celular / WhatsApp', pessoaData.celula_whatsapp || pessoaData.celular)}
                    ${renderCampo('E-mail', pessoaData.email)}
                    ${renderCampo('Nome para Recados', redObj.nome_recado)}
                    ${renderCampo('Telefone para Recados', redObj.telefone_recado)}
                    ${renderCampo('Instagram', redObj.instagram)}
                    ${renderCampo('Facebook', redObj.facebook)}
                </div>
            </div>
        `;

    } catch (err) {
        console.error("Erro ao carregar dados do membro:", err);
        containerTimeline.innerHTML = `<div style="text-align:center; padding: 40px; color: #E74C3C;">Erro ao carregar os detalhes do membro. Tente novamente.</div>`;
    }
});
