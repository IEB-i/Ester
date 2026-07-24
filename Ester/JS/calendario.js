import { db, collection, addDoc, doc, updateDoc } from './firebase.js';
import { getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    const calendarEl = document.getElementById('calendar');
    const modal = document.getElementById('eventModal');
    const form = document.getElementById('eventForm');
    const eventDateInput = document.getElementById('eventDate');
    const saveBtn = document.getElementById('saveEventBtn');
    
    let calendar; // Variável global para armazenar a instância do calendário
    let todosEventos = []; // Armazena todos os eventos do banco
    let eventoEmEdicaoId = null; // Armazena o ID do evento em edição, se houver

    // Fechar Modal
    document.getElementById('closeModalBtn').addEventListener('click', () => modal.style.display = 'none');
    document.getElementById('cancelModalBtn').addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => { if(e.target === modal) modal.style.display = 'none'; });

    // Abrir Modal pelo botão "+ Criar" (coloca data atual)
    const openModalBtn = document.getElementById('openModalBtn');
    if(openModalBtn) {
        openModalBtn.addEventListener('click', () => {
            const today = new Date().toISOString().split('T')[0];
            form.reset();
            eventoEmEdicaoId = null;
            document.querySelector('.modal-header h3').textContent = 'Adicionar Evento';
            eventDateInput.value = today;
            modal.style.display = 'flex';
        });
    }

    // 1. Buscar os Eventos do Firebase
    async function carregarEventos() {
        todosEventos = [];
        try {
            const calendarioRef = collection(db, 'igrejas', 'iebi', 'calendario');
            const querySnapshot = await getDocs(calendarioRef);
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                todosEventos.push({
                    id: doc.id,
                    title: data.title,
                    start: data.date,
                    color: data.color || '#27AE60',
                    tipo: data.tipo || 'Evento'
                });
            });

            // Buscar Aulas
            const aulasRef = collection(db, 'igrejas', 'iebi', 'aulas');
            const aulasSnap = await getDocs(aulasRef);
            
            aulasSnap.forEach((doc) => {
                const data = doc.data();
                todosEventos.push({
                    id: doc.id,
                    title: data.title || 'Aula',
                    start: data.date || data.data_aula,
                    color: data.color || '#27AE60',
                    tipo: data.tipo || 'Aula',
                    turmaId: data.turmaId
                });
            });
        } catch (error) {
            console.error("Erro ao carregar eventos:", error);
        }
    }

    // Função para pegar eventos baseados nos checkboxes
    function getEventosFiltrados() {
        const checkboxesAtivos = Array.from(document.querySelectorAll('.filter-checkbox:checked')).map(cb => cb.value.toUpperCase());
        return todosEventos.filter(ev => checkboxesAtivos.includes(ev.color.toUpperCase()));
    }

    // Atualiza o calendário quando um checkbox muda
    document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            if(!calendar) return;
            // Remove as fontes atuais e adiciona a nova lista filtrada
            calendar.removeAllEvents();
            calendar.addEventSource(getEventosFiltrados());
        });
    });

    // 2. Inicializar o Calendário
    async function inicializarCalendario() {
        await carregarEventos();

        calendar = new FullCalendar.Calendar(calendarEl, {
            locale: 'pt-br',
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: '' // Removidos os botões Mês/Semana/Dia para deixar igual Google
            },
            buttonText: {
                today: 'Hoje'
            },
            height: 'calc(100vh - 210px)', // Ajustado fino para não passar da tela
            events: getEventosFiltrados(), // Eventos já filtrados
            selectable: true,
            eventDisplay: 'block',
            
            // Renderiza o texto com a barra colorida na lateral esquerda
            eventContent: function(arg) {
                const cor = arg.event.backgroundColor || arg.event.extendedProps.color || '#27AE60';
                return {
                    html: `<div style="border-left: 4px solid ${cor}; padding-left: 6px; padding-top: 2px; padding-bottom: 2px; color: var(--text-main); font-weight: 600; font-size: 0.85em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${arg.event.title}
                    </div>`
                };
            },
            
            // Quando clica num dia em branco:
            dateClick: function(info) {
                // Limpa o formulário e abre o modal
                form.reset();
                eventoEmEdicaoId = null;
                document.querySelector('.modal-header h3').textContent = 'Adicionar Evento';
                // Preenche o input de data escondido no modal com a data clicada
                eventDateInput.value = info.dateStr;
                modal.style.display = 'flex';
            },
            
            // Quando clica num evento existente:
            eventClick: function(info) {
                // Verificar se é Aula gerada automaticamente
                if(info.event.extendedProps && info.event.extendedProps.tipo === 'Aula') {
                    alert("O Diário de Frequência para esta aula será implementado na próxima fase. Por enquanto, a edição de datas da aula deve ser feita direto na Turma.");
                    return;
                }

                form.reset();
                eventoEmEdicaoId = info.event.id;
                document.querySelector('.modal-header h3').textContent = 'Editar Evento';
                document.getElementById('eventTitle').value = info.event.title;
                
                // Formata a data (info.event.start pode ser um objeto Date)
                if (info.event.start) {
                    const eventDate = info.event.start;
                    const dateString = new Date(eventDate.getTime() - (eventDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                    eventDateInput.value = dateString;
                }
                
                // Seleciona a cor correta
                const eventColor = info.event.backgroundColor || info.event.extendedProps.color;
                if (eventColor) {
                    // Busca a cor em letras maiúsculas para comparar com os values do form
                    const colorInput = document.querySelector(`input[name="eventColor"][value="${eventColor.toUpperCase()}"]`) || document.querySelector(`input[name="eventColor"][value="${eventColor}"]`);
                    if(colorInput) colorInput.checked = true;
                }
                
                modal.style.display = 'flex';
            }
        });
        
        calendar.render();
    }

    // 3. Salvar novo Evento no Firebase
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Salvando...';
        saveBtn.disabled = true;

        const colorInput = document.querySelector('input[name="eventColor"]:checked');
        const colorValue = colorInput ? colorInput.value : '#27AE60';

        const novoEvento = {
            title: document.getElementById('eventTitle').value,
            date: document.getElementById('eventDate').value,
            color: colorValue
        };

        try {
            if (eventoEmEdicaoId) {
                const docRef = doc(db, 'igrejas', 'iebi', 'calendario', eventoEmEdicaoId);
                await updateDoc(docRef, novoEvento);
                
                // Atualiza visualmente
                let event = calendar.getEventById(eventoEmEdicaoId);
                if (event) {
                    event.setProp('title', novoEvento.title);
                    event.setStart(novoEvento.date);
                    event.setProp('backgroundColor', novoEvento.color);
                    event.setProp('borderColor', novoEvento.color);
                    
                    // Como redefinimos as fontes e a forma de renderizar eventos,
                    // precisamos atualizar a array todosEventos para filtros continuarem funcionando
                    const eventIndex = todosEventos.findIndex(e => e.id === eventoEmEdicaoId);
                    if (eventIndex !== -1) {
                        todosEventos[eventIndex].title = novoEvento.title;
                        todosEventos[eventIndex].start = novoEvento.date;
                        todosEventos[eventIndex].color = novoEvento.color;
                    }
                }
            } else {
                const calendarioRef = collection(db, 'igrejas', 'iebi', 'calendario');
                const docRef = await addDoc(calendarioRef, novoEvento);
                
                // Atualiza a array local
                todosEventos.push({
                    id: docRef.id,
                    title: novoEvento.title,
                    start: novoEvento.date,
                    color: novoEvento.color
                });
                
                // Adicionar visualmente no calendário sem precisar recarregar a página
                calendar.addEvent({
                    id: docRef.id,
                    title: novoEvento.title,
                    start: novoEvento.date,
                    color: novoEvento.color
                });
            }

            modal.style.display = 'none';
        } catch (error) {
            console.error("Erro ao salvar evento:", error);
            alert("Erro ao salvar evento. Tente novamente.");
        } finally {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
        }
    });

    // Iniciar tudo
    inicializarCalendario();
});
