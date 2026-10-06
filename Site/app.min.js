/**
 * ==========================================================================
 * APP.JS - LÓGICA E INTERATIVIDADE
 * Igreja Comunidade Cristã Graça & Vida - One-Page
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initCountdown();
  initAudioPlayer();
  initCellFilters();
  initCellConnectButtons();
  initMinistryFilters();
  initPrayerForm();
  initEventModals();
  initPixCopy();
  initFaqAccordion();
  initDailyVerses();
  initCalendarButtons();
  initInteractiveTimeline();
  initInteractiveDnaPillars();
});

/* ==========================================================================
   1. NAVBAR, SCROLLSPY & MENU MOBILE
   ========================================================================== */
function initNavbar() {
  const header = document.getElementById('main-header');
  const mobileToggle = document.getElementById('mobile-toggle-btn');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link:not(.nav-dropdown-toggle), .dropdown-item');
  const sections = document.querySelectorAll('section[id]');
  const dropdownToggle = document.getElementById('dropdown-toggle-btn');
  const dropdownContainer = document.getElementById('nav-more-dropdown');

  // Efeito de scroll na navbar
  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Scrollspy para destacar o link ativo
    const scrollY = window.pageYOffset + 120;
    sections.forEach(section => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop;
      const sectionId = section.getAttribute('id');

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        document.querySelectorAll('.nav-link').forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }, { passive: true });

  // Toggle do Dropdown "Mais"
  if (dropdownToggle && dropdownContainer) {
    dropdownToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdownContainer.classList.toggle('open');
      dropdownToggle.setAttribute('aria-expanded', isOpen);
    });

    // Fechar dropdown ao clicar fora
    document.addEventListener('click', (e) => {
      if (!dropdownContainer.contains(e.target)) {
        dropdownContainer.classList.remove('open');
        dropdownToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Toggle do menu mobile
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      mobileToggle.setAttribute('aria-expanded', isOpen);
    });

    // Fechar menu mobile e dropdown ao clicar em qualquer link de navegação
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        mobileToggle.setAttribute('aria-expanded', 'false');
        if (dropdownContainer) {
          dropdownContainer.classList.remove('open');
          if (dropdownToggle) dropdownToggle.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  // Tecla Escape para fechar menus
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (dropdownContainer) {
        dropdownContainer.classList.remove('open');
        if (dropdownToggle) dropdownToggle.setAttribute('aria-expanded', 'false');
      }
      if (navMenu) {
        navMenu.classList.remove('open');
        if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
      }
    }
  });
}

/* ==========================================================================
   2. CONTAGEM REGRESSIVA INTELIGENTE PARA O PRÓXIMO CULTO
   ========================================================================== */
