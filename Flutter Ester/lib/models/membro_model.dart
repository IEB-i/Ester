class Endereco {
  final String cep;
  final String logradouro;
  final String numero;
  final String complemento;
  final String bairro;
  final String cidade;
  final String uf;

  Endereco({
    this.cep = '',
    this.logradouro = '',
    this.numero = '',
    this.complemento = '',
    this.bairro = '',
    this.cidade = '',
    this.uf = '',
  });

  Map<String, dynamic> toMap() {
    return {
      'cep': cep,
      'logradouro': logradouro,
      'numero': numero,
      'complemento': complemento,
      'bairro': bairro,
      'cidade': cidade,
      'uf': uf,
    };
  }

  factory Endereco.fromMap(Map<String, dynamic>? map) {
    if (map == null) return Endereco();
    return Endereco(
      cep: map['cep'] ?? '',
      logradouro: map['logradouro'] ?? '',
      numero: map['numero'] ?? '',
      complemento: map['complemento'] ?? '',
      bairro: map['bairro'] ?? '',
      cidade: map['cidade'] ?? '',
      uf: map['uf'] ?? '',
    );
  }
}

class RedesSociais {
  final String telefoneRecado;
  final String nomeRecado;
  final String facebook;
  final String instagram;

  RedesSociais({
    this.telefoneRecado = '',
    this.nomeRecado = '',
    this.facebook = '',
    this.instagram = '',
  });

  Map<String, dynamic> toMap() {
    return {
      'telefone_recado': telefoneRecado,
      'nome_recado': nomeRecado,
      'facebook': facebook,
      'instagram': instagram,
    };
  }

  factory RedesSociais.fromMap(Map<String, dynamic>? map) {
    if (map == null) return RedesSociais();
    return RedesSociais(
      telefoneRecado: map['telefone_recado'] ?? '',
      nomeRecado: map['nome_recado'] ?? '',
      facebook: map['facebook'] ?? '',
      instagram: map['instagram'] ?? '',
    );
  }
}

class Membro {
  final String? id;
  // Dados Pessoais
  final String nome;
  final String sexo; // "Masculino" | "Feminino" | "Não Informado"
  final DateTime? dataNascimento;
  final String email;
  final String celular;
  final String matriculaRol;
  final DateTime? dataEntrada;
  final String arrolamento;
  final String observacoesArrolamento;

  // Dados Complementares
  final String escolaridade;
  final String estadoCivil;
  final String tipoSanguineo;
  final bool doadorOrgaos;
  final String apelido;
  final String naturalidade;
  final String rg;
  final String cpf;

  // Sub-objetos
  final Endereco endereco;
  final RedesSociais redesSociais;

  Membro({
    this.id,
    required this.nome,
    this.sexo = 'Não Informado',
    this.dataNascimento,
    this.email = '',
    this.celular = '',
    this.matriculaRol = '',
    this.dataEntrada,
    this.arrolamento = '',
    this.observacoesArrolamento = '',
    this.escolaridade = '',
    this.estadoCivil = '',
    this.tipoSanguineo = '',
    this.doadorOrgaos = false,
    this.apelido = '',
    this.naturalidade = '',
    this.rg = '',
    this.cpf = '',
    required this.endereco,
    required this.redesSociais,
  });

  Map<String, dynamic> toMap() {
    return {
      'nome': nome,
      'sexo': sexo,
      'data_nascimento': dataNascimento, // Tratar como Timestamp no Firebase depois
      'email': email,
      'celular': celular,
      'matricula_rol': matriculaRol,
      'data_entrada': dataEntrada, // Tratar como Timestamp no Firebase depois
      'arrolamento': arrolamento,
      'observacoes_arrolamento': observacoesArrolamento,
      'escolaridade': escolaridade,
      'estado_civil': estadoCivil,
      'tipo_sanguineo': tipoSanguineo,
      'doador_orgaos': doadorOrgaos,
      'apelido': apelido,
      'naturalidade': naturalidade,
      'rg': rg,
      'cpf': cpf,
      'endereco': endereco.toMap(),
      'redes_sociais': redesSociais.toMap(),
    };
  }

  factory Membro.fromMap(Map<String, dynamic> map, String docId) {
    return Membro(
      id: docId,
      nome: map['nome'] ?? '',
      sexo: map['sexo'] ?? 'Não Informado',
      dataNascimento: map['data_nascimento'] != null 
          ? (map['data_nascimento'] as dynamic).toDate() // Assumindo Timestamp
          : null,
      email: map['email'] ?? '',
      celular: map['celular'] ?? '',
      matriculaRol: map['matricula_rol']?.toString() ?? '',
      dataEntrada: map['data_entrada'] != null
          ? (map['data_entrada'] as dynamic).toDate()
          : null,
      arrolamento: map['arrolamento'] ?? '',
      observacoesArrolamento: map['observacoes_arrolamento'] ?? '',
      escolaridade: map['escolaridade'] ?? '',
      estadoCivil: map['estado_civil'] ?? '',
      tipoSanguineo: map['tipo_sanguineo'] ?? '',
      doadorOrgaos: map['doador_orgaos'] ?? false,
      apelido: map['apelido'] ?? '',
      naturalidade: map['naturalidade'] ?? '',
      rg: map['rg'] ?? '',
      cpf: map['cpf'] ?? '',
      endereco: Endereco.fromMap(map['endereco']),
      redesSociais: RedesSociais.fromMap(map['redes_sociais']),
    );
  }
}
