import { db } from './firebase.js';
import { collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

export function limparTelefone(telefone) {
  if (!telefone) return '';
  return String(telefone).replace(/\D/g, '').trim();
}

export function formatarMascaraTelefone(valor) {
  const d = limparTelefone(valor).slice(0, 11);
  const n = d.length;
  if (n === 0) return '';
  if (n <= 2) return `(${d}`;
  if (n <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7,11)}`;
}

document.addEventListener('DOMContentLoaded', () => {

  const form         = document.getElementById('loginForm');
  const telefoneInput = document.getElementById('telefoneInput');
  const pinInput     = document.getElementById('pinInput');
  const phoneCounter = document.getElementById('phoneCounter');
  const btnSubmit    = document.getElementById('btnKeypadEnter');
  const loginAlert   = document.getElementById('loginAlert');
  const loginAlertText = document.getElementById('loginAlertText');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  
  // Modal elements
  const welcomeModal = document.getElementById('welcomeModal');
  const welcomeName  = document.getElementById('welcomeName');
  const btnContinue  = document.getElementById('btnContinue');

  let isAuthenticating = false;

  function showAlert(msg) {
    if (!loginAlert || !loginAlertText) return;
    loginAlertText.textContent = msg;
    loginAlert.style.setProperty('display', 'block', 'important');
  }
  function hideAlert() {
    if (loginAlert) loginAlert.style.setProperty('display', 'none', 'important');
  }

  function canSubmit() {
    const phoneOk = limparTelefone(telefoneInput?.value || '').length === 11;
    const pinOk   = (pinInput?.value || '').length === 4;
    return phoneOk && pinOk;
  }

  function updateBtn() {
    if (btnSubmit) btnSubmit.disabled = !canSubmit() || isAuthenticating;
  }

  // Máscara telefone
  if (telefoneInput) {
    telefoneInput.addEventListener('input', (e) => {
      hideAlert();
      e.target.value = formatarMascaraTelefone(e.target.value);
      const n = limparTelefone(e.target.value).length;
      if (phoneCounter) phoneCounter.textContent = n > 0 ? `${n} de 11 dígitos` : '';
      updateBtn();
    });
    telefoneInput.addEventListener('paste', () => {
      setTimeout(() => {
        telefoneInput.value = formatarMascaraTelefone(telefoneInput.value);
        updateBtn();
      }, 10);
    });
  }

  // PIN input — só aceita dígitos
  if (pinInput) {
    pinInput.addEventListener('input', (e) => {
      hideAlert();
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
      updateBtn();
    });
  }

  // Mostrar/Ocultar Senha
  if (togglePasswordBtn && pinInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPassword = pinInput.type === 'password';
      pinInput.type = isPassword ? 'text' : 'password';
      togglePasswordBtn.setAttribute('aria-label', isPassword ? 'Ocultar senha' : 'Mostrar senha');
      
      // Update icon (olho / olho cortado)
      if (isPassword) {
        togglePasswordBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 14 Q 12 4 20 14"></path>
            <circle cx="12" cy="14" r="2.5"></circle>
            <line x1="3" y1="3" x2="21" y2="21"></line>
          </svg>
        `;
      } else {
        togglePasswordBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 14 Q 12 4 20 14"></path>
            <circle cx="12" cy="14" r="2.5"></circle>
          </svg>
        `;
      }
    });
  }

  // Submit
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!canSubmit() || isAuthenticating) return;
      executarAutenticacao();
    });
  }

  async function executarAutenticacao() {
    if (isAuthenticating) return;
    isAuthenticating = true;

    const cleanPhone = limparTelefone(telefoneInput?.value || '');
    const pin        = (pinInput?.value || '').trim();

    if (cleanPhone.length < 11) {
      showAlert('Digite seu número de celular completo com DDD.');
      isAuthenticating = false; updateBtn(); return;
    }
    if (!/^\d{4}$/.test(pin)) {
      showAlert('A senha deve conter exatamente 4 números.');
      isAuthenticating = false; updateBtn(); return;
    }

    if (btnSubmit) {
      btnSubmit.textContent = 'Entrando...';
      btnSubmit.disabled    = true;
    }

    try {
      let targetUser = null;
      let userRole   = 'membro';

      const pessoasRef = collection(db, 'igrejas', 'iebi', 'pessoas');
      try {
        const snap = await getDocs(pessoasRef);
        snap.forEach(doc => {
          if (targetUser) return;
          const data = doc.data();
          const tel = limparTelefone(data.telefone || data.celular || data.whatsapp || '');
          if (tel === cleanPhone) {
            targetUser = { id: doc.id, ...data };
            if (data.role) userRole = data.role;
          }
        });
      } catch (e) {
        console.error("Erro ao buscar na coleção pessoas:", e);
      }

      if (!targetUser) {
        showAlert('Celular não encontrado. Verifique o número ou contate a secretaria.');
        isAuthenticating = false;
        if (btnSubmit) { btnSubmit.textContent = 'Entrar'; updateBtn(); }
        return;
      }

      const senhaGravada = String(targetUser.senha || targetUser.pin || targetUser.codigo || '').trim();
      
      let isPrimeiroAcesso = false;

      // Se a pessoa não tem senha cadastrada, define a senha atual como o primeiro acesso
      if (!senhaGravada) {
        try {
          const docRef = doc(db, 'igrejas', 'iebi', 'pessoas', targetUser.id);
          await updateDoc(docRef, { senha: pin });
          isPrimeiroAcesso = true;
          targetUser.senha = pin;
        } catch (e) {
          console.error("Erro ao salvar senha de primeiro acesso:", e);
          showAlert('Erro ao cadastrar a senha. Tente novamente.');
          isAuthenticating = false;
          if (btnSubmit) { btnSubmit.textContent = 'Entrar'; updateBtn(); }
          return;
        }
      } else if (senhaGravada !== pin) {
        // Se a senha estiver errada
        showAlert('Senha incorreta. Tente novamente ou contate a secretaria.');
        if (pinInput) { pinInput.value = ''; pinInput.focus(); }
        isAuthenticating = false;
        if (btnSubmit) { btnSubmit.textContent = 'Entrar'; updateBtn(); }
        return;
      }

      const session = {
        id: targetUser.id, nome: targetUser.nome || 'Membro IEBI',
        telefone: cleanPhone, role: targetUser.role || userRole || 'membro',
        email: targetUser.email || '', foto: targetUser.foto || '',
      };
      sessionStorage.setItem('authenticated_user', JSON.stringify(session));
      localStorage.setItem('authenticated_user',   JSON.stringify(session));
      sessionStorage.setItem('user_role', session.role);

      const targetUrl = ['admin','coordenador','secretaria'].includes(session.role) ? '../index.html' : 'painel.html';

      if (welcomeModal && welcomeName) {
        welcomeName.textContent = `Olá, ${session.nome.split(' ')[0]}!`;
        
        const welcomeMessage = welcomeModal.querySelector('p');
        if (welcomeMessage) {
          if (isPrimeiroAcesso) {
            welcomeMessage.textContent = 'Primeiro acesso: sua senha foi cadastrada com sucesso!';
          } else {
            welcomeMessage.textContent = 'Acesso autorizado com sucesso.';
          }
        }

        welcomeModal.showModal();
        
        const redirect = () => window.location.replace(targetUrl);
        
        if (btnContinue) {
          btnContinue.addEventListener('click', redirect);
        }
        
        // Auto redirect after 3 seconds
        setTimeout(redirect, 3000);
      } else {
        window.location.replace(targetUrl);
      }

    } catch (err) {
      console.error(err);
      showAlert('Erro de conexão. Tente novamente.');
      isAuthenticating = false;
      if (btnSubmit) { btnSubmit.textContent = 'Entrar'; updateBtn(); }
    }
  }
});