function initCountdown() {
  const nextServiceNameEl = document.getElementById('next-service-name');
  const nextServiceTimeTextEl = document.getElementById('next-service-time-text');
  const cdDays = document.getElementById('cd-days');
  const cdHours = document.getElementById('cd-hours');
  const cdMinutes = document.getElementById('cd-minutes');
  const cdSeconds = document.getElementById('cd-seconds');

  if (!cdDays || !cdHours || !cdMinutes || !cdSeconds) return;

  // Horários de Cultos no Templo IEBI:
  // Domingo às 10:00 e Domingo às 18:00
  const schedule = [
    { day: 0, hour: 10, min: 0, name: 'Culto de Celebração (Manhã)' },
    { day: 0, hour: 18, min: 0, name: 'Culto da Família (Noite)' }
  ];

  function formatServiceDate(targetDate) {
    const day = String(targetDate.getDate()).padStart(2, '0');
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const hours = String(targetDate.getHours()).padStart(2, '0');
    const minutes = String(targetDate.getMinutes()).padStart(2, '0');
    return `Domingo, ${day}/${month} às ${hours}:${minutes}`;
  }

  function getNextService() {
    const now = new Date();
    const currentDay = now.getDay();
    let candidateServices = [];

    schedule.forEach(item => {
      let daysUntil = item.day - currentDay;
      if (daysUntil < 0) {
        daysUntil += 7;
      }

      const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntil, item.hour, item.min, 0);

      // Se for hoje, mas o horário já passou, joga para a próxima semana
      if (target <= now) {
        target.setDate(target.getDate() + 7);
      }

      candidateServices.push({
        targetDate: target,
        name: item.name
      });
    });

    // Ordena pelo mais próximo
    candidateServices.sort((a, b) => a.targetDate - b.targetDate);
    return candidateServices[0];
  }

  let nextService = getNextService();
  if (nextServiceNameEl) {
    nextServiceNameEl.textContent = nextService.name;
  }
  if (nextServiceTimeTextEl) {
    nextServiceTimeTextEl.textContent = formatServiceDate(nextService.targetDate);
  }

  function updateTimer() {
    const now = new Date().getTime();
    const difference = nextService.targetDate.getTime() - now;

    if (difference <= 0) {
      nextService = getNextService();
      if (nextServiceNameEl) nextServiceNameEl.textContent = nextService.name;
      if (nextServiceTimeTextEl) nextServiceTimeTextEl.textContent = formatServiceDate(nextService.targetDate);
      return;
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    cdDays.textContent = String(days).padStart(2, '0');
    cdHours.textContent = String(hours).padStart(2, '0');
    cdMinutes.textContent = String(minutes).padStart(2, '0');
    cdSeconds.textContent = String(seconds).padStart(2, '0');
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

/* ==========================================================================
   3. REPRODUTOR DE ÁUDIO INTERATIVO COM SÍNTESE AMBIENTAL
   ========================================================================== */
function initAudioPlayer() {
  const playBtn = document.getElementById('audio-play-btn');
  const playIcon = document.getElementById('play-icon');
  const pauseIcon = document.getElementById('pause-icon');
  const progressBar = document.getElementById('audio-progress-bar');
  const progressFill = document.getElementById('audio-progress-fill');
  const currentTimeEl = document.getElementById('current-audio-time');
  const totalTimeEl = document.getElementById('total-audio-time');
  const statusText = document.getElementById('audio-status-text');
  const loadSermonBtns = document.querySelectorAll('.btn-load-sermon');
  const currentTitleEl = document.getElementById('current-sermon-title');

  let isPlaying = false;
  let currentSeconds = 0;
  let totalSeconds = 34 * 60 + 20; // 34:20
  let interval = null;
  let audioContext = null;
  let synthNodes = [];

  // Gera um som suave e inspirador usando a Web Audio API nativa
  function startPeacefulSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContext) audioContext = new AudioCtx();
      if (audioContext.state === 'suspended') audioContext.resume();

      // Notas da harmonia suave (C, G, A, F em frequências suaves)
      const freqs = [130.81, 164.81, 196.00, 261.63];
      synthNodes = freqs.map(freq => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioContext.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, audioContext.currentTime);

        gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.02, audioContext.currentTime + 2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioContext.destination);

        osc.start();
        return { osc, gain };
      });
    } catch (e) {
      console.log('Audio preview info:', e);
    }
  }

  function stopPeacefulSound() {
    if (synthNodes && synthNodes.length > 0) {
      synthNodes.forEach(({ osc, gain }) => {
        try {
          if (gain && audioContext) {
            gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.5);
            setTimeout(() => osc.stop(), 500);
          } else if (osc) {
            osc.stop();
          }
        } catch (e) {}
      });
      synthNodes = [];
    }
  }

  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function togglePlay() {
    isPlaying = !isPlaying;
    if (isPlaying) {
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'block';
      statusText.textContent = 'Reproduzindo mensagem...';
      startPeacefulSound();

      interval = setInterval(() => {
        if (currentSeconds < totalSeconds) {
          currentSeconds++;
          const percent = (currentSeconds / totalSeconds) * 100;
          progressFill.style.width = `${percent}%`;
          progressBar.setAttribute('aria-valuenow', Math.round(percent));
          currentTimeEl.textContent = formatTime(currentSeconds);
        } else {
          togglePlay();
          currentSeconds = 0;
          progressFill.style.width = '0%';
        }
      }, 1000);
    } else {
      playIcon.style.display = 'block';
      pauseIcon.style.display = 'none';
      statusText.textContent = 'Mensagem pausada';
      stopPeacefulSound();
      clearInterval(interval);
    }
  }

  if (playBtn) {
    playBtn.addEventListener('click', togglePlay);
  }

  if (progressBar) {
    progressBar.addEventListener('click', (e) => {
      const rect = progressBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const percent = Math.max(0, Math.min(1, clickX / width));
      currentSeconds = Math.floor(percent * totalSeconds);
      progressFill.style.width = `${percent * 100}%`;
      progressBar.setAttribute('aria-valuenow', Math.round(percent * 100));
      currentTimeEl.textContent = formatTime(currentSeconds);
    });
  }

  // Carregar sermões alternativos ao clicar em "Ouvir Áudio"
  loadSermonBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const title = btn.dataset.title;
      const speaker = btn.dataset.speaker;
      const duration = btn.dataset.duration;

      if (currentTitleEl) currentTitleEl.textContent = title;
      if (totalTimeEl) totalTimeEl.textContent = duration;

      const parts = duration.split(':');
      totalSeconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
      currentSeconds = 0;
      progressFill.style.width = '0%';
      currentTimeEl.textContent = '00:00';

      // Rola até o player e inicia
      const playerEl = document.getElementById('mensagens');
      if (playerEl) {
        playerEl.scrollIntoView({ behavior: 'smooth' });
      }

      if (!isPlaying) {
        togglePlay();
      } else {
        statusText.textContent = `Reproduzindo: ${title} (${speaker})`;
      }

      showToast(`Carregado: ${title}`);
    });
  });
}

