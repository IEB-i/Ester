import { db, collection, addDoc, serverTimestamp } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formNovoCadastro');
    
    // Função utilitária para buscar endereço pelo CEP
    const inputCep = document.getElementById('cep');
    if(inputCep) {
        inputCep.addEventListener('blur', async () => {
            const cep = inputCep.value.replace(/\D/g, '');
            if(cep.length === 8) {
                try {
                    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                    const data = await res.json();
                    if(!data.erro) {
                        document.getElementById('logradouro').value = data.logradouro || '';
                        document.getElementById('bairro').value = data.bairro || '';
                        document.getElementById('cidade').value = data.localidade || '';
                        document.getElementById('uf').value = data.uf || '';
                    }
                } catch(e) {
                    console.error("Erro ao buscar CEP:", e);
                }
            }
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btnSalvar = form.querySelector('button[type="submit"]');
            const originalText = btnSalvar.innerHTML;
            btnSalvar.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Salvando...';
            btnSalvar.disabled = true;
            
            try {
                // Conversão segura de datas para Timestamp do Firestore (string YYYY-MM-DD para ISO datetime)
                const data_nascimento_input = document.getElementById('data_nascimento').value;
                const data_nasc_date = data_nascimento_input ? new Date(data_nascimento_input + 'T12:00:00') : null;
                
                const data_entrada_input = document.getElementById('data_entrada').value;
                const data_entrada_date = data_entrada_input ? new Date(data_entrada_input + 'T12:00:00') : null;
                
                const novaPessoa = {
                    // A) Dados Pessoais
                    nome: document.getElementById('nome').value,
                    sexo: document.getElementById('sexo').value,
                    data_nascimento: data_nasc_date,
                    email: document.getElementById('email').value,
                    celular: document.getElementById('celular').value,
                    matricula_rol: document.getElementById('matricula_rol').value,
                    data_entrada: data_entrada_date,
                    arrolamento: document.getElementById('arrolamento').value,
                    observacoes_arrolamento: document.getElementById('observacoes_arrolamento').value,
                    
                    // B) Dados Complementares
                    cpf: document.getElementById('cpf').value,
                    rg: document.getElementById('rg').value,
                    apelido: document.getElementById('apelido').value,
                    naturalidade: document.getElementById('naturalidade').value,
                    estado_civil: document.getElementById('estado_civil').value,
                    escolaridade: document.getElementById('escolaridade').value,
                    tipo_sanguineo: document.getElementById('tipo_sanguineo').value,
                    doador_orgaos: document.getElementById('doador_orgaos').checked,
                    
                    // C) Objeto Endereço
                    endereco: {
                        cep: document.getElementById('cep').value,
                        logradouro: document.getElementById('logradouro').value,
                        bairro: document.getElementById('bairro').value,
                        cidade: document.getElementById('cidade').value,
                        uf: document.getElementById('uf').value,
                        numero: document.getElementById('numero').value,
                        complemento: document.getElementById('complemento').value
                    },
                    
                    // D) Objeto Redes Sociais
                    redes_sociais: {
                        site: document.getElementById('site').value,
                        instagram: document.getElementById('instagram').value,
                        facebook: document.getElementById('facebook').value,
                        nome_recado: document.getElementById('nome_recado').value,
                        telefone_recado: document.getElementById('telefone_recado').value
                    },
                    
                    criado_em: serverTimestamp(),
                    atualizado_em: serverTimestamp()
                };

                const ref = collection(db, 'igrejas', 'iebi', 'pessoas');
                await addDoc(ref, novaPessoa);
                
                const sucessoModal = document.getElementById('sucessoModal');
                if (sucessoModal) {
                    sucessoModal.classList.add('active');
                }
                form.reset();
                
            } catch (error) {
                console.error("Erro ao cadastrar pessoa:", error);
                alert('Erro ao salvar o cadastro: ' + error.message);
            } finally {
                btnSalvar.innerHTML = originalText;
                btnSalvar.disabled = false;
            }
        });
    }

    const btnOkSucesso = document.getElementById('btnOkSucesso');
    const sucessoModal = document.getElementById('sucessoModal');
    if (btnOkSucesso && sucessoModal) {
        btnOkSucesso.addEventListener('click', () => {
            sucessoModal.classList.remove('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});
