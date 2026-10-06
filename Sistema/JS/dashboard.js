import { db, collection } from './firebase.js';
import { getCountFromServer, query, where } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    const countMembrosEl = document.getElementById('count-membros');
    const countAlunosEl = document.getElementById('count-alunos');

    try {
        // --- 1. Membros (Pessoas) ---
        const pessoasCol = collection(db, 'igrejas', 'iebi', 'pessoas');
        const snapshotPessoas = await getCountFromServer(pessoasCol);
        const countPessoas = snapshotPessoas.data().count;
        if (countMembrosEl) {
            animateValue(countMembrosEl, 0, countPessoas, 1000);
        }

        // --- 2. Alunos no Ensino (Matrículas Ativas) ---
        const inscricoesCol = collection(db, 'igrejas', 'iebi', 'inscricoes');
        const qAlunos = query(inscricoesCol, where('status', '==', 'Ativa'));
        const snapshotAlunos = await getCountFromServer(qAlunos);
        const countAlunos = snapshotAlunos.data().count;
        if (countAlunosEl) {
            animateValue(countAlunosEl, 0, countAlunos, 1000);
        }

    } catch (error) {
        console.error("Erro ao buscar dados do dashboard:", error);
        if (countMembrosEl) countMembrosEl.textContent = "Erro";
        if (countAlunosEl) countAlunosEl.textContent = "Erro";
    }
});

// Função simples para animar os números
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}