/* ==========================================================================
   4. FILTROS DE CÉLULAS POR FAIXA ETÁRIA
   ========================================================================== */
function initCellFilters() {
  const cellFilterBtns = document.querySelectorAll('.cell-filter-btn');
  const cellCards = document.querySelectorAll('.cell-card');

  cellFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      cellFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.cellFilter;

      cellCards.forEach(card => {
        const category = card.dataset.cellCategory;
        if (filter === 'all' || category === filter) {
          card.style.display = 'flex';
          card.style.opacity = '0';
          setTimeout(() => {
            card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            card.style.opacity = '1';
          }, 20);
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

function initCellConnectButtons() {
  const connectBtns = document.querySelectorAll('.btn-connect-cell');
  const eventModal = document.getElementById('event-modal');
  const eventInputName = document.getElementById('event-input-name');

  connectBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const cellName = btn.dataset.cell || 'Célula IEBI';
      if (eventInputName) {
        eventInputName.value = `Quero Participar: ${cellName}`;
      }
      if (eventModal) {
        eventModal.classList.add('open');
      }
    });
  });
}

/* ==========================================================================
   5. FILTROS DE MINISTÉRIOS
   ========================================================================== */
function initMinistryFilters() {
  const filterBtns = document.querySelectorAll('.ministry-filters .filter-btn:not(.cell-filter-btn)');
  const cards = document.querySelectorAll('.ministry-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      cards.forEach(card => {
        const category = card.dataset.category;
        if (filter === 'all' || category === filter) {
          card.style.display = 'flex';
          card.style.opacity = '0';
          setTimeout(() => {
            card.style.transition = 'opacity 0.3s ease';
            card.style.opacity = '1';
          }, 20);
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* ==========================================================================
   5. FORMULÁRIO DE PEDIDOS DE ORAÇÃO
   ========================================================================== */
function initPrayerForm() {
  const form = document.getElementById('prayer-form');
  const modal = document.getElementById('prayer-modal');
  const closeModal = document.getElementById('close-prayer-modal');
  const confirmBtn = document.getElementById('btn-confirm-prayer-modal');
  const prayerCountDisplay = document.getElementById('prayer-count-display');

  // Inicializa o contador local
  let currentCount = parseInt(localStorage.getItem('igreja_prayer_count') || '1482', 10);
  if (prayerCountDisplay) {
    prayerCountDisplay.textContent = currentCount.toLocaleString('pt-BR');
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('prayer-name').value.trim();
      const phone = document.getElementById('prayer-phone').value.trim();
      const category = document.getElementById('prayer-category').value;
      const message = document.getElementById('prayer-message').value.trim();

      if (!name || !phone || !category || !message) {
        showToast('Por favor, preencha todos os campos obrigatórios.');
        return;
      }

      // Incrementa o contador
      currentCount++;
      localStorage.setItem('igreja_prayer_count', currentCount);
      if (prayerCountDisplay) {
        prayerCountDisplay.textContent = currentCount.toLocaleString('pt-BR');
      }

      // Abre modal de confirmação
      if (modal) {
        modal.classList.add('open');
      }

      form.reset();
    });
  }

  function hideModal() {
    if (modal) modal.classList.remove('open');
  }

  if (closeModal) closeModal.addEventListener('click', hideModal);
  if (confirmBtn) confirmBtn.addEventListener('click', hideModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) hideModal();
    });
  }
}

