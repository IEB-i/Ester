import { db, collection } from './firebase.js';
import { getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    // Elements
    const kpiCursos = document.getElementById('kpiCursos');
    const kpiTurmas = document.getElementById('kpiTurmas');
    const kpiMatriculas = document.getElementById('kpiMatriculas');
    const kpiFormandos = document.getElementById('kpiFormandos');
    const alertsList = document.getElementById('alertsList');

    async function loadDashboardData() {
        try {
            // 1. Fetch Cursos
            const cursosRef = collection(db, 'igrejas', 'iebi', 'cursos');
            const qCursos = query(cursosRef, where('status', '==', 'Ativo'));
            const cursosSnap = await getDocs(qCursos);
            const totalCursos = cursosSnap.size;
            
            let mapCursosNome = {};
            cursosSnap.forEach(d => {
                mapCursosNome[d.id] = d.data().nome;
            });

            // 2. Fetch Turmas
            const turmasRef = collection(db, 'igrejas', 'iebi', 'turmas');
            const turmasSnap = await getDocs(turmasRef);
            
            let turmasAtivas = 0;
            let vagasDisponiveisAtivas = 0;
            let vagasOcupadasAtivas = 0;
            
            let demandaPorCursoId = {};
            let alertas = [];

            const hoje = new Date();

            turmasSnap.forEach(doc => {
                const data = doc.data();
                const isAtiva = data.status === 'Inscrições Abertas' || data.status === 'Em Andamento';
                
                if (isAtiva) {
                    turmasAtivas++;
                    const vagasTotais = parseInt(data.vagas_totais) || 0;
                    const vagasOcupadas = parseInt(data.vagas_ocupadas) || 0;
                    
                    vagasDisponiveisAtivas += vagasTotais;
                    vagasOcupadasAtivas += vagasOcupadas;
                    
                    // Contabilizar demanda
                    const cId = data.id_curso;
                    if (cId) {
                        if (!demandaPorCursoId[cId]) demandaPorCursoId[cId] = 0;
                        demandaPorCursoId[cId] += vagasOcupadas;
                    }

                    // Checagens Operacionais (Alertas)
                    if (!data.professor || data.professor.trim() === '') {
                        alertas.push({
                            type: 'danger',
                            icon: 'ph-warning',
                            title: `Turma sem professor: ${data.nome_turma}`,
                            desc: 'Não há um responsável definido para ministrar as aulas.'
                        });
                    }

                    if (vagasOcupadas === 0 && data.status === 'Em Andamento') {
                        alertas.push({
                            type: 'warning',
                            icon: 'ph-users-three',
                            title: `Turma Vazia: ${data.nome_turma}`,
                            desc: 'A turma está em andamento mas não possui matrículas ativas.'
                        });
                    }

                    if (data.data_fim) {
                        const [y, m, d] = data.data_fim.split('-');
                        const dataFim = new Date(y, m-1, d);
                        const diffTime = dataFim - hoje;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (diffDays >= 0 && diffDays <= 7) {
                            alertas.push({
                                type: 'info',
                                icon: 'ph-calendar-check',
                                title: `Encerramento Próximo: ${data.nome_turma}`,
                                desc: `A turma encerrará em ${diffDays} dia(s). Prepare-se para a avaliação final.`
                            });
                        }
                    }
                    
                    // Resumo da turma (sempre exibido se estiver ativa)
                    const pct = vagasTotais > 0 ? Math.min(100, Math.round((vagasOcupadas / vagasTotais) * 100)) : 0;
                    alertas.push({
                        isSummary: true,
                        html: `
                            <div class="summary-item">
                               <div class="summary-header">
                                   <span class="summary-title">${data.nome_turma}</span>
                                   <span class="summary-numbers">${vagasOcupadas}/${vagasTotais} vagas</span>
                               </div>
                               <div class="summary-bar-bg">
                                   <div class="summary-bar-fill" style="width: ${pct}%;"></div>
                               </div>
                            </div>
                        `
                    });
                }
            });

            // 3. Fetch Inscrições (Para total de matrículas ativas e formandos)
            const inscricoesRef = collection(db, 'igrejas', 'iebi', 'inscricoes');
            const inscricoesSnap = await getDocs(inscricoesRef);
            
            let totalMatriculasAtivas = 0;
            let totalFormandos = 0;

            inscricoesSnap.forEach(doc => {
                const data = doc.data();
                if (data.status_final === 'Aprovado') {
                    totalFormandos++;
                }
                
                // Nós contamos matrículas ativas baseadas nas turmas ativas
                // Mas, para ser preciso, uma inscrição 'Ativa' já é suficiente, assumindo que as turmas delas estão ativas.
                if (data.status === 'Ativa') {
                    totalMatriculasAtivas++;
                }
            });

            // Update KPIs
            kpiCursos.textContent = totalCursos;
            kpiTurmas.textContent = turmasAtivas;
            kpiMatriculas.textContent = totalMatriculasAtivas;
            kpiFormandos.textContent = totalFormandos;

            // Render Alertas
            alertsList.innerHTML = '';
            if (alertas.length === 0) {
                alertsList.innerHTML = `
                    <div style="padding: 24px; text-align: center; color: var(--text-muted);">
                        <i class="ph ph-check-circle" style="font-size: 2rem; color: #27AE60;"></i>
                        <p style="margin-top: 8px;">Tudo operando perfeitamente. Nenhum alerta.</p>
                    </div>`;
            } else {
                alertas.forEach(alerta => {
                    if (alerta.isSummary) {
                        alertsList.innerHTML += alerta.html;
                    } else {
                        alertsList.innerHTML += `
                            <div class="alert-item alert-${alerta.type}">
                                <i class="ph ${alerta.icon} alert-icon"></i>
                                <div class="alert-content">
                                    <p>${alerta.title}</p>
                                    <span>${alerta.desc}</span>
                                </div>
                            </div>
                        `;
                    }
                });
            }

            // --- Render Charts ---

            // Chart 1: Ranking de Demanda (Bar Chart)
            const ctxRanking = document.getElementById('rankingChart').getContext('2d');
            let labelsDemanda = [];
            let dataDemanda = [];
            
            // Ordenar por demanda
            let arrDemanda = Object.keys(demandaPorCursoId).map(cId => {
                return {
                    nome: mapCursosNome[cId] || 'Curso Desconhecido',
                    total: demandaPorCursoId[cId]
                };
            }).sort((a,b) => b.total - a.total);
            
            // Pega top 5
            arrDemanda.slice(0, 5).forEach(item => {
                labelsDemanda.push(item.nome);
                dataDemanda.push(item.total);
            });

            new Chart(ctxRanking, {
                type: 'bar',
                plugins: [ChartDataLabels],
                data: {
                    labels: labelsDemanda,
                    datasets: [{
                        label: 'Total de Matrículas Ativas',
                        data: dataDemanda,
                        backgroundColor: '#0F4C3A',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { precision: 0 }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        datalabels: {
                            anchor: 'end',
                            align: 'top',
                            color: '#0F4C3A',
                            font: {
                                weight: 'bold',
                                size: 14
                            },
                            formatter: Math.round
                        }
                    }
                }
            });

            // Chart 2: Taxa de Ocupação (Doughnut Chart)
            const ctxOcupacao = document.getElementById('ocupacaoChart').getContext('2d');
            const vagasLivres = Math.max(0, vagasDisponiveisAtivas - vagasOcupadasAtivas);
            
            new Chart(ctxOcupacao, {
                type: 'doughnut',
                data: {
                    labels: ['Vagas Ocupadas', 'Vagas Livres'],
                    datasets: [{
                        data: [vagasOcupadasAtivas, vagasLivres],
                        backgroundColor: ['#27AE60', '#EAECEF'],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                font: { family: "'Inter', sans-serif", size: 12 }
                            }
                        },
                        datalabels: {
                            display: false // Esconde os rótulos no gráfico de rosca para não ficar poluído
                        }
                    }
                }
            });


        } catch (error) {
            console.error("Erro ao carregar dashboard:", error);
            alertsList.innerHTML = `<p style="color: #E74C3C; text-align:center;">Erro ao processar métricas.</p>`;
        }
    }

    loadDashboardData();
});
