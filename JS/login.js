import { db } from './firebase.js';
import { collection, doc, getDocs, setDoc, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('emailInput');
    const senhaInput = document.getElementById('senhaInput');
    const btnLogin = document.getElementById('btnLogin');
    const errorMsg = document.getElementById('errorMsg');
    const registerFields = document.getElementById('registerFields');
    const nomeInput = document.getElementById('nomeInput');
    const telefoneInput = document.getElementById('telefoneInput');
    const btnToggleRegister = document.getElementById('btnToggleRegister');
    const loginSubtitle = document.getElementById('loginSubtitle');

    function showError(message) {
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
    }

    // Forçar que a senha contenha APENAS números e no máximo 6 dígitos
    if (senhaInput) {
        senhaInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
        });
    }

    let isRegisterMode = false;

    if (btnToggleRegister) {
        btnToggleRegister.addEventListener('click', () => {
            isRegisterMode = !isRegisterMode;
            errorMsg.style.display = 'none';

            if (isRegisterMode) {
                btnLogin.innerHTML = '<i class="ph ph-user-plus"></i> Criar Minha Conta';
                btnToggleRegister.textContent = "Já tem uma conta? Faça Login";
                registerFields.style.display = 'block';
                nomeInput.required = true;
                telefoneInput.required = true;
                if (loginSubtitle) loginSubtitle.textContent = "Preencha seus dados para criar uma conta de acesso.";
            } else {
                btnLogin.innerHTML = '<i class="ph ph-sign-in"></i> Entrar';
                btnToggleRegister.textContent = "Não tem conta? Cadastre-se aqui";
                registerFields.style.display = 'none';
                nomeInput.required = false;
                telefoneInput.required = false;
                if (loginSubtitle) loginSubtitle.textContent = "Insira seu e-mail ou telefone e sua senha numérica de 6 dígitos.";
            }
        });
    }

    // Garantir existência da conta de administrador padrão (admin@iebi.com / 123456)
    async function garantirAdminPadrao() {
        try {
            const usuariosRef = collection(db, 'igrejas', 'iebi', 'usuarios');
            const snapUsers = await getDocs(usuariosRef);
            let adminFound = null;

            snapUsers.forEach(docSnap => {
                const d = docSnap.data();
                if ((d.email && d.email.toLowerCase() === 'admin@iebi.com') || d.role === 'admin') {
                    adminFound = docSnap;
                }
            });

            if (!adminFound) {
                const newAdminRef = doc(usuariosRef);
                await setDoc(newAdminRef, {
                    id: newAdminRef.id,
                    nome: 'Administrador IEBI',
                    email: 'admin@iebi.com',
                    telefone: '83999999999',
                    senha: '123456',
                    role: 'admin',
                    criado_em: serverTimestamp()
                });
                console.log("Conta Admin criada: admin@iebi.com / 123456");
            } else {
                const d = adminFound.data();
                if (d.senha !== '123456' || d.role !== 'admin') {
                    await setDoc(doc(db, 'igrejas', 'iebi', 'usuarios', adminFound.id), {
                        ...d,
                        email: d.email || 'admin@iebi.com',
                        senha: '123456',
                        role: 'admin'
                    }, { merge: true });
                }
            }
        } catch(e) {
            console.error("Erro ao verificar admin padrão:", e);
        }
    }

    garantirAdminPadrao();

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const originalText = btnLogin.innerHTML;
        btnLogin.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Processando...';
        btnLogin.disabled = true;
        errorMsg.style.display = 'none';

        const loginValue = emailInput.value.trim();
        const senhaValue = senhaInput.value.trim();

        // Validação da senha de 6 dígitos numéricos
        if (!/^\d{6}$/.test(senhaValue)) {
            showError('A senha deve conter exatamente 6 números (Ex: 123456).');
            btnLogin.innerHTML = originalText;
            btnLogin.disabled = false;
            return;
        }

        try {
            const usuariosRef = collection(db, 'igrejas', 'iebi', 'usuarios');

            if (isRegisterMode) {
                const nome = nomeInput.value.trim();
                const telefone = telefoneInput.value.trim();

                if (!nome || !loginValue || !telefone) {
                    showError('Por favor, preencha todos os campos.');
                    btnLogin.innerHTML = originalText;
                    btnLogin.disabled = false;
                    return;
                }

                // Verificar duplicidade de e-mail ou telefone
                const snapUsers = await getDocs(usuariosRef);
                let jaExiste = false;

                snapUsers.forEach(docSnap => {
                    const data = docSnap.data();
                    const cleanEmail = (data.email || '').toLowerCase();
                    const cleanTel = (data.telefone || '').replace(/\D/g, '');
                    const inputEmail = loginValue.toLowerCase();
                    const inputTel = telefone.replace(/\D/g, '');

                    if (cleanEmail === inputEmail || (inputTel && cleanTel === inputTel)) {
                        jaExiste = true;
                    }
                });

                if (jaExiste) {
                    showError('Este e-mail ou telefone já está cadastrado.');
                    btnLogin.innerHTML = originalText;
                    btnLogin.disabled = false;
                    return;
                }

                // Criar novo usuário na coleção igrejas/iebi/usuarios
                const newDocRef = doc(usuariosRef);
                const newUser = {
                    id: newDocRef.id,
                    nome: nome,
                    email: loginValue.toLowerCase(),
                    telefone: telefone,
                    senha: senhaValue,
                    role: 'membro', // Nível inicial
                    criado_em: serverTimestamp()
                };

                await setDoc(newDocRef, newUser);

                // Salva a sessão do usuário
                const sessionData = { id: newDocRef.id, ...newUser };
                delete sessionData.senha;
                sessionStorage.setItem('authenticated_user', JSON.stringify(sessionData));
                localStorage.setItem('authenticated_user', JSON.stringify(sessionData));

                window.location.replace('bem-vindo.html');
                return;
            }

            // MODO LOGIN: Buscar usuário por e-mail, telefone ou o atalho 'admin'
            const snapUsers = await getDocs(usuariosRef);
            let targetUser = null;

            const inputClean = loginValue.toLowerCase().replace(/\D/g, '');
            const isInputEmail = loginValue.includes('@');
            const isInputAdmin = loginValue.toLowerCase() === 'admin' || loginValue.toLowerCase() === 'admin@iebi.com';

            snapUsers.forEach(docSnap => {
                const data = docSnap.data();
                const userEmail = (data.email || '').toLowerCase();
                const userTel = (data.telefone || '').replace(/\D/g, '');

                if (isInputAdmin && (data.role === 'admin' || userEmail === 'admin@iebi.com')) {
                    targetUser = { id: docSnap.id, ...data };
                } else if (isInputEmail) {
                    if (userEmail === loginValue.toLowerCase()) {
                        targetUser = { id: docSnap.id, ...data };
                    }
                } else {
                    if (userTel === inputClean || (data.telefone && data.telefone.trim() === loginValue)) {
                        targetUser = { id: docSnap.id, ...data };
                    }
                }
            });

            if (!targetUser) {
                showError('Usuário não encontrado com este e-mail ou telefone.');
                btnLogin.innerHTML = originalText;
                btnLogin.disabled = false;
                return;
            }

            // Comparar senha numérica
            if (targetUser.senha !== senhaValue) {
                showError('Senha incorreta. A senha é composta por 6 números.');
                btnLogin.innerHTML = originalText;
                btnLogin.disabled = false;
                return;
            }

            // Login bem sucedido! Salvar na sessão
            const sessionData = { ...targetUser };
            delete sessionData.senha;
            sessionStorage.setItem('authenticated_user', JSON.stringify(sessionData));
            localStorage.setItem('authenticated_user', JSON.stringify(sessionData));

            // Verificar se o usuário é admin ou tem outras permissões
            const role = targetUser.role || 'membro';
            if (role === 'admin') {
                window.location.href = '../index.html';
            } else if (role !== 'membro') {
                window.location.href = '../index.html';
            } else {
                window.location.href = 'bem-vindo.html';
            }

        } catch (error) {
            console.error("Erro no login independente:", error);
            showError('Ocorreu um erro ao tentar acessar. Tente novamente.');
        } finally {
            btnLogin.innerHTML = originalText;
            btnLogin.disabled = false;
        }
    });
});
