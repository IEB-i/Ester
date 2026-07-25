document.addEventListener('DOMContentLoaded', () => {
  // Lógica de Sidebar e Menu migrada para JS/components.js

  // Input Masks Logic
  const maskPhone = (value) => {
    value = value.replace(/\D/g, "");
    if (value.length > 10) {
      value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    } else if (value.length > 6) {
      value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d{0,5}).*/, "($1) $2");
    }
    return value;
  };

  const maskCPF = (value) => {
    value = value.replace(/\D/g, "");
    if (value.length > 9) {
      value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2}).*/, "$1.$2.$3-$4");
    } else if (value.length > 6) {
      value = value.replace(/^(\d{3})(\d{3})(\d{0,3}).*/, "$1.$2.$3");
    } else if (value.length > 3) {
      value = value.replace(/^(\d{3})(\d{0,3}).*/, "$1.$2");
    }
    return value;
  };

  const applyMask = (id, maskFn) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', (e) => {
        e.target.value = maskFn(e.target.value);
      });
    }
  };

  applyMask('cpf', maskCPF);
  applyMask('celular', maskPhone);
  applyMask('telefone_recado', maskPhone);

  // CEP Auto-fill Logic
  const cepInput = document.getElementById('cep');
  const logradouroInput = document.getElementById('logradouro');
  const bairroInput = document.getElementById('bairro');
  const cidadeInput = document.getElementById('cidade');
  const ufInput = document.getElementById('uf');
  const numeroInput = document.getElementById('numero');

  if (cepInput) {
    // Simple mask for CEP
    cepInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 5) {
        value = value.replace(/^(\d{5})(\d)/, '$1-$2');
      }
      e.target.value = value;
    });

    cepInput.addEventListener('blur', async (e) => {
      const cep = e.target.value.replace(/\D/g, '');
      if (cep.length === 8) {
        try {
          // Clear fields on new search
          logradouroInput.value = '';
          bairroInput.value = '';
          cidadeInput.value = '';
          ufInput.value = '';

          const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
          const data = await response.json();
          
          if (!data.erro) {
            logradouroInput.value = data.logradouro || '';
            bairroInput.value = data.bairro || '';
            cidadeInput.value = data.localidade || '';
            ufInput.value = data.uf || '';
            numeroInput.focus(); // Auto focus to next field
          } else {
            alert('CEP não encontrado. Por favor, verifique o número.');
            logradouroInput.value = '';
            bairroInput.value = '';
            cidadeInput.value = '';
            ufInput.value = '';
          }
        } catch (error) {
          console.error('Erro ao buscar CEP:', error);
          alert('Erro na comunicação. Verifique sua conexão de rede.');
        }
      }
    });
  }

  const form = document.getElementById('formNovoCadastro');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Collect form data
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      
      // Handle checkboxes explicitly since unchecked checkboxes aren't in FormData
      data.doador_orgaos = document.getElementById('doador_orgaos')?.checked || false;

      console.log('Dados do Novo Membro:', data);
      
      // Simulate save
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      
      submitBtn.textContent = 'Salvando...';
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.7';

      setTimeout(() => {
        submitBtn.textContent = 'Salvo com sucesso!';
        submitBtn.style.backgroundColor = 'var(--primary-light)';
        
        setTimeout(() => {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
          submitBtn.style.opacity = '1';
          submitBtn.style.backgroundColor = '';
          form.reset(); // Reset form after successful save
        }, 2000);
      }, 1000);
    });
  }
});
