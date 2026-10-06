import { db, collection, addDoc, serverTimestamp, query, where, getDocs } from './firebase.js';

// --- DOWNLOAD TEMPLATE ---
document.getElementById('btnBaixarModelo').addEventListener('click', () => {
    const wb = XLSX.utils.book_new();
    const ws_data = [
        [
            "nome", "sexo", "data_nascimento", "email", "celular", "matricula_rol", "data_entrada", "arrolamento", "observacoes_arrolamento",
            "cpf", "rg", "apelido", "naturalidade", "estado_civil", "escolaridade", "tipo_sanguineo", "doador_orgaos",
            "cep", "logradouro", "numero", "complemento", "bairro", "cidade", "uf",
            "site", "instagram", "facebook", "nome_recado", "telefone_recado"
        ],
        [
            "João da Silva", "Masculino", "25/12/1980", "joao@email.com", "(11) 99999-9999", "12345", "01/01/2020", "Membro", "Membro ativo",
            "111.111.111-11", "MG-11.111.111", "Joãozinho", "São Paulo - SP", "Casado(a)", "Ensino Superior", "O+", "Sim",
            "12345-000", "Rua das Flores", "123", "Apto 1", "Centro", "São Paulo", "SP",
            "www.joao.com", "@joaoldasilva", "joao.silva", "Maria", "(11) 88888-8888"
        ]
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, "Modelo");
    XLSX.writeFile(wb, "Modelo_Importacao_Membros.xlsx");
});

// --- EXPORT DATA ---
document.getElementById('btnExportar').addEventListener('click', async () => {
    const btn = document.getElementById('btnExportar');
    btn.disabled = true;
    btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Gerando Planilha...';

    try {
        const ref = collection(db, 'igrejas', 'iebi', 'pessoas');
        const snapshot = await getDocs(ref);
        
        const data = [];
        snapshot.forEach(doc => {
            const p = doc.data();
            data.push({
                "nome": p.nome || '',
                "sexo": p.sexo || '',
                "data_nascimento": p.data_nascimento ? new Date(p.data_nascimento.seconds * 1000).toLocaleDateString('pt-BR') : '',
                "email": p.email || '',
                "celular": p.celular || '',
                "matricula_rol": p.matricula_rol || '',
                "data_entrada": p.data_entrada ? new Date(p.data_entrada.seconds * 1000).toLocaleDateString('pt-BR') : '',
                "arrolamento": p.arrolamento || '',
                "observacoes_arrolamento": p.observacoes_arrolamento || '',
                
                "cpf": p.cpf || '',
                "rg": p.rg || '',
                "apelido": p.apelido || '',
                "naturalidade": p.naturalidade || '',
                "estado_civil": p.estado_civil || '',
                "escolaridade": p.escolaridade || '',
                "tipo_sanguineo": p.tipo_sanguineo || '',
                "doador_orgaos": p.doador_orgaos ? 'Sim' : 'Não',
                
                "cep": p.endereco?.cep || '',
                "logradouro": p.endereco?.logradouro || '',
                "numero": p.endereco?.numero || '',
                "complemento": p.endereco?.complemento || '',
                "bairro": p.endereco?.bairro || '',
                "cidade": p.endereco?.cidade || '',
                "uf": p.endereco?.uf || '',
                
                "site": p.redes_sociais?.site || '',
                "instagram": p.redes_sociais?.instagram || '',
                "facebook": p.redes_sociais?.facebook || '',
                "nome_recado": p.redes_sociais?.nome_recado || '',
                "telefone_recado": p.redes_sociais?.telefone_recado || ''
            });
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "Cadastros");
        XLSX.writeFile(wb, "Cadastros_IEBI.xlsx");

    } catch (e) {
        console.error(e);
        alert("Erro ao exportar: " + e.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="ph ph-download-simple"></i> Baixar Planilha de Cadastros (XLSX)';
    }
});

// --- IMPORT DATA ---
document.getElementById('btnImportar').addEventListener('click', () => {
    const file = document.getElementById('excelFile').files[0];
    if(!file) return alert("Selecione o arquivo Excel primeiro.");
    
    document.getElementById('btnImportar').disabled = true;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array', cellDates: true});
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: "", raw: false });
            await processarExcel(rows);
        } catch(error) {
            alert("Erro ao processar planilha: " + error.message);
            document.getElementById('btnImportar').disabled = false;
        }
    };
    reader.readAsArrayBuffer(file);
});

