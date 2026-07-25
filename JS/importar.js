import { db, collection, addDoc, serverTimestamp } from './firebase.js';

document.getElementById('btnImportar').addEventListener('click', () => {
    const file = document.getElementById('csvFile').files[0];
    if(!file) return alert("Selecione o arquivo CSV primeiro.");
    
    document.getElementById('btnImportar').disabled = true;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target.result;
        await processarCSV(text);
    };
    reader.readAsText(file, 'utf-8');
});

// CSV parser super simples
function parseCSVLine(text) {
    let result = [];
    let cur = '';
    let inQuotes = false;
    for(let i=0; i<text.length; i++) {
        let char = text[i];
        if (inQuotes) {
            if (char === '"' && text[i+1] === '"') {
                cur += '"';
                i++;
            } else if (char === '"') {
                inQuotes = false;
            } else {
                cur += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ';') {
                result.push(cur);
                cur = '';
            } else {
                cur += char;
            }
        }
    }
    result.push(cur);
    return result;
}

function parseDate(dateStr) {
    if(!dateStr || dateStr.trim() === '' || dateStr === '0') return null;
    const parts = dateStr.split('/');
    if(parts.length === 3) {
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00`);
    }
    return null;
}

async function processarCSV(csvText) {
    const log = document.getElementById('logArea');
    const lbl = document.getElementById('lblProgresso');
    
    const lines = csvText.trim().split('\n');
    if(lines.length < 2) {
        log.innerHTML += `<br><span style="color:red">Arquivo vazio ou sem registros.</span>`;
        return;
    }
    
    // Remove o BOM se existir
    const headerLine = lines[0].replace(/^\uFEFF/, '');
    const headers = parseCSVLine(headerLine);
    const rows = lines.slice(1).map(l => parseCSVLine(l));
    
    lbl.textContent = `0 / ${rows.length}`;
    
    const ref = collection(db, 'igrejas', 'iebi', 'pessoas');
    let success = 0;
    
    log.innerHTML += `Encontrados ${rows.length} registros para processar.<br><br>`;
    
    for(let i=0; i<rows.length; i++) {
        const r = rows[i];
        let obj = {};
        headers.forEach((h, idx) => {
            // Normalize header text just in case
            obj[h.trim()] = r[idx] ? r[idx].trim() : '';
        });
        
        let arrolamentoMapped = "";
        if(obj.arrolamento === "SOU MEMBRO") arrolamentoMapped = "Membro";
        else if(obj.arrolamento === "NÃO SOU MEMBRO") arrolamentoMapped = "Visitante";
        
        // Mapeamento minucioso conforme regras
        const pessoa = {
            nome: obj.nome || '',
            sexo: obj.sexo === "MASCULINO" ? "Masculino" : (obj.sexo === "FEMININO" ? "Feminino" : "Não Informado"),
            data_nascimento: parseDate(obj.dtnasc),
            email: obj.email || '',
            celular: obj.celular || '',
            matricula_rol: '',
            data_entrada: null,
            arrolamento: arrolamentoMapped,
            observacoes_arrolamento: '',
            
            cpf: '', 
            rg: '', 
            apelido: '', 
            naturalidade: '', 
            estado_civil: obj.estadoCivil === "SOLTEIRO" ? "Solteiro(a)" : (obj.estadoCivil === "CASADO" ? "Casado(a)" : ""),
            escolaridade: '', 
            tipo_sanguineo: '', 
            doador_orgaos: false,
            
            endereco: {
                cep: obj.cep || '',
                logradouro: '',
                bairro: obj.bairro || '',
                cidade: obj.cidade || '',
                uf: obj.uf || '',
                numero: '',
                complemento: ''
            },
            
            redes_sociais: {
                site: '', 
                instagram: '', 
                facebook: '', 
                nome_recado: '', 
                telefone_recado: ''
            },
            
            criado_em: serverTimestamp(),
            atualizado_em: serverTimestamp()
        };
        
        try {
            await addDoc(ref, pessoa);
            success++;
            lbl.textContent = `${success} / ${rows.length}`;
            log.innerHTML += `[${success}/${rows.length}] Migrado: ${pessoa.nome}<br>`;
            // Autoscroll
            log.scrollTop = log.scrollHeight;
        } catch(e) {
            log.innerHTML += `<span style="color:red">[ERRO] Falha ao importar ${pessoa.nome}: ${e.message}</span><br>`;
        }
    }
    
    log.innerHTML += `<br><span style="color: #00FF00; font-weight: bold;">IMPORTAÇÃO CONCLUÍDA! ${success} de ${rows.length} migrados com sucesso para a coleção "pessoas".</span>`;
}
