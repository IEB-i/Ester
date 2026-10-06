import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC31C1X13eqVAOq_o5K2evI8q3GOfnpOpo",
    authDomain: "iebi-2e84e.firebaseapp.com",
    projectId: "iebi-2e84e",
    storageBucket: "iebi-2e84e.firebasestorage.app",
    messagingSenderId: "634456198202",
    appId: "1:634456198202:web:8b4de1b4def23a49303903"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', async () => {
    const eventsGrid = document.getElementById('events-wrapper') || document.querySelector('.events-grid');
    if (!eventsGrid) return;
    
    // Mostra um estado de carregamento
    eventsGrid.innerHTML = '<p style="grid-column: 1 / -1; width: 100%; text-align: center; color: var(--text-muted);">Carregando eventos...</p>';

    try {
        const calendarioRef = collection(db, 'igrejas', 'iebi', 'calendario');
        const q = query(calendarioRef, where('exibir_site', '==', true));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            eventsGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--text-muted);">Nenhum evento em destaque no momento.</p>';
            return;
        }

        let htmlContent = '';
        const meses = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
        const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
        const eventsArray = [];
        
        // Obtém a data de hoje no formato YYYY-MM-DD considerando fuso local
        const today = new Date();
        const todayStr = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

        querySnapshot.forEach(docSnap => {
            const data = docSnap.data();
            
            let maxDate = '0000-00-00';
            if (data.datas && Array.isArray(data.datas) && data.datas.length > 0) {
                data.datas.forEach(d => {
                    if (d.date && d.date > maxDate) maxDate = d.date;
                });
            } else {
                maxDate = data.endDate || data.date || '9999-12-31';
            }
            
            // Tenta converter a maxDate para objeto Date para comparação segura
            let isPast = false;
            if (maxDate !== '9999-12-31') {
                let cleanDate = maxDate;
                if (maxDate.includes('/')) {
                    const parts = maxDate.split('/');
                    if (parts[0].length === 2) cleanDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
                const eventDate = new Date(cleanDate + 'T00:00:00');
                if (!isNaN(eventDate) && eventDate < new Date(todayStr + 'T00:00:00')) {
                    isPast = true;
                }
            }
            
            // Adiciona apenas se a data final do evento for maior ou igual a hoje
            if (!isPast) {
                eventsArray.push(data);
            }
        });

        if (eventsArray.length === 0) {
            eventsGrid.innerHTML = '<p style="grid-column: 1 / -1; width: 100%; text-align: center; color: var(--text-muted);">Nenhum evento futuro programado.</p>';
            return;
        }

        eventsArray.sort((a, b) => {
            const dateA = (a.datas && a.datas.length > 0 && a.datas[0].date) ? a.datas[0].date : (a.date || '9999-12-31');
            const dateB = (b.datas && b.datas.length > 0 && b.datas[0].date) ? b.datas[0].date : (b.date || '9999-12-31');
            return dateA.localeCompare(dateB);
        });

        // Publish to global scope for the countdown widget
        window.siteEventsData = eventsArray;
        window.dispatchEvent(new Event('siteEventsLoaded'));

        eventsArray.forEach(data => {
            
            // Formatando data
            let dia = "00";
            let mesAbrev = "MÊS";
            let diaSemanaExtenso = "";
            let dataStrExibicao = "";
            
            if (data.date) {
                const d = new Date(data.date + 'T00:00:00');
                if (!isNaN(d)) {
                    dia = String(d.getDate()).padStart(2, '0');
                    mesAbrev = meses[d.getMonth()];
                    diaSemanaExtenso = diasSemana[d.getDay()];
                    
                    if (data.endDate && data.endDate !== data.date) {
                        const dEnd = new Date(data.endDate + 'T00:00:00');
                        if (!isNaN(dEnd)) {
                            diaSemanaExtenso += ` & ${diasSemana[dEnd.getDay()]}`;
                            dataStrExibicao = `${dia} e ${String(dEnd.getDate()).padStart(2, '0')} de ${dEnd.toLocaleString('pt-BR', { month: 'long' })}`;
                        }
                    } else {
                        dataStrExibicao = `${dia} de ${d.toLocaleString('pt-BR', { month: 'long' })}`;
                    }
                }
            }
            
            const tag = data.site_tag || 'Evento';
            const location = data.site_location || '';
            const extraInfo = data.site_extra_info || '';
            const btnText = data.site_btn_text || 'Quero Participar';
            const cor = data.color || 'var(--primary)';

            let eventTitle = data.title || '';
            eventTitle = eventTitle.replace(/^(\[?\d{2}[:h]\d{2}\]?\s*(?:-\s*)?)/i, '').trim();

            let detailsHtml = '';
            
            if (data.datas && Array.isArray(data.datas) && data.datas.length > 0) {
                data.datas.forEach(item => {
                    if (!item.date) return;
                    const dItem = new Date(item.date + 'T00:00:00');
                    if (isNaN(dItem)) return;
                    const dStr = `${String(dItem.getDate()).padStart(2, '0')}/${String(dItem.getMonth() + 1).padStart(2, '0')}/${dItem.getFullYear()}`;
                    const diaSem = diasSemana[dItem.getDay()];
                    const horaStr = item.time ? ` às ${item.time}` : '';
                    
                    detailsHtml += `
                    <div class="event-detail-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      ${diaSem}, ${dStr}${horaStr}
                    </div>`;
                });
                
                if (location) {
                    detailsHtml += `
                    <div class="event-detail-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      Local: ${location}
                    </div>`;
                }
            } else {
                let datePart = '';
                if (data.date) {
                    const d = new Date(data.date + 'T00:00:00');
                    if (!isNaN(d)) {
                        datePart = `${diasSemana[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                    }
                }
                
                if (datePart || data.hora_inicio || data.hora_fim) {
                    const horaStr = data.hora_inicio && data.hora_fim ? `Das ${data.hora_inicio} às ${data.hora_fim}` : (data.hora_inicio || data.hora_fim ? `às ${data.hora_inicio || data.hora_fim}` : '');
                    const textToShow = [datePart, horaStr].filter(Boolean).join(' ');
                    
                    detailsHtml += `
                    <div class="event-detail-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      ${textToShow}
                    </div>`;
                }
                
                if (location) {
                    detailsHtml += `
                    <div class="event-detail-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      Local: ${location}
                    </div>`;
                }
            }

            if (extraInfo) {
                detailsHtml += `
                <div class="event-detail-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  ${extraInfo}
                </div>`;
            }

            let buttonHtml = '';
            if (data.site_link) {
                buttonHtml = `
                <a href="${data.site_link}" target="_blank" class="btn btn-primary btn-sm" style="background: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), ${cor}; border-color: ${cor}; text-decoration: none; text-align: center; display: inline-flex; align-items: center; justify-content: center;">
                  ${btnText} <i class="ph ph-arrow-square-out" style="margin-left: 6px;"></i>
                </a>`;
            } else {
                buttonHtml = `
                <button class="btn btn-primary btn-sm btn-open-event-modal" style="background: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), ${cor}; border-color: ${cor};"
                  data-event-name="${eventTitle}" data-event-date="${dataStrExibicao}">
                  ${btnText}
                </button>`;
            }

            htmlContent += `
            <div class="swiper-slide">
              <div class="event-card">
                <div class="event-header-strip" style="background: linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.35)), ${cor};">
                  <div class="event-date-badge">
                    <span class="event-date-day">${dia}</span>
                    <div class="event-date-month">
                      <span>${mesAbrev}</span><br>
                      <small>${diaSemanaExtenso}</small>
                    </div>
                  </div>
                  <span class="event-status-tag">${tag}</span>
                </div>
                <div class="event-body">
                  <h3 class="event-title" style="color: ${cor};">${eventTitle}</h3>
                  <p class="event-desc">${data.description}</p>
                  <div class="event-details-list">
                    ${detailsHtml}
                  </div>
                  ${buttonHtml}
                </div>
              </div>
            </div>`;
        });
        
        eventsGrid.innerHTML = htmlContent;
        
        if (typeof window.initEventModals === 'function') {
            window.initEventModals();
        }

        // Initialize Swiper
        if (eventsArray.length > 0 && typeof Swiper !== 'undefined') {
            new Swiper('.events-swiper', {
                slidesPerView: 1.2,
                centeredSlides: true,
                spaceBetween: 16,
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                },
                autoplay: {
                    delay: 4000,
                    disableOnInteraction: false,
                },
                breakpoints: {
                    768: { 
                        slidesPerView: 2,
                        centeredSlides: false,
                        spaceBetween: 20
                    },
                    1024: { 
                        slidesPerView: 3,
                        centeredSlides: false,
                        spaceBetween: 20
                    }
                }
            });
        }

    } catch (error) {
        console.error("Erro ao carregar eventos do site:", error);
        eventsGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #dc2626;">Não foi possível carregar os eventos no momento.</p>';
    }
});
