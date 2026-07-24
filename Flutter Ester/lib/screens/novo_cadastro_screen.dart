import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../widgets/app_layout.dart';
import '../theme/app_colors.dart';

class NovoCadastroScreen extends StatefulWidget {
  const NovoCadastroScreen({super.key});

  @override
  State<NovoCadastroScreen> createState() => _NovoCadastroScreenState();
}

class _NovoCadastroScreenState extends State<NovoCadastroScreen> {
  final _formKey = GlobalKey<FormState>();

  // Text Controllers - Dados Pessoais
  final _nomeController = TextEditingController();
  final _dataNascController = TextEditingController();
  final _emailController = TextEditingController();
  final _celularController = TextEditingController();
  final _matriculaController = TextEditingController();
  final _dataEntradaController = TextEditingController();
  final _obsController = TextEditingController();

  // Text Controllers - Dados Complementares
  final _cpfController = TextEditingController();
  final _rgController = TextEditingController();
  final _apelidoController = TextEditingController();
  final _naturalidadeController = TextEditingController();

  // Text Controllers - Endereço
  final _cepController = TextEditingController();
  final _logradouroController = TextEditingController();
  final _bairroController = TextEditingController();
  final _cidadeController = TextEditingController();
  final _ufController = TextEditingController();
  final _numeroController = TextEditingController();
  final _complementoController = TextEditingController();
  
  // Text Controllers - Redes Sociais
  final _siteController = TextEditingController();
  final _instagramController = TextEditingController();
  final _facebookController = TextEditingController();
  final _nomeRecadoController = TextEditingController();
  final _telefoneRecadoController = TextEditingController();

  bool _isLoadingCep = false;
  bool _doadorOrgaos = false;
  bool _isSaving = false;

  // Dropdown States
  String? _sexo;
  String? _arrolamento;
  String? _estadoCivil;
  String? _escolaridade;
  String? _tipoSanguineo;

  @override
  void dispose() {
    _nomeController.dispose();
    _dataNascController.dispose();
    _emailController.dispose();
    _celularController.dispose();
    _matriculaController.dispose();
    _dataEntradaController.dispose();
    _obsController.dispose();
    _cpfController.dispose();
    _rgController.dispose();
    _apelidoController.dispose();
    _naturalidadeController.dispose();
    _cepController.dispose();
    _logradouroController.dispose();
    _bairroController.dispose();
    _cidadeController.dispose();
    _ufController.dispose();
    _numeroController.dispose();
    _complementoController.dispose();
    _siteController.dispose();
    _instagramController.dispose();
    _facebookController.dispose();
    _nomeRecadoController.dispose();
    _telefoneRecadoController.dispose();
    super.dispose();
  }

