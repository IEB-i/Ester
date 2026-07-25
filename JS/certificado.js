import { db, doc } from './firebase.js';
import { getDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const inscricaoId = urlParams.get('inscricaoId');

    if (!inscricaoId) {
        alert("ID de inscrição não fornecido.");
        return;
    }

    try {
        // 1. Carregar Inscrição
        const inscRef = doc(db, 'igrejas', 'iebi', 'inscricoes', inscricaoId);
        const inscSnap = await getDoc(inscRef);
        
        if (!inscSnap.exists()) {
            alert("Inscrição não encontrada.");
            return;
        }
        const inscData = inscSnap.data();

        // 2. Carregar Turma
        const turmaRef = doc(db, 'igrejas', 'iebi', 'turmas', inscData.id_turma);
        const turmaSnap = await getDoc(turmaRef);
        
        if (!turmaSnap.exists()) {
            alert("Turma vinculada não encontrada.");
            return;
        }
        const turmaData = turmaSnap.data();

        // 3. Preencher DOM
        document.getElementById('lblNome').textContent = inscData.nome_pessoa_cache;
        document.getElementById('lblCurso').textContent = turmaData.nome_curso_cache;
        document.getElementById('lblProfessor').textContent = turmaData.professor || 'Professor';

        const dataFechamento = turmaData.data_fechamento || new Date().toISOString().split('T')[0];
        const parts = dataFechamento.split('-');
        if(parts.length === 3) {
            document.getElementById('lblData').textContent = `Intermares, ${parts[2]}/${parts[1]}/${parts[0]}`;
        } else {
            document.getElementById('lblData').textContent = `Intermares, ${dataFechamento}`;
        }

    } catch (e) {
        console.error("Erro ao gerar certificado:", e);
        alert("Erro ao carregar dados do certificado.");
    }
});