/* ==========================================================================
   6. MODAL DE INSCRIÇÃO EM EVENTOS
   ========================================================================== */
function initEventModals() {
  const eventModal = document.getElementById('event-modal');
  const closeEventModal = document.getElementById('close-event-modal');
  const eventInputName = document.getElementById('event-input-name');
  const eventForm = document.getElementById('event-registration-form');
  const openButtons = document.querySelectorAll('.btn-open-event-modal');

  openButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const eventName = btn.dataset.eventName || 'Evento Especial';
      const eventDate = btn.dataset.eventDate || '';
      if (eventInputName) {
        eventInputName.value = `${eventName} (${eventDate})`;
      }
      if (eventModal) {
        eventModal.classList.add('open');
      }
    });
  });

  function hideEventModal() {
    if (eventModal) eventModal.classList.remove('open');
  }

  if (closeEventModal) closeEventModal.addEventListener('click', hideEventModal);
  if (eventModal) {
    eventModal.addEventListener('click', (e) => {
      if (e.target === eventModal) hideEventModal();
    });
  }

  if (eventForm) {
    eventForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const userName = document.getElementById('event-input-user-name').value.trim();
      if (!userName) return;

      hideEventModal();
      eventForm.reset();
      showToast(`Inscrição confirmada para ${userName}! Entraremos em contato via WhatsApp.`);
    });
  }
}

/* ==========================================================================
   7. CÓPIA RÁPIDA DA CHAVE PIX (COM 1 CLIQUE)
   ========================================================================== */
function initPixCopy() {
  const copyBtn = document.getElementById('btn-copy-pix');
  const pixKeyVal = document.getElementById('pix-key-val');
  const pixBtnLabel = document.getElementById('pix-btn-label');

  if (copyBtn && pixKeyVal) {
    copyBtn.addEventListener('click', () => {
      const textToCopy = pixKeyVal.textContent.trim();

      navigator.clipboard.writeText(textToCopy).then(() => {
        if (pixBtnLabel) pixBtnLabel.textContent = 'Chave Copiada!';
        copyBtn.style.backgroundColor = '#047857';

        showToast('Chave PIX copiada para a área de transferência!');

        setTimeout(() => {
          if (pixBtnLabel) pixBtnLabel.textContent = 'Copiar Chave PIX';
          copyBtn.style.backgroundColor = '';
        }, 2500);
      }).catch(() => {
        // Fallback clássico
        const tempInput = document.createElement('input');
        tempInput.value = textToCopy;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        showToast('Chave PIX copiada!');
      });
    });
  }
}

/* ==========================================================================
   8. FAQ ACCORDION
   ========================================================================== */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    if (questionBtn && answer) {
      questionBtn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        // Fecha todos os outros
        faqItems.forEach(otherItem => {
          otherItem.classList.remove('active');
          const otherBtn = otherItem.querySelector('.faq-question');
          const otherAnswer = otherItem.querySelector('.faq-answer');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          if (otherAnswer) otherAnswer.style.maxHeight = '0';
        });

        // Alterna o atual
        if (!isActive) {
          item.classList.add('active');
          questionBtn.setAttribute('aria-expanded', 'true');
          answer.style.maxHeight = answer.scrollHeight + 'px';
        }
      });
    }
  });
}

/* ==========================================================================
   9. VERSÍCULOS DO DIA (RANDOMIZADOR)
   ========================================================================== */
