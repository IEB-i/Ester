class Visitante {
  final String? id;
  final String nome;
  final String whatsapp;
  final String eCristao; // "Sim" | "Não"
  final List<String> interesses; // "Células", "Jovens", "Cursos"
  final String pedidoOracao;
  final bool autorizaWhatsapp;
  final DateTime? dataVisita;
  final String statusContato; // "Pendente" | "Contatado"

  Visitante({
    this.id,
    required this.nome,
    required this.whatsapp,
    this.eCristao = 'Não',
    this.interesses = const [],
    this.pedidoOracao = '',
    this.autorizaWhatsapp = false,
    this.dataVisita,
    this.statusContato = 'Pendente',
  });

  Map<String, dynamic> toMap() {
    return {
      'nome': nome,
      'whatsapp': whatsapp,
      'e_cristao': eCristao,
      'interesses': interesses,
      'pedido_oracao': pedidoOracao,
      'autoriza_whatsapp': autorizaWhatsapp,
      'data_visita': dataVisita, // Tratar como Timestamp no Firebase
      'status_contato': statusContato,
    };
  }

  factory Visitante.fromMap(Map<String, dynamic> map, String docId) {
    return Visitante(
      id: docId,
      nome: map['nome'] ?? '',
      whatsapp: map['whatsapp'] ?? '',
      eCristao: map['e_cristao'] ?? 'Não',
      interesses: List<String>.from(map['interesses'] ?? []),
      pedidoOracao: map['pedido_oracao'] ?? '',
      autorizaWhatsapp: map['autoriza_whatsapp'] ?? false,
      dataVisita: map['data_visita'] != null
          ? (map['data_visita'] as dynamic).toDate()
          : null,
      statusContato: map['status_contato'] ?? 'Pendente',
    );
  }
}
