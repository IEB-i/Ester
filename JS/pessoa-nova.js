import { db, collection, addDoc, serverTimestamp, doc, updateDoc } from './firebase.js';
import { getDoc, query, where, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('formNovoCadastro');
    
    // Check URL for ID
    const urlParams = new URLSearchParams(window.location.search);
    const pessoaId = urlParams.get('id');
    const isViewOnly = urlParams.get('view') === 'true';

    if (pessoaId) {
        const pageTitle = document.querySelector('.page-title');
        const breadcrumb = document.querySelector('.breadcrumb');
        if (pageTitle) pageTitle.textContent = isViewOnly ? 'Visualizar Cadastro' : 'Editar Cadastro';
        if (breadcrumb) breadcrumb.innerHTML = `<a href="procurar-cadastro.html" style="color: var(--text-muted); text-decoration: none;">Pessoas</a> &gt; ${isViewOnly ? 'Visualizar' : 'Editar'}`;
        
        try {
            const docRef = doc(db, 'igrejas', 'iebi', 'pessoas', pessoaId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                
                // Populate fields
                if(document.getElementById('nome')) document.getElementById('nome').value = data.nome || '';
                if(document.getElementById('sexo')) document.getElementById('sexo').value = data.sexo || '';
                if(document.getElementById('data_nascimento') && data.data_nascimento) {
                    const dateObj = data.data_nascimento.toDate();
                    document.getElementById('data_nascimento').value = dateObj.toISOString().split('T')[0];
                }
                if(document.getElementById('email')) document.getElementById('email').value = data.email || '';
                if(document.getElementById('celular')) document.getElementById('celular').value = data.celular || '';
                if(document.getElementById('matricula_rol')) document.getElementById('matricula_rol').value = data.matricula_rol || '';
                if(document.getElementById('data_entrada') && data.data_entrada) {
                    const dateObj = data.data_entrada.toDate();
                    document.getElementById('data_entrada').value = dateObj.toISOString().split('T')[0];
                }
                if(document.getElementById('arrolamento')) document.getElementById('arrolamento').value = data.arrolamento || '';
                if(document.getElementById('observacoes_arrolamento')) document.getElementById('observacoes_arrolamento').value = data.observacoes_arrolamento || '';
                
                if(document.getElementById('cpf')) document.getElementById('cpf').value = data.cpf || '';
                if(document.getElementById('rg')) document.getElementById('rg').value = data.rg || '';
                if(document.getElementById('apelido')) document.getElementById('apelido').value = data.apelido || '';
                if(document.getElementById('naturalidade')) document.getElementById('naturalidade').value = data.naturalidade || '';
                if(document.getElementById('estado_civil')) document.getElementById('estado_civil').value = data.estado_civil || '';
                if(document.getElementById('escolaridade')) document.getElementById('escolaridade').value = data.escolaridade || '';
                if(document.getElementById('tipo_sanguineo')) document.getElementById('tipo_sanguineo').value = data.tipo_sanguineo || '';
                if(document.getElementById('doador_orgaos')) document.getElementById('doador_orgaos').checked = data.doador_orgaos || false;
                
                if (data.endereco) {
                    if(document.getElementById('cep')) document.getElementById('cep').value = data.endereco.cep || '';
                    if(document.getElementById('logradouro')) document.getElementById('logradouro').value = data.endereco.logradouro || '';
                    if(document.getElementById('bairro')) document.getElementById('bairro').value = data.endereco.bairro || '';
                    if(document.getElementById('cidade')) document.getElementById('cidade').value = data.endereco.cidade || '';
                    if(document.getElementById('uf')) document.getElementById('uf').value = data.endereco.uf || '';
                    if(document.getElementById('numero')) document.getElementById('numero').value = data.endereco.numero || '';
                    if(document.getElementById('complemento')) document.getElementById('complemento').value = data.endereco.complemento || '';
                }
                
                if (data.redes_sociais) {
                    if(document.getElementById('site')) document.getElementById('site').value = data.redes_sociais.site || '';
                    if(document.getElementById('instagram')) document.getElementById('instagram').value = data.redes_sociais.instagram || '';
                    if(document.getElementById('facebook')) document.getElementById('facebook').value = data.redes_sociais.facebook || '';
                    if(document.getElementById('nome_recado')) document.getElementById('nome_recado').value = data.redes_sociais.nome_recado || '';
                    if(document.getElementById('telefone_recado')) document.getElementById('telefone_recado').value = data.redes_sociais.telefone_recado || '';
                }

                if (isViewOnly) {
                    const inputs = form.querySelectorAll('input, select, textarea');
                    inputs.forEach(input => input.disabled = true);
                    
                    const btnCancelar = form.querySelector('.btn-secondary');
                    if (btnCancelar) {
                        btnCancelar.textContent = 'Voltar';
                        btnCancelar.addEventListener('click', () => {
                            window.location.href = 'procurar-cadastro.html';
                        });
                    }

                    const btnSalvar = form.querySelector('button[type="submit"]');
                    if(btnSalvar) {
                        btnSalvar.type = 'button';
                        btnSalvar.innerHTML = '<i class="ph ph-pencil-simple"></i> Editar Cadastro';
                        btnSalvar.style.display = 'inline-block';
                        btnSalvar.addEventListener('click', (e) => {
                            e.preventDefault();
                            window.location.href = `pessoa-nova.html?id=${pessoaId}`;
                        });
                    }
                } else {
                    const btnCancelar = form.querySelector('.btn-secondary');
                    if (btnCancelar) {
                        btnCancelar.addEventListener('click', () => {
                            window.location.href = 'procurar-cadastro.html';
                        });
                    }
                }
            } else {
                alert('Cadastro não encontrado.');
            }
        } catch (error) {
            console.error("Erro ao buscar cadastro:", error);
            alert('Erro ao carregar os dados.');
        }
    } else {
        // Se for um novo cadastro, configura o botão cancelar normalmente
        const btnCancelar = form.querySelector('.btn-secondary');
        if (btnCancelar) {
            btnCancelar.addEventListener('click', () => {
                window.location.href = 'procurar-cadastro.html';
            });
        }
    }

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

                if (pessoaId) {
                    delete novaPessoa.criado_em; // manter a data de criação original
                    const ref = doc(db, 'igrejas', 'iebi', 'pessoas', pessoaId);
                    await updateDoc(ref, novaPessoa);
                    
                    // Efeito Cascata: Atualizar cache nas turmas (inscrições)
                    try {
                        const inscRef = collection(db, 'igrejas', 'iebi', 'inscricoes');
                        const q = query(inscRef, where('id_pessoa', '==', pessoaId));
                        const snap = await getDocs(q);
                        
                        if (!snap.empty) {
                            const batch = writeBatch(db);
                            snap.forEach(docSnap => {
                                batch.update(docSnap.ref, {
                                    nome_pessoa_cache: novaPessoa.nome,
                                    contato_cache: novaPessoa.celular || ''
                                });
                            });
                            await batch.commit();
                        }
                    } catch (err) {
                        console.error("Erro no efeito cascata (inscrições):", err);
                    }
                } else {
                    const ref = collection(db, 'igrejas', 'iebi', 'pessoas');
                    await addDoc(ref, novaPessoa);
                }
                
                const sucessoModal = document.getElementById('sucessoModal');
                if (sucessoModal) {
                    if (pessoaId) {
                        const titleEl = sucessoModal.querySelector('h3');
                        if (titleEl) titleEl.textContent = 'Cadastro Atualizado!';
                        const descEl = sucessoModal.querySelector('p');
                        if (descEl) descEl.textContent = 'Os dados foram salvos com sucesso.';
                    }
                    sucessoModal.classList.add('active');
                }
                
                if (!pessoaId) {
                    form.reset();
                }
                
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