function initDailyVerses() {
  const verses = [
    { text: "O Senhor é o meu pastor; nada me faltará. Em verdes pastagens me faz repousar e me conduz a águas tranquilas.", ref: "Salmos 23:1-2" },
    { text: "Porque sou eu que conheço os planos que tenho para vocês, diz o Senhor, planos de fazê-los prosperar e não de causar dano, planos de dar a vocês esperança e um futuro.", ref: "Jeremias 29:11" },
    { text: "Tudo posso naquele que me fortalece.", ref: "Filipenses 4:13" },
    { text: "Venham a mim, todos os que estão cansados e sobrecarregados, e eu darei descanso a vocês.", ref: "Mateus 11:28" },
    { text: "O amor é paciente, o amor é bondoso. Não inveja, não se vangloria, não se orgulha.", ref: "1 Coríntios 13:4" },
    { text: "Lancem sobre ele toda a sua ansiedade, porque ele tem cuidado de vocês.", ref: "1 Pedro 5:7" },
    { text: "Mas os que esperam no Senhor renovarão as suas forças; subirão com asas como águias.", ref: "Isaías 40:31" }
  ];

  const verseTextEl = document.getElementById('daily-verse-display');
  const verseRefEl = document.getElementById('daily-verse-ref-display');
  const newVerseBtn = document.getElementById('btn-new-verse');

  if (newVerseBtn && verseTextEl && verseRefEl) {
    newVerseBtn.addEventListener('click', () => {
      const randomIndex = Math.floor(Math.random() * verses.length);
      const chosen = verses[randomIndex];

      verseTextEl.style.opacity = '0';
      verseRefEl.style.opacity = '0';

      setTimeout(() => {
        verseTextEl.textContent = `"${chosen.text}"`;
        verseRefEl.textContent = chosen.ref;
        verseTextEl.style.transition = 'opacity 0.3s ease';
        verseRefEl.style.transition = 'opacity 0.3s ease';
        verseTextEl.style.opacity = '1';
        verseRefEl.style.opacity = '1';
      }, 200);
    });
  }
}

/* ==========================================================================
   10. BOTÕES DE ADICIONAR AO CALENDÁRIO
   ========================================================================== */
function initCalendarButtons() {
  const calBtns = document.querySelectorAll('.btn-calendar');

  calBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const eventName = btn.dataset.event;
      const day = btn.dataset.day;
      const time = btn.dataset.time;

      const title = encodeURIComponent(`IEBI - ${eventName}`);
      const details = encodeURIComponent(`Culto presencial na IEBI - Igreja Evangélica Batista de Intermares. Horário: ${time}`);
      const location = encodeURIComponent(`IEBI - Igreja Evangélica Batista de Intermares`);

      // Abre link do Google Calendar
      const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
      window.open(googleCalUrl, '_blank', 'noopener,noreferrer');
      showToast(`Abrindo agendamento para ${day} às ${time}`);
    });
  });
}

/* ==========================================================================
   UTILITÁRIO: TOAST NOTIFICATION
   ========================================================================== */
function showToast(message) {
  const toast = document.getElementById('site-toast');
  const toastMessage = document.getElementById('toast-message');

  if (toast && toastMessage) {
    toastMessage.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }
}

/* ==========================================================================
   11. LINHA DO TEMPO INTERATIVA (CARD ÚNICO, STEPPER & DRAG/SWIPE)
   ========================================================================== */
