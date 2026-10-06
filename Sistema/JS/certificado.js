import { db, doc } from './firebase.js';
import { getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const inscricaoId = urlParams.get('inscricaoId');
    const turmaId = urlParams.get('turmaId');

    if (!inscricaoId && !turmaId) {
        alert("Nenhum ID fornecido.");
        return;
    }

    try {
        const certTemplate = document.querySelector('.cert-container');
        const parent = certTemplate.parentElement;
        certTemplate.remove();

        function renderCertificate(inscData, turmaData) {
            const clone = certTemplate.cloneNode(true);
            
            clone.querySelector('#lblNome').textContent = inscData.nome_pessoa_cache;

            const dataInicio = turmaData.data_inicio || '----';
            const dataFim = turmaData.data_fim || turmaData.data_fechamento || '----';
            
            function setDateParts(d, prefix) {
                let dia = '--', mes = '--', ano = '----';
                if (d && d !== '----') {
                    const parts = d.split('-');
                    if(parts.length === 3) {
                        dia = parts[2];
                        mes = parts[1];
                        ano = parts[0];
                    }
                }
                clone.querySelector('#' + prefix + 'Dia').textContent = dia;
                clone.querySelector('#' + prefix + 'Mes').textContent = mes;
                clone.querySelector('#' + prefix + 'Ano').textContent = ano;
            }

            setDateParts(dataInicio, 'lblInicio');
            setDateParts(dataFim, 'lblFim');

            parent.appendChild(clone);
        }

        if (inscricaoId) {
            // Imprimir único
            const inscRef = doc(db, 'igrejas', 'iebi', 'inscricoes', inscricaoId);
            const inscSnap = await getDoc(inscRef);
            if (!inscSnap.exists()) return alert("Inscrição não encontrada.");
            const inscData = inscSnap.data();

            const turmaRef = doc(db, 'igrejas', 'iebi', 'turmas', inscData.id_turma);
            const turmaSnap = await getDoc(turmaRef);
            if (!turmaSnap.exists()) return alert("Turma vinculada não encontrada.");
            
            renderCertificate(inscData, turmaSnap.data());

        } else if (turmaId) {
            // Imprimir lote
            const turmaRef = doc(db, 'igrejas', 'iebi', 'turmas', turmaId);
            const turmaSnap = await getDoc(turmaRef);
            if (!turmaSnap.exists()) return alert("Turma não encontrada.");
            const turmaData = turmaSnap.data();

            const q = query(collection(db, 'igrejas', 'iebi', 'inscricoes'), 
                            where('id_turma', '==', turmaId),
                            where('status_final', '==', 'Aprovado'));
            const snap = await getDocs(q);

            if (snap.empty) {
                alert("Nenhum aluno Aprovado nesta turma.");
                return;
            }

            // Ordenar por nome para facilitar a entrega
            const inscricoes = [];
            snap.forEach(doc => inscricoes.push(doc.data()));
            inscricoes.sort((a,b) => (a.nome_pessoa_cache || '').localeCompare(b.nome_pessoa_cache || ''));

            inscricoes.forEach(inscData => {
                renderCertificate(inscData, turmaData);
            });
        }

    } catch (e) {
        console.error("Erro ao gerar certificados:", e);
        alert("Erro ao carregar dados.");
    }
});
