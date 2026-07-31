import { db, collection, addDoc, doc, updateDoc } from './firebase.js';
import { getDocs, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    const calendarEl = document.getElementById('calendar');
    const modal = document.getElementById('eventModal');
    const form = document.getElementById('eventForm');
    const eventTitleInput = document.getElementById('eventTitle');
    const eventDateInput = document.getElementById('eventDate');
    const eventEndDateInput = document.getElementById('eventEndDate');
    const eventStartTimeInput = document.getElementById('eventStartTime');
    const eventEndTimeInput = document.getElementById('eventEndTime');
    const eventDescriptionInput = document.getElementById('eventDescription');
    const eventPinnedInput = document.getElementById('eventPinned');
    const saveBtn = document.getElementById('saveEventBtn');
    const deleteBtn = document.getElementById('deleteEventBtn');
    const modalHeaderTitle = document.getElementById('modalHeaderTitle');
    const openModalBtn = document.getElementById('openModalBtn');
    const openModalBtnFAB = document.getElementById('openModalBtnFAB');
    const btnTypeAgenda = document.getElementById('btnTypeAgenda');
    const btnTypeAviso = document.getElementById('btnTypeAviso');

    let calendar;
    let todosEventos = [];
    let eventoEmEdicaoId = null;
    let eventoEmEdicaoTipo = 'Evento';
    let publicationType = 'Agenda'; // 'Agenda' ou 'Aviso'

    // Alternar Tipo de Publicação (Agenda vs Aviso)
    if (btnTypeAgenda && btnTypeAviso) {
        btnTypeAgenda.addEventListener('click', () => {
            publicationType = 'Agenda';
            btnTypeAgenda.classList.add('active');
            btnTypeAviso.classList.remove('active');
        });

        btnTypeAviso.addEventListener('click', () => {
            publicationType = 'Aviso';
            btnTypeAviso.classList.add('active');
            btnTypeAgenda.classList.remove('active');
        });
    }

    // Fechar Modal
    function closeModal() {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        eventoEmEdicaoId = null;
    }

    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('cancelModalBtn').addEventListener('click', closeModal);
    window.addEventListener('click', (e) => { if(e.target === modal) closeModal(); });

    // Abrir Modal de Nova Publicação
    function openModalNovo(dateStr = null) {
        form.reset();
        eventoEmEdicaoId = null;
        eventoEmEdicaoTipo = 'Evento';
        publicationType = 'Agenda';
        btnTypeAgenda.classList.add('active');
        btnTypeAviso.classList.remove('active');

        modalHeaderTitle.innerHTML = '<i class="ph ph-calendar-plus"></i> Nova Publicação';
        
        const today = dateStr || new Date().toISOString().split('T')[0];
        eventDateInput.value = today;
        eventEndDateInput.value = '';
        eventStartTimeInput.value = '19:30';
        eventEndTimeInput.value = '21:00';
        deleteBtn.style.display = 'none';
        modal.style.display = 'flex';
        document.body.classList.add('modal-open');
    }

    // Função Unificada para Abrir Modal de Edição/Exclusão
    function abrirModalParaEditar(ev) {
        form.reset();
        eventoEmEdicaoId = ev.id;
        eventoEmEdicaoTipo = ev.tipo || 'Evento';

        publicationType = ev.isAviso ? 'Aviso' : 'Agenda';
        if (publicationType === 'Aviso') {
            btnTypeAviso.classList.add('active');
            btnTypeAgenda.classList.remove('active');
        } else {
            btnTypeAgenda.classList.add('active');
            btnTypeAviso.classList.remove('active');
        }
        
        modalHeaderTitle.innerHTML = '<i class="ph ph-pencil-simple"></i> Editar Publicação';
        eventTitleInput.value = ev.title || ev.titulo || '';
        
        const dateVal = ev.start || ev.date;
        if (dateVal) {
            eventDateInput.value = typeof dateVal === 'string' ? dateVal : new Date(dateVal.getTime() - (dateVal.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        }

        const endVal = ev.end || ev.endDate;
        if (endVal) {
            eventEndDateInput.value = typeof endVal === 'string' ? endVal : new Date(endVal.getTime() - (endVal.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        } else {
            eventEndDateInput.value = '';
        }

        eventStartTimeInput.value = ev.hora_inicio || '19:30';
        eventEndTimeInput.value = ev.hora_fim || '21:00';
        eventDescriptionInput.value = ev.description || ev.conteudo || '';
        eventPinnedInput.checked = !!ev.fixado;
        
        const eventColor = ev.color || '#2760AE';
        const colorInput = document.querySelector(`input[name="eventColor"][value="${eventColor.toUpperCase()}"]`) || document.querySelector(`input[name="eventColor"][value="${eventColor}"]`);
        if (colorInput) colorInput.checked = true;
        
        deleteBtn.style.display = 'inline-flex';
        modal.style.display = 'flex';
        document.body.classList.add('modal-open');
    }

    if (openModalBtn) openModalBtn.addEventListener('click', () => openModalNovo());
    if (openModalBtnFAB) openModalBtnFAB.addEventListener('click', () => openModalNovo());

    function formatDataOffset(daysOffset) {
        const d = new Date();
        d.setDate(d.getDate() + daysOffset);
        return d.toISOString().split('T')[0];
    }

    // 1. Buscar os Eventos do Firebase
    async function carregarEventos() {
        todosEventos = [];
        try {
            const calendarioRef = collection(db, 'igrejas', 'iebi', 'calendario');
            const querySnapshot = await getDocs(calendarioRef);
            
            if (querySnapshot.empty) {
                const eventosIniciais = [
                    { title: "VIGÍLIA DE ORAÇÃO & LOUVOR", date: formatDataOffset(0), hora_inicio: "22:00", hora_fim: "00:00", color: "#8E44AD", tipo: "Evento" },
                    { title: "CULTO DOMINICAL DE CELEBRAÇÃO", date: formatDataOffset(2), hora_inicio: "18:00", hora_fim: "20:00", color: "#2760AE", tipo: "Evento" },
                    { title: "JIU - JITSU & ESPORTE IEBI", date: formatDataOffset(3), hora_inicio: "19:30", hora_fim: "21:00", color: "#27AE60", tipo: "Evento" },
                    { title: "REUNIÃO DE CÉLULA ADULTOS", date: formatDataOffset(5), hora_inicio: "20:00", hora_fim: "21:30", color: "#27AE60", tipo: "Evento" },
                    { title: "ENSAIO DO MINISTÉRIO DE LOUVOR", date: formatDataOffset(6), hora_inicio: "19:30", hora_fim: "21:30", color: "#E74C3C", tipo: "Evento" },
                    { title: "ESCOLA BÍBLICA MODULAR", date: formatDataOffset(8), hora_inicio: "09:00", hora_fim: "11:00", color: "#E74C3C", tipo: "Aula" }
                ];

                for (const ev of eventosIniciais) {
                    await addDoc(calendarioRef, { ...ev, criado_em: serverTimestamp() });
                }
                return carregarEventos();
            }

            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const horaFormatada = data.hora_inicio ? `[${data.hora_inicio}] ` : '';
                todosEventos.push({
                    id: docSnap.id,
                    title: `${horaFormatada}${data.title}`,
                    start: data.date,
                    end: data.endDate || null,
                    color: data.color || '#2760AE',
                    tipo: data.tipo || 'Evento',
                    hora_inicio: data.hora_inicio || '',
                    hora_fim: data.hora_fim || '',
                    description: data.description || '',
                    fixado: !!data.fixado
                });
            });

            // Buscar Aulas
            try {
                const aulasRef = collection(db, 'igrejas', 'iebi', 'aulas');
                const aulasSnap = await getDocs(aulasRef);
                aulasSnap.forEach((docSnap) => {
                    const data = docSnap.data();
                    const horaFormatada = data.hora_inicio ? `[${data.hora_inicio}] ` : '';
                    todosEventos.push({
                        id: docSnap.id,
                        title: `${horaFormatada}${data.title || 'Aula'}`,
                        start: data.date || data.data_aula,
                        color: data.color || '#E74C3C',
                        tipo: data.tipo || 'Aula',
                        hora_inicio: data.hora_inicio || '',
                        hora_fim: data.hora_fim || '',
                        turmaId: data.turmaId
                    });
                });
            } catch(e) {}

        } catch (error) {
            console.error("Erro ao carregar eventos:", error);
        }
    }

    function getEventosFiltrados() {
        const checkboxesAtivos = Array.from(document.querySelectorAll('.filter-checkbox:checked')).map(cb => cb.value.toUpperCase());
        return todosEventos.filter(ev => checkboxesAtivos.includes((ev.color || '').toUpperCase()));
    }

    document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            if (!calendar) return;
            calendar.removeAllEvents();
            calendar.addEventSource(getEventosFiltrados());
        });
    });

    // 2. Inicializar o Calendário
    async function inicializarCalendario() {
        await carregarEventos();

        const isMobile = window.innerWidth <= 768;

        calendar = new FullCalendar.Calendar(calendarEl, {
            locale: 'pt-br',
            views: {
                listUpcoming: {
                    type: 'list',
                    duration: { days: 15 },
                    buttonText: 'Agenda'
                }
            },
            initialView: 'listUpcoming',
            nowIndicator: true,
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: isMobile ? 'listUpcoming,dayGridMonth' : 'listUpcoming,dayGridMonth,timeGridWeek'
            },
            buttonText: {
                today: 'Hoje',
                month: 'Mês',
                week: 'Semana'
            },
            titleFormat: { year: 'numeric', month: isMobile ? 'short' : 'long' },
            dayHeaderFormat: { weekday: 'short' },
            height: 'auto',
            aspectRatio: isMobile ? 0.75 : 1.35,
            dayMaxEvents: isMobile ? 2 : 4,
            events: getEventosFiltrados(),
            selectable: true,
            eventDisplay: 'block',
            
            eventContent: function(arg) {
                if (arg.view.type.startsWith('list')) {
                    return true;
                }
                const cor = arg.event.backgroundColor || arg.event.extendedProps.color || '#2760AE';
                const titulo = arg.event.title || 'Sem título';
                return {
                    html: `<div class="google-agenda-pill" style="background-color: ${cor};">${titulo}</div>`
                };
            },
            
            dateClick: function(info) {
                openModalNovo(info.dateStr);
            },
            
            eventClick: function(info) {
                if (info.jsEvent) info.jsEvent.preventDefault();
                const matchedEvent = todosEventos.find(e => e.id === info.event.id) || {
                    id: info.event.id,
                    title: info.event.title,
                    start: info.event.start,
                    end: info.event.end,
                    color: info.event.backgroundColor || info.event.extendedProps?.color,
                    tipo: info.event.extendedProps?.tipo,
                    hora_inicio: info.event.extendedProps?.hora_inicio,
                    hora_fim: info.event.extendedProps?.hora_fim
                };
                abrirModalParaEditar(matchedEvent);
            }
        });
        
        calendar.render();

        calendarEl.addEventListener('click', (e) => {
            const eventTarget = e.target.closest('.fc-list-event, .fc-daygrid-event, .fc-event');
            if (eventTarget) {
                const titleNode = eventTarget.querySelector('.fc-list-event-title, .google-agenda-pill, .fc-event-title');
                if (titleNode) {
                    const txt = titleNode.textContent.trim();
                    const matched = todosEventos.find(ev => (ev.title || '').trim() === txt || (ev.title || '').trim().includes(txt));
                    if (matched) {
                        abrirModalParaEditar(matched);
                    }
                }
            }
        });
    }

    // 3. Salvar / Editar no Firebase (Agenda ou Aviso)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Salvando...';
        saveBtn.disabled = true;

        const colorInput = document.querySelector('input[name="eventColor"]:checked');
        const colorValue = colorInput ? colorInput.value : '#2760AE';

        let autorName = 'Secretaria IEBI';
        try {
            const u = JSON.parse(sessionStorage.getItem('authenticated_user') || localStorage.getItem('authenticated_user') || '{}');
            if (u.nome) autorName = u.nome;
        } catch(err) {}

        const tituloLimpo = eventTitleInput.value.trim();
        const horaInicio = eventStartTimeInput.value || '';
        const horaFim = eventEndTimeInput.value || '';
        const dataInicio = eventDateInput.value;
        const dataFim = eventEndDateInput.value || null;
        const descricao = eventDescriptionInput.value.trim();
        const fixado = eventPinnedInput.checked;

        try {
            if (publicationType === 'Aviso') {
                const avisosRef = collection(db, "igrejas", "iebi", "avisos");
                await addDoc(avisosRef, {
                    titulo: tituloLimpo,
                    categoria: 'Geral',
                    cor: colorValue,
                    conteudo: descricao || `Compromisso agendado para o dia ${dataInicio} às ${horaInicio}`,
                    fixado,
                    autor: autorName,
                    hora_inicio: horaInicio,
                    hora_fim: horaFim,
                    criado_em: serverTimestamp()
                });
            }

            // Sempre salva / atualiza na Agenda
            const novoEvento = {
                title: tituloLimpo,
                date: dataInicio,
                endDate: dataFim,
                hora_inicio: horaInicio,
                hora_fim: horaFim,
                color: colorValue,
                description: descricao,
                fixado,
                tipo: 'Evento'
            };

            if (eventoEmEdicaoId) {
                const colName = eventoEmEdicaoTipo === 'Aula' ? 'aulas' : 'calendario';
                const docRef = doc(db, 'igrejas', 'iebi', colName, eventoEmEdicaoId);
                await updateDoc(docRef, novoEvento);
            } else {
                const calendarioRef = collection(db, 'igrejas', 'iebi', 'calendario');
                await addDoc(calendarioRef, { ...novoEvento, criado_em: serverTimestamp() });
            }

            await carregarEventos();
            calendar.removeAllEvents();
            calendar.addEventSource(getEventosFiltrados());
            closeModal();

        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Erro ao salvar. Verifique sua conexão.");
        } finally {
            saveBtn.innerHTML = '<i class="ph ph-floppy-disk"></i> Salvar';
            saveBtn.disabled = false;
        }
    });

    // 4. Excluir Publicação
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (!eventoEmEdicaoId) return;
            if (confirm("Tem certeza que deseja excluir permanentemente esta publicação?")) {
                try {
                    deleteBtn.disabled = true;
                    deleteBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Excluindo...';

                    const colName = eventoEmEdicaoTipo === 'Aula' ? 'aulas' : 'calendario';
                    const docRef = doc(db, 'igrejas', 'iebi', colName, eventoEmEdicaoId);
                    await deleteDoc(docRef);

                    await carregarEventos();
                    calendar.removeAllEvents();
                    calendar.addEventSource(getEventosFiltrados());
                    closeModal();
                } catch(e) {
                    console.error("Erro ao excluir:", e);
                    alert("Erro ao excluir publicação.");
                } finally {
                    deleteBtn.disabled = false;
                    deleteBtn.innerHTML = '<i class="ph ph-trash"></i> Excluir';
                }
            }
        });
    }

    inicializarCalendario();
});