function initInteractiveTimeline() {
  const steps = document.querySelectorAll('.stepper-step');
  const panels = document.querySelectorAll('.timeline-single-panel');
  const progressLine = document.getElementById('timeline-stepper-progress');
  const navBtns = document.querySelectorAll('.btn-timeline-nav');
  const displayContainer = document.querySelector('.timeline-single-display');

  if (!steps.length || !panels.length) return;

  let currentIndex = 0;

  function centerActiveStep(activeStepEl) {
    const stepperContainer = document.querySelector('.timeline-stepper-container');
    if (!stepperContainer || !activeStepEl) return;

    const containerWidth = stepperContainer.clientWidth;
    const stepLeft = activeStepEl.offsetLeft;
    const stepWidth = activeStepEl.offsetWidth;

    // Calcula o scrollLeft exato para manter o ano selecionado no centro da tela no mobile
    const targetScrollLeft = stepLeft - (containerWidth / 2) + (stepWidth / 2);

    stepperContainer.scrollTo({
      left: Math.max(0, targetScrollLeft),
      behavior: 'smooth'
    });
  }

  function activateMilestone(targetPanelId) {
    let targetIndex = 0;
    let activeStepEl = null;

    // 1. Atualiza steps do stepper
    steps.forEach((step, idx) => {
      const isTarget = step.getAttribute('data-target') === targetPanelId;
      step.classList.toggle('active', isTarget);
      step.setAttribute('aria-selected', isTarget);
      if (isTarget) {
        targetIndex = idx;
        activeStepEl = step;
      }
    });

    currentIndex = targetIndex;

    // 2. Centraliza suavemente o ano ativo na tela (especialmente no mobile)
    if (activeStepEl) {
      centerActiveStep(activeStepEl);
    }

    // 3. Atualiza painéis de conteúdo (mostra apenas o card selecionado)
    panels.forEach(panel => {
      const isTarget = panel.getAttribute('id') === targetPanelId;
      panel.classList.toggle('active', isTarget);
    });

    // 4. Atualiza linha de progresso
    if (progressLine && steps.length > 1) {
      const progressPercent = (targetIndex / (steps.length - 1)) * 100;
      progressLine.style.width = `${progressPercent}%`;
    }
  }

  function nextMilestone() {
    const nextIndex = (currentIndex + 1) % steps.length;
    const targetId = steps[nextIndex].getAttribute('data-target');
    if (targetId) activateMilestone(targetId);
  }

  function prevMilestone() {
    const prevIndex = (currentIndex - 1 + steps.length) % steps.length;
    const targetId = steps[prevIndex].getAttribute('data-target');
    if (targetId) activateMilestone(targetId);
  }

  // --- CLIQUES NOS BOTÕES DE CADA ANO NO STEPPER ---
  steps.forEach(step => {
    step.addEventListener('click', () => {
      const targetId = step.getAttribute('data-target');
      if (targetId) {
        activateMilestone(targetId);
      }
    });
  });

  // --- CLIQUES NOS BOTÕES DE NAVEGAÇÃO ANTERIOR / PRÓXIMO ---
  navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const gotoId = btn.getAttribute('data-goto');
      if (gotoId) {
        activateMilestone(gotoId);
      }
    });
  });

  // --- GESTOS DE ARRASTAR (DRAG) & SWIPE (TOUCH) ---
  if (displayContainer) {
    let startX = 0;
    let startY = 0;
    let isDragging = false;
    let hasMoved = false;

    // Mouse Drag (Desktop)
    displayContainer.addEventListener('mousedown', (e) => {
      if (e.target.closest('button') || e.target.closest('a')) return;
      isDragging = true;
      hasMoved = false;
      startX = e.clientX;
      displayContainer.classList.add('grabbing');
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const diffX = e.clientX - startX;
      if (Math.abs(diffX) > 10) {
        hasMoved = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (!isDragging) return;
      isDragging = false;
      displayContainer.classList.remove('grabbing');
      const diffX = e.clientX - startX;
      if (hasMoved && Math.abs(diffX) > 45) {
        if (diffX < 0) {
          nextMilestone();
        } else {
          prevMilestone();
        }
      }
    });

    // Touch Swipe (Mobile / Tablets)
    displayContainer.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
    }, { passive: true });

    displayContainer.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 1) {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const diffX = endX - startX;
        const diffY = endY - startY;

        // Verifica se foi um swipe predominantemente horizontal
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
          if (diffX < 0) {
            nextMilestone();
          } else {
            prevMilestone();
          }
        }
      }
    }, { passive: true });
  }

  // Inicializa obrigatoriamente no ano de 1998
  activateMilestone('panel-1998');
}

/* ==========================================================================
   14. STEPPER & SLIDE INTERATIVO DOS 4 PILARES DA VISÃO CELULAR
   ========================================================================== */