function parseDate(dateStr) {
    if(!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '' || dateStr === '0') return null;
    const parts = dateStr.split('/');
    if(parts.length === 3) {
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00`);
    }
    return null;
}

// --- MASKS FOR IMPORT ---
function maskPhone(value) {
    if (!value) return '';
    value = String(value).replace(/\D/g, "");
    if (value.length > 10) {
      value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    } else if (value.length > 6) {
      value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d{0,5}).*/, "($1) $2");
    }
    return value;
}

function maskCPF(value) {
    if (!value) return '';
    value = String(value).replace(/\D/g, "");
    if (value.length > 9) {
      value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2}).*/, "$1.$2.$3-$4");
    } else if (value.length > 6) {
      value = value.replace(/^(\d{3})(\d{3})(\d{0,3}).*/, "$1.$2.$3");
    } else if (value.length > 3) {
      value = value.replace(/^(\d{3})(\d{0,3}).*/, "$1.$2");
    }
    return value;
}

function maskCEP(value) {
    if (!value) return '';
    value = String(value).replace(/\D/g, "");
    if (value.length > 5) {
        value = value.replace(/^(\d{5})(\d{0,3}).*/, '$1-$2');
    }
    return value;
}

async function processarExcel(rows) {
    const log = document.getElementById('logArea');
    const lbl = document.getElementById('lblProgresso');
    
    if(!rows || rows.length === 0) {
        log.innerHTML += `<br><span style="color:red">Arquivo vazio ou sem registros.</span>`;
        return;
    }
    
    lbl.textContent = `0 / ${rows.length}`;
    
    const ref = collection(db, 'igrejas', 'iebi', 'pessoas');
    let success = 0;
    
    log.innerHTML += `Encontrados ${rows.length} registros para processar.<br><br>`;
    
    for(let i=0; i<rows.length; i++) {
        const obj = rows[i];
        
        // normaliza chaves (remove espacos)
        const normObj = {};
        for(let key in obj) {
            normObj[key.trim()] = obj[key] ? String(obj[key]).trim() : '';
        }
        
        // fallback to old legacy fields se existirem, ou usa os novos 100% corretos
        const pessoaNome = normObj.nome || '';
        if(!pessoaNome) {
            log.innerHTML += `<span style="color:orange">[Ignorado] Linha ${i+2} sem nome válido.</span><br>`;
            log.scrollTop = log.scrollHeight;
            continue;
        }

        // Verificação de duplicidade por nome ANTES de processar
        const q = query(ref, where("nome", "==", pessoaNome));
        const qSnapshot = await getDocs(q);
        
        if (!qSnapshot.empty) {
            log.innerHTML += `<span style="color:orange">[Ignorado] "${pessoaNome}" já está cadastrado(a).</span><br>`;
            log.scrollTop = log.scrollHeight;
            continue;
        }
        
        let arrolamentoMapped = normObj.arrolamento || '';
        // legacy map support
        if(arrolamentoMapped.toUpperCase() === "SOU MEMBRO") arrolamentoMapped = "Membro";
        else if(arrolamentoMapped.toUpperCase() === "NÃO SOU MEMBRO") arrolamentoMapped = "Visitante";
        
        let sexoMapped = normObj.sexo || '';
        if(sexoMapped.toUpperCase() === "MASCULINO") sexoMapped = "Masculino";
        else if(sexoMapped.toUpperCase() === "FEMININO") sexoMapped = "Feminino";
        else if (!sexoMapped) sexoMapped = "Não Informado";
        
        let estadoCivilMapped = normObj.estado_civil || normObj.estadoCivil || '';
        if(estadoCivilMapped.toUpperCase() === "SOLTEIRO") estadoCivilMapped = "Solteiro(a)";
        else if(estadoCivilMapped.toUpperCase() === "CASADO") estadoCivilMapped = "Casado(a)";

        const isDoador = (normObj.doador_orgaos && normObj.doador_orgaos.toLowerCase() === 'sim');
        
        const pessoa = {
            nome: pessoaNome,
            sexo: sexoMapped,
            data_nascimento: parseDate(normObj.data_nascimento || normObj.dtnasc),
            email: normObj.email || '',
            celular: maskPhone(normObj.celular),
            matricula_rol: normObj.matricula_rol || '',
            data_entrada: parseDate(normObj.data_entrada),
            arrolamento: arrolamentoMapped,
            observacoes_arrolamento: normObj.observacoes_arrolamento || '',
            
            cpf: maskCPF(normObj.cpf), 
            rg: normObj.rg || '', 
            apelido: normObj.apelido || '', 
            naturalidade: normObj.naturalidade || '', 
            estado_civil: estadoCivilMapped,
            escolaridade: normObj.escolaridade || '', 
            tipo_sanguineo: normObj.tipo_sanguineo || '', 
            doador_orgaos: isDoador,
            
            endereco: {
                cep: maskCEP(normObj.cep),
                logradouro: normObj.logradouro || '',
                bairro: normObj.bairro || '',
                cidade: normObj.cidade || '',
                uf: normObj.uf || '',
                numero: normObj.numero || '',
                complemento: normObj.complemento || ''
            },
            
            redes_sociais: {
                site: normObj.site || '', 
                instagram: normObj.instagram || '', 
                facebook: normObj.facebook || '', 
                nome_recado: normObj.nome_recado || '', 
                telefone_recado: maskPhone(normObj.telefone_recado)
            },
            
            criado_em: serverTimestamp(),
            atualizado_em: serverTimestamp()
        };
        
        try {
            await addDoc(ref, pessoa);
            success++;
            lbl.textContent = `${success} / ${rows.length}`;
            log.innerHTML += `[${success}/${rows.length}] Migrado: ${pessoa.nome}<br>`;
            log.scrollTop = log.scrollHeight;
        } catch(e) {
            log.innerHTML += `<span style="color:red">[ERRO] Falha ao importar ${pessoa.nome}: ${e.message}</span><br>`;
        }
    }
    
    log.innerHTML += `<br><span style="color: #00FF00; font-weight: bold;">IMPORTAÇÃO CONCLUÍDA! ${success} de ${rows.length} migrados com sucesso.</span>`;
}