  Future<void> _buscarCep(String cep) async {
    final cepLimpo = cep.replaceAll(RegExp(r'[^0-9]'), '');
    if (cepLimpo.length != 8) return;

    setState(() { _isLoadingCep = true; });
    try {
      final response = await http.get(Uri.parse('https://viacep.com.br/ws/$cepLimpo/json/'));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['erro'] == null) {
          setState(() {
            _logradouroController.text = data['logradouro'] ?? '';
            _bairroController.text = data['bairro'] ?? '';
            _cidadeController.text = data['localidade'] ?? '';
            _ufController.text = data['uf'] ?? '';
          });
        }
      }
    } catch (e) {
      // Ignorar erros na demonstração
    } finally {
      setState(() { _isLoadingCep = false; });
    }
  }

  Future<void> _salvarCadastro() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isSaving = true);

    try {
      final Map<String, dynamic> membroData = {
        'nome': _nomeController.text.trim(),
        'sexo': _sexo ?? 'Não Informado',
        'data_nascimento': _dataNascController.text.trim(),
        'email': _emailController.text.trim(),
        'celular': _celularController.text.trim(),
        'matricula_rol': _matriculaController.text.trim(),
        'data_entrada': _dataEntradaController.text.trim(),
        'arrolamento': _arrolamento ?? '',
        'observacoes_arrolamento': _obsController.text.trim(),
        
        'escolaridade': _escolaridade ?? '',
        'estado_civil': _estadoCivil ?? '',
        'tipo_sanguineo': _tipoSanguineo ?? '',
        'doador_orgaos': _doadorOrgaos,
        'apelido': _apelidoController.text.trim(),
        'naturalidade': _naturalidadeController.text.trim(),
        'rg': _rgController.text.trim(),
        'cpf': _cpfController.text.trim(),

        'endereco': {
          'cep': _cepController.text.trim(),
          'logradouro': _logradouroController.text.trim(),
          'numero': _numeroController.text.trim(),
          'complemento': _complementoController.text.trim(),
          'bairro': _bairroController.text.trim(),
          'cidade': _cidadeController.text.trim(),
          'uf': _ufController.text.trim(),
        },

        'redes_sociais': {
          'telefone_recado': _telefoneRecadoController.text.trim(),
          'nome_recado': _nomeRecadoController.text.trim(),
          'facebook': _facebookController.text.trim(),
          'instagram': _instagramController.text.trim(),
          'site': _siteController.text.trim(),
        },
        'created_at': FieldValue.serverTimestamp(),
      };

      await FirebaseFirestore.instance.collection('igrejas').doc('iebi').collection('pessoas').add(membroData);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Membro cadastrado com sucesso!'),
            backgroundColor: AppColors.primaryLight,
            behavior: SnackBarBehavior.floating,
          )
        );
        _formKey.currentState!.reset();
        _nomeController.clear();
        _emailController.clear();
        _celularController.clear();
        _matriculaController.clear();
        _dataNascController.clear();
        _dataEntradaController.clear();
        _obsController.clear();
        _cpfController.clear();
        _rgController.clear();
        _apelidoController.clear();
        _naturalidadeController.clear();
        _cepController.clear();
        _logradouroController.clear();
        _bairroController.clear();
        _cidadeController.clear();
        _ufController.clear();
        _numeroController.clear();
        _complementoController.clear();
        _siteController.clear();
        _instagramController.clear();
        _facebookController.clear();
        _nomeRecadoController.clear();
        _telefoneRecadoController.clear();

        setState(() {
          _sexo = null;
          _arrolamento = null;
          _estadoCivil = null;
          _escolaridade = null;
          _tipoSanguineo = null;
          _doadorOrgaos = false;
        });
      }

    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro ao salvar: $e'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          )
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppLayout(
      activeMenu: 'pessoa-nova',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Pessoas - Novo Cadastro',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.primaryLight),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Container(width: 4, height: 22, color: AppColors.primaryLight),
              const SizedBox(width: 12),
              const Text(
                'Novo Cadastro',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Expanded(
            child: Card(
              color: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
                side: BorderSide(color: Colors.grey.shade200),
              ),
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(32.0),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildSectionTitle('Dados Pessoais'),
                      _buildDadosPessoais(),
                      const SizedBox(height: 32),
                      
                      _buildSectionTitle('Dados Complementares'),
                      _buildDadosComplementares(),
                      const SizedBox(height: 32),
                      
                      _buildSectionTitle('Endereço'),
                      _buildEndereco(),
                      const SizedBox(height: 32),
                      
                      _buildSectionTitle('Redes Sociais & Contatos'),
                      _buildRedesSociais(),
                      const SizedBox(height: 48),
                      
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          OutlinedButton(
                            onPressed: () {},
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                              side: const BorderSide(color: AppColors.borderColor),
                              foregroundColor: AppColors.textMain,
                            ),
                            child: const Text('Cancelar'),
                          ),
                          const SizedBox(width: 16),
                          ElevatedButton(
                            onPressed: _isSaving ? null : _salvarCadastro,
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                            ),
                            child: _isSaving 
                              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : const Text('Salvar Cadastro'),
                          ),
                        ],
                      )
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24.0),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: AppColors.primaryLight,
        ),
      ),
    );
  }

  Widget _buildDadosPessoais() {
    return Wrap(
      spacing: 24,
      runSpacing: 24,
      children: [
        _buildField(
          label: 'Nome Completo', 
          width: double.infinity,
          child: TextFormField(controller: _nomeController, decoration: const InputDecoration(hintText: 'Ex: João da Silva'), validator: (v) => v!.isEmpty ? 'Campo obrigatório' : null),
        ),
        _buildField(
          label: 'Sexo', 
          width: 300,
          child: DropdownButtonFormField<String>(
            value: _sexo,
            items: ['Masculino', 'Feminino', 'Não Informado'].map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
            onChanged: (v) => setState(() => _sexo = v),
            decoration: const InputDecoration(hintText: 'Selecione...'),
          ),
        ),
        _buildField(
          label: 'Data de Nascimento',
          width: 300,
          child: TextFormField(
            controller: _dataNascController,
            decoration: const InputDecoration(
              hintText: 'DD/MM/AAAA',
              suffixIcon: Icon(Icons.calendar_today, size: 18, color: AppColors.textMuted),
            ),
          ),
        ),
        _buildField(
          label: 'E-mail',
          width: 300,
          child: TextFormField(controller: _emailController, decoration: const InputDecoration(hintText: 'exemplo@email.com')),
        ),
        _buildField(
          label: 'Celular',
          width: 300,
          child: TextFormField(controller: _celularController, decoration: const InputDecoration(hintText: '(00) 00000-0000')),
        ),
        _buildField(
          label: 'Matrícula do Rol',
          width: 300,
          child: TextFormField(controller: _matriculaController, decoration: const InputDecoration(hintText: 'Número de matrícula')),
        ),
        _buildField(
          label: 'Data de Entrada',
          width: 300,
          child: TextFormField(
            controller: _dataEntradaController,
            decoration: const InputDecoration(
              hintText: 'DD/MM/AAAA',
              suffixIcon: Icon(Icons.calendar_today, size: 18, color: AppColors.textMuted),
            ),
          ),
        ),
        _buildField(
          label: 'Tipo de Arrolamento',
          width: 300,
          child: DropdownButtonFormField<String>(
            value: _arrolamento,
            items: ['Membro', 'Visitante', 'Batismo', 'Aclamação', 'Transferência'].map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
            onChanged: (v) => setState(() => _arrolamento = v),
            decoration: const InputDecoration(hintText: 'Selecione...'),
          ),
        ),
        _buildField(
          label: 'Observações sobre o Arrolamento',
          width: double.infinity,
          child: TextFormField(
            controller: _obsController,
            maxLines: 3,
            decoration: const InputDecoration(hintText: 'Insira observações relevantes aqui...'),
          ),
        ),
      ],
    );
  }

  Widget _buildDadosComplementares() {
    return Wrap(
      spacing: 24,
      runSpacing: 24,
      children: [
        _buildField(
          label: 'CPF',
          width: 300,
          child: TextFormField(controller: _cpfController, decoration: const InputDecoration(hintText: '000.000.000-00')),
        ),
        _buildField(
          label: 'RG',
          width: 300,
          child: TextFormField(controller: _rgController, decoration: const InputDecoration(hintText: 'Número do RG')),
        ),
        _buildField(
          label: 'Apelido',
          width: 300,
          child: TextFormField(controller: _apelidoController, decoration: const InputDecoration(hintText: 'Como gosta de ser chamado')),
        ),
        _buildField(
          label: 'Naturalidade',
          width: 300,
          child: TextFormField(controller: _naturalidadeController, decoration: const InputDecoration(hintText: 'Cidade - UF')),
        ),
        _buildField(
          label: 'Estado Civil',
          width: 300,
          child: DropdownButtonFormField<String>(
            value: _estadoCivil,
            items: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)'].map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
            onChanged: (v) => setState(() => _estadoCivil = v),
            decoration: const InputDecoration(hintText: 'Selecione...'),
          ),
        ),
        _buildField(
          label: 'Escolaridade',
          width: 300,
          child: DropdownButtonFormField<String>(
            value: _escolaridade,
            items: ['Ensino Fundamental', 'Ensino Médio', 'Ensino Superior', 'Pós-graduação', 'Mestrado', 'Doutorado'].map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
            onChanged: (v) => setState(() => _escolaridade = v),
            decoration: const InputDecoration(hintText: 'Selecione...'),
          ),
        ),
        _buildField(
          label: 'Tipo Sanguíneo',
          width: 300,
          child: DropdownButtonFormField<String>(
            value: _tipoSanguineo,
            items: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
            onChanged: (v) => setState(() => _tipoSanguineo = v),
            decoration: const InputDecoration(hintText: 'Selecione...'),
          ),
        ),
        _buildField(
          label: 'Doador de Órgãos?',
          width: 300,
          child: Align(
            alignment: Alignment.centerLeft,
            child: Switch(
              value: _doadorOrgaos,
              onChanged: (v) => setState(() => _doadorOrgaos = v),
              activeColor: Colors.white,
              activeTrackColor: AppColors.primaryLight,
              inactiveThumbColor: Colors.white,
              inactiveTrackColor: Colors.grey.shade300,
              trackOutlineColor: MaterialStateProperty.all(Colors.transparent),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildEndereco() {
    return Wrap(
      spacing: 24,
      runSpacing: 24,
      children: [
        _buildField(
          label: 'CEP',
          width: 300,
          child: TextFormField(
            controller: _cepController,
            onChanged: (v) {
              if (v.length >= 8) _buscarCep(v);
            },
            decoration: InputDecoration(
              hintText: '00000-000',
              suffixIcon: _isLoadingCep 
                ? const Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.search, size: 18, color: AppColors.textMuted),
            ),
          ),
        ),
        _buildField(
          label: 'Logradouro (Rua, Avenida, etc.)',
          width: 500,
          child: TextFormField(
            controller: _logradouroController,
            readOnly: true,
            decoration: const InputDecoration(fillColor: Color(0xFFF8F9FA)),
          ),
        ),
        _buildField(
          label: 'Bairro',
          width: 300,
          child: TextFormField(
            controller: _bairroController,
            readOnly: true,
            decoration: const InputDecoration(fillColor: Color(0xFFF8F9FA)),
          ),
        ),
        _buildField(
          label: 'Cidade',
          width: 300,
          child: TextFormField(
            controller: _cidadeController,
            readOnly: true,
            decoration: const InputDecoration(fillColor: Color(0xFFF8F9FA)),
          ),
        ),
        _buildField(
          label: 'UF',
          width: 150,
          child: TextFormField(
            controller: _ufController,
            readOnly: true,
            decoration: const InputDecoration(fillColor: Color(0xFFF8F9FA)),
          ),
        ),
        _buildField(
          label: 'Número',
          width: 150,
          child: TextFormField(controller: _numeroController, decoration: const InputDecoration(hintText: 'Ex: 123')),
        ),
        _buildField(
          label: 'Complemento',
          width: 300,
          child: TextFormField(controller: _complementoController, decoration: const InputDecoration(hintText: 'Apto, Bloco, etc.')),
        ),
      ],
    );
  }

  Widget _buildRedesSociais() {
    return Wrap(
      spacing: 24,
      runSpacing: 24,
      children: [
        _buildField(
          label: 'Site',
          width: 300,
          child: TextFormField(controller: _siteController, decoration: const InputDecoration(hintText: 'www.site.com')),
        ),
        _buildField(
          label: 'Instagram',
          width: 300,
          child: TextFormField(controller: _instagramController, decoration: const InputDecoration(hintText: '@usuario')),
        ),
        _buildField(
          label: 'Facebook',
          width: 300,
          child: TextFormField(controller: _facebookController, decoration: const InputDecoration(hintText: 'Perfil Facebook')),
        ),
        _buildField(
          label: 'Nome p/ Recado',
          width: 300,
          child: TextFormField(controller: _nomeRecadoController, decoration: const InputDecoration(hintText: 'Com quem deixar recado?')),
        ),
        _buildField(
          label: 'Telefone para Recado',
          width: 300,
          child: TextFormField(controller: _telefoneRecadoController, decoration: const InputDecoration(hintText: '(00) 00000-0000')),
        ),
      ],
    );
  }

  Widget _buildField({required String label, required double width, required Widget child}) {
    return LayoutBuilder(
      builder: (context, constraints) {
        // Se a largura for "infinita" ou já mapeada, usa ela. Senão pega proporção de colunas.
        double finalWidth = width;
        if (width != double.infinity && constraints.maxWidth > 800) {
          // Em desktop grande, simula grid de 3 colunas
          finalWidth = (constraints.maxWidth - 48) / 3; 
          // Se o width original for 500 (tipo endereço), ocupa 2 terços
          if (width > 400 && width != double.infinity) {
            finalWidth = ((constraints.maxWidth - 48) / 3) * 2 + 24;
          }
        } else if (width != double.infinity) {
          // No mobile ou tablet, deixa ocupar 100% ou a largura padrão
          finalWidth = constraints.maxWidth;
        }

        return ConstrainedBox(
          constraints: BoxConstraints(maxWidth: finalWidth),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  color: Color(0xFF555555),
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 6),
              child,
            ],
          ),
        );
      }
    );
  }
}