function initInteractiveDnaPillars() {
  const steps = document.querySelectorAll('.dna-stepper-step');
  const panels = document.querySelectorAll('.dna-single-panel');
  const progressLine = document.getElementById('dna-stepper-progress');
  const navBtns = document.querySelectorAll('.btn-dna-nav');
  const displayContainer = document.getElementById('dna-single-display');

  if (!steps.length || !panels.length) return;

  let currentIndex = 0;

  function centerActiveStep(activeStepEl) {
    const stepperContainer = document.querySelector('.dna-stepper-container');
    if (!stepperContainer || !activeStepEl) return;

    const containerWidth = stepperContainer.clientWidth;
    const stepLeft = activeStepEl.offsetLeft;
    const stepWidth = activeStepEl.offsetWidth;

    const targetScrollLeft = stepLeft - (containerWidth / 2) + (stepWidth / 2);

    stepperContainer.scrollTo({
      left: Math.max(0, targetScrollLeft),
      behavior: 'smooth'
    });
  }

  function activatePillar(targetPanelId) {
    let targetIndex = 0;
    let activeStepEl = null;

    // 1. Atualiza steps do stepper
    steps.forEach((step, idx) => {
      const isTarget = step.getAttribute('data-target') === targetPanelId;
      step.classList.toggle('active', isTarget);
      step.setAttribute('aria-selected', isTarget);
      if (isTarget) {
        targetIndex = idx;
        activeStepEl = step;
      }
    });

    currentIndex = targetIndex;

    // 2. Centraliza suavemente o pilar ativo na tela (mobile)
    if (activeStepEl) {
      centerActiveStep(activeStepEl);
    }

    // 3. Atualiza painéis de exibição
    panels.forEach(panel => {
      const isTarget = panel.getAttribute('id') === targetPanelId;
      panel.classList.toggle('active', isTarget);
    });

    // 4. Atualiza linha de progresso
    if (progressLine && steps.length > 1) {
      const progressPercent = (targetIndex / (steps.length - 1)) * 100;
      progressLine.style.width = `${progressPercent}%`;
    }
  }

  function nextPillar() {
    const nextIndex = (currentIndex + 1) % steps.length;
    const targetId = steps[nextIndex].getAttribute('data-target');
    if (targetId) activatePillar(targetId);
  }

  function prevPillar() {
    const prevIndex = (currentIndex - 1 + steps.length) % steps.length;
    const targetId = steps[prevIndex].getAttribute('data-target');
    if (targetId) activatePillar(targetId);
  }

  // --- Cliques nos passos do stepper ---
  steps.forEach(step => {
    step.addEventListener('click', () => {
      const targetId = step.getAttribute('data-target');
      if (targetId) activatePillar(targetId);
    });
  });

  // --- Cliques nos botões de navegação anterior / próximo ---
  navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const gotoId = btn.getAttribute('data-goto');
      if (gotoId) activatePillar(gotoId);
    });
  });

  // --- Gestos de Arrastar (Drag) & Swipe (Touch) ---
  if (displayContainer) {
    let startX = 0;
    let startY = 0;
    let isDragging = false;
    let hasMoved = false;

    // Mouse Drag (Desktop)
    displayContainer.addEventListener('mousedown', (e) => {
      if (e.target.closest('button') || e.target.closest('a')) return;
      isDragging = true;
      hasMoved = false;
      startX = e.clientX;
      displayContainer.classList.add('grabbing');
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const diffX = e.clientX - startX;
      if (Math.abs(diffX) > 10) {
        hasMoved = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (!isDragging) return;
      isDragging = false;
      displayContainer.classList.remove('grabbing');
      const diffX = e.clientX - startX;
      if (hasMoved && Math.abs(diffX) > 45) {
        if (diffX < 0) {
          nextPillar();
        } else {
          prevPillar();
        }
      }
    });

    // Touch Swipe (Mobile / Tablets)
    displayContainer.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
    }, { passive: true });

    displayContainer.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 1) {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const diffX = endX - startX;
        const diffY = endY - startY;

        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
          if (diffX < 0) {
            nextPillar();
          } else {
            prevPillar();
          }
        }
      }
    }, { passive: true });
  }

  // Inicializa obrigatoriamente no 1º pilar (Ganhar)
  activatePillar('dna-panel-ganhar');
}


