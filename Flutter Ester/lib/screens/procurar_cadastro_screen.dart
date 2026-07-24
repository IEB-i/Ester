import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../widgets/app_layout.dart';
import '../theme/app_colors.dart';
import 'novo_cadastro_screen.dart';

class ProcurarCadastroScreen extends StatefulWidget {
  const ProcurarCadastroScreen({super.key});

  @override
  State<ProcurarCadastroScreen> createState() => _ProcurarCadastroScreenState();
}

class _ProcurarCadastroScreenState extends State<ProcurarCadastroScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AppLayout(
      activeMenu: 'procurar-cadastro',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Pessoas - Procurar Cadastro',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.primaryLight),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Container(width: 4, height: 22, color: AppColors.primaryLight),
              const SizedBox(width: 12),
              const Text(
                'Procurar Cadastro',
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
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _buildToolbar(),
                  const Divider(height: 1, color: AppColors.borderColor),
                  Expanded(
                    child: _buildDataTable(),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildToolbar() {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Wrap(
        spacing: 16,
        runSpacing: 16,
        alignment: WrapAlignment.spaceBetween,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          // Search input
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 400),
            child: TextField(
              controller: _searchController,
              onChanged: (val) {
                setState(() {
                  _searchQuery = val.toLowerCase();
                });
              },
              decoration: InputDecoration(
                hintText: 'Pesquisar por nome ou celular...',
                prefixIcon: const Icon(Icons.search, color: AppColors.textMuted),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(6),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(6),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(6),
                  borderSide: const BorderSide(color: AppColors.primaryLight, width: 1.5),
                ),
              ),
            ),
          ),
          // Actions
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              OutlinedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.filter_alt_outlined, size: 18),
                label: const Text('Filtros'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  foregroundColor: AppColors.textMain,
                  side: BorderSide(color: Colors.grey.shade300),
                ),
              ),
              const SizedBox(width: 16),
              ElevatedButton.icon(
                onPressed: () {
                  Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const NovoCadastroScreen()));
                },
                icon: const Icon(Icons.add, size: 18),
                label: const Text('Nova Pessoa'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDataTable() {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance.collection('igrejas').doc('iebi').collection('pessoas').snapshots(),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return Center(child: Text('Erro ao carregar dados: ${snapshot.error}'));
        }

        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        final docs = snapshot.data?.docs ?? [];
        
        // Filter locally
        final filteredDocs = docs.where((doc) {
          final data = doc.data() as Map<String, dynamic>;
          final nome = (data['nome'] ?? '').toString().toLowerCase();
          final celular = (data['celular'] ?? '').toString().toLowerCase();
          return nome.contains(_searchQuery) || celular.contains(_searchQuery);
        }).toList();

        if (filteredDocs.isEmpty) {
          return const Center(
            child: Text('Nenhum cadastro encontrado.', style: TextStyle(color: AppColors.textMuted)),
          );
        }

        return SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: SingleChildScrollView(
            child: DataTable(
              headingRowColor: MaterialStateProperty.all(const Color(0xFFF8F9FA)),
              dataRowMinHeight: 56,
              dataRowMaxHeight: 56,
              headingTextStyle: const TextStyle(
                fontWeight: FontWeight.w600,
                color: Color(0xFF555555),
              ),
              columns: const [
                DataColumn(label: Text('Nome Completo')),
                DataColumn(label: Text('Celular')),
                DataColumn(label: Text('E-mail')),
                DataColumn(label: Text('Arrolamento')),
                DataColumn(label: Text('Ações')),
              ],
              rows: filteredDocs.map((doc) {
                final data = doc.data() as Map<String, dynamic>;
                return DataRow(
                  cells: [
                    DataCell(Text(data['nome'] ?? '-')),
                    DataCell(Text(data['celular'] ?? '-')),
                    DataCell(Text(data['email'] ?? '-')),
                    DataCell(
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primaryLight.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          data['arrolamento'] ?? '-',
                          style: const TextStyle(
                            color: AppColors.primaryLight,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      )
                    ),
                    DataCell(
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.remove_red_eye_outlined, size: 18, color: AppColors.textMuted),
                            onPressed: () {},
                            tooltip: 'Ver Detalhes',
                          ),
                          IconButton(
                            icon: const Icon(Icons.edit_outlined, size: 18, color: AppColors.primaryLight),
                            onPressed: () {},
                            tooltip: 'Editar',
                          ),
                          IconButton(
                            icon: const Icon(Icons.delete_outline, size: 18, color: Colors.red),
                            onPressed: () {},
                            tooltip: 'Excluir',
                          ),
                        ],
                      ),
                    ),
                  ],
                );
              }).toList(),
            ),
          ),
        );
      },
    );
  }
}
