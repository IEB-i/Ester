import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../screens/novo_cadastro_screen.dart';
import '../screens/procurar_cadastro_screen.dart';

class AppLayout extends StatefulWidget {
  final Widget child;
  final String activeMenu;
  final String breadcrumb;

  const AppLayout({
    super.key,
    required this.child,
    this.activeMenu = 'dashboard',
    this.breadcrumb = '',
  });

  @override
  State<AppLayout> createState() => _AppLayoutState();
}

class _AppLayoutState extends State<AppLayout> {
  bool _isSidebarCollapsed = false;

  void _toggleSidebar() {
    setState(() {
      _isSidebarCollapsed = !_isSidebarCollapsed;
    });
  }

  @override
  Widget build(BuildContext context) {
    final bool isDesktop = MediaQuery.of(context).size.width >= 800;

    if (isDesktop) {
      return Scaffold(
        body: Row(
          children: [
            _buildSidebar(context, isDesktop),
            Expanded(
              child: Column(
                children: [
                  _buildTopbar(context, isDesktop),
                  Expanded(
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(32.0),
                      color: AppColors.background,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (widget.breadcrumb.isNotEmpty) ...[
                            Text(
                              widget.breadcrumb,
                              style: const TextStyle(
                                color: AppColors.primaryLight,
                                fontWeight: FontWeight.w500,
                                fontSize: 14,
                              ),
                            ),
                            const SizedBox(height: 16),
                          ],
                          Expanded(child: widget.child),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.breadcrumb.isEmpty ? 'IEBI' : widget.breadcrumb.split(' / ').last),
      ),
      drawer: Drawer(
        backgroundColor: AppColors.primaryDark,
        child: _buildSidebarContent(context, false),
      ),
      body: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16.0),
        color: AppColors.background,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (widget.breadcrumb.isNotEmpty) ...[
              Text(
                widget.breadcrumb,
                style: const TextStyle(
                  color: AppColors.primaryLight,
                  fontWeight: FontWeight.w500,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 16),
            ],
            Expanded(child: widget.child),
          ],
        ),
      ),
    );
  }

  Widget _buildTopbar(BuildContext context, bool isDesktop) {
    return Container(
      height: 60,
      decoration: const BoxDecoration(
        color: AppColors.primaryDark,
        boxShadow: [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 4,
            offset: Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              if (isDesktop) ...[
                IconButton(
                  icon: const Icon(Icons.menu, color: Colors.white),
                  onPressed: _toggleSidebar,
                ),
                const SizedBox(width: 8),
              ] else ...[
                IconButton(
                  icon: const Icon(Icons.menu, color: Colors.white),
                  onPressed: () => Scaffold.of(context).openDrawer(),
                ),
              ],
              const Text(
                'Igreja IEBI',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.notifications_outlined, color: Colors.white),
                onPressed: () {},
              ),
              const SizedBox(width: 16),
              const CircleAvatar(
                backgroundColor: AppColors.primaryLight,
                radius: 16,
                child: Text('AD', style: TextStyle(color: Colors.white, fontSize: 12)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSidebar(BuildContext context, bool isDesktop) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      width: _isSidebarCollapsed ? 64 : 200,
      color: AppColors.primaryDark,
      child: Column(
        children: [
          Container(
            height: 60,
            alignment: Alignment.center,
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: Colors.white12)),
            ),
            child: _isSidebarCollapsed
                ? Image.asset('legacy_web/assets/LogoBranco.png', height: 32)
                : Image.asset('legacy_web/assets/LogoBranco.png', height: 40),
          ),
          Expanded(child: _buildSidebarContent(context, _isSidebarCollapsed)),
        ],
      ),
    );
  }

  Widget _buildSidebarContent(BuildContext context, bool isCollapsed) {
    return ListView(
      padding: const EdgeInsets.symmetric(vertical: 16),
      children: [
        if (!isCollapsed)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: Colors.white.withOpacity(0.1)),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Row(
                children: [
                  const Icon(Icons.search, color: Colors.white70, size: 16),
                  const SizedBox(width: 8),
                  const Text('Buscar...', style: TextStyle(color: Colors.white70, fontSize: 13)),
                ],
              ),
            ),
          ),
        if (!isCollapsed) const SizedBox(height: 8),
        
        _ExpandableSidebarItem(
          icon: Icons.person_outline,
          title: 'Membresia',
          isSidebarCollapsed: isCollapsed,
          initiallyExpanded: false,
          level: 0,
          isActive: ['dashboard', 'gerenciamento', 'pessoa-nova', 'procurar-cadastro'].contains(widget.activeMenu),
          children: [
            _SidebarItem(
              icon: Icons.bar_chart_outlined,
              title: 'Dashboard',
              isActive: widget.activeMenu == 'dashboard',
              isCollapsed: isCollapsed,
              level: 1,
              onTap: () {},
            ),
            _SidebarItem(
              icon: Icons.speed_outlined,
              title: 'Gerenciamento',
              isActive: widget.activeMenu == 'gerenciamento',
              isCollapsed: isCollapsed,
              level: 1,
              onTap: () {},
            ),
            _ExpandableSidebarItem(
              icon: Icons.people_outline,
              title: 'Pessoas',
              isSidebarCollapsed: isCollapsed,
              initiallyExpanded: false,
              level: 1,
              isActive: ['pessoa-nova', 'procurar-cadastro'].contains(widget.activeMenu),
              children: [
                _SidebarItem(
                  icon: null,
                  title: 'Novo Cadastro',
                  isActive: widget.activeMenu == 'pessoa-nova',
                  isCollapsed: isCollapsed,
                  level: 2,
                  onTap: () {
                    if (widget.activeMenu != 'pessoa-nova') {
                      Navigator.pushReplacement(context, PageRouteBuilder(
                        pageBuilder: (context, animation, secondaryAnimation) => const NovoCadastroScreen(),
                        transitionDuration: Duration.zero,
                        reverseTransitionDuration: Duration.zero,
                      ));
                    }
                  },
                ),
                _SidebarItem(
                  icon: null,
                  title: 'Procurar Cadastro',
                  isActive: widget.activeMenu == 'procurar-cadastro',
                  isCollapsed: isCollapsed,
                  level: 2,
                  onTap: () {
                    if (widget.activeMenu != 'procurar-cadastro') {
                      Navigator.pushReplacement(context, PageRouteBuilder(
                        pageBuilder: (context, animation, secondaryAnimation) => const ProcurarCadastroScreen(),
                        transitionDuration: Duration.zero,
                        reverseTransitionDuration: Duration.zero,
                      ));
                    }
                  },
                ),
                _SidebarItem(
                  icon: null,
                  title: 'Alterar Arrolamentos',
                  isActive: widget.activeMenu == 'alterar-arrolamentos',
                  isCollapsed: isCollapsed,
                  level: 2,
                  onTap: () {},
                ),
                _SidebarItem(
                  icon: null,
                  title: 'Transferência Igreja',
                  isActive: widget.activeMenu == 'transferencia',
                  isCollapsed: isCollapsed,
                  level: 2,
                  onTap: () {},
                ),
                _SidebarItem(
                  icon: null,
                  title: 'Unificar Cadastros',
                  isActive: widget.activeMenu == 'unificar',
                  isCollapsed: isCollapsed,
                  level: 2,
                  onTap: () {},
                ),
                _SidebarItem(
                  icon: null,
                  title: 'Aprovação',
                  isActive: widget.activeMenu == 'aprovacao',
                  isCollapsed: isCollapsed,
                  level: 2,
                  onTap: () {},
                ),
              ],
            ),
          ],
        ),
      ],
    );
  }
}

class _ExpandableSidebarItem extends StatefulWidget {
  final IconData icon;
  final String title;
  final bool isSidebarCollapsed;
  final bool initiallyExpanded;
  final bool isActive;
  final int level;
  final List<Widget> children;

  const _ExpandableSidebarItem({
    required this.icon,
    required this.title,
    required this.isSidebarCollapsed,
    this.initiallyExpanded = false,
    this.isActive = false,
    this.level = 0,
    required this.children,
  });

  @override
  State<_ExpandableSidebarItem> createState() => _ExpandableSidebarItemState();
}

class _ExpandableSidebarItemState extends State<_ExpandableSidebarItem> {
  late bool _isExpanded;

  @override
  void initState() {
    super.initState();
    _isExpanded = widget.initiallyExpanded;
  }

  @override
  Widget build(BuildContext context) {
    if (widget.isSidebarCollapsed) {
      return _SidebarItem(
        icon: widget.icon,
        title: widget.title,
        isActive: widget.isActive,
        isCollapsed: true,
        level: widget.level,
        onTap: () {
          setState(() {
            _isExpanded = !_isExpanded;
          });
        },
      );
    }

    final double paddingLeft = 16.0 + (widget.level * 12.0);
    final Color textColor = widget.isActive ? AppColors.primaryLight : Colors.white70;
    
    Color bgColor = Colors.transparent;
    if (widget.isActive && widget.level == 0) {
      bgColor = Colors.white.withOpacity(0.05);
    } else if (_isExpanded && widget.level > 0) {
      bgColor = Colors.black.withOpacity(0.1); 
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        InkWell(
          onTap: () {
            setState(() {
              _isExpanded = !_isExpanded;
            });
          },
          hoverColor: Colors.white.withOpacity(0.1),
          child: Container(
            padding: EdgeInsets.only(
              left: widget.level == 0 ? paddingLeft - 3 : paddingLeft,
              right: 12, 
              top: 6, 
              bottom: 6
            ),
            decoration: BoxDecoration(
              color: bgColor,
              border: widget.level == 0 ? Border(
                left: BorderSide(
                  color: widget.isActive ? AppColors.primaryLight : Colors.transparent,
                  width: 3,
                ),
              ) : null,
            ),
            child: Row(
              children: [
                Icon(
                  widget.icon,
                  color: textColor,
                  size: 18,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    widget.title,
                    style: TextStyle(
                      color: textColor,
                      fontSize: 12,
                      fontWeight: widget.isActive ? FontWeight.w500 : FontWeight.w400,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Icon(
                  _isExpanded ? Icons.arrow_drop_up : Icons.arrow_drop_down,
                  color: textColor,
                  size: 18,
                ),
              ],
            ),
          ),
        ),
        AnimatedCrossFade(
          firstChild: Container(height: 0),
          secondChild: Column(
            children: widget.children,
          ),
          crossFadeState: _isExpanded ? CrossFadeState.showSecond : CrossFadeState.showFirst,
          duration: const Duration(milliseconds: 200),
        ),
      ],
    );
  }
}

class _SidebarItem extends StatelessWidget {
  final IconData? icon;
  final String title;
  final bool isActive;
  final bool isCollapsed;
  final int level;
  final VoidCallback onTap;

  const _SidebarItem({
    this.icon,
    required this.title,
    required this.isActive,
    required this.isCollapsed,
    this.level = 0,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    double paddingLeft = 16.0;
    if (!isCollapsed) {
      paddingLeft = 16.0 + (level * 12.0);
    }
    
    final bool hasLeftBorder = level == 0;
    if (hasLeftBorder && !isCollapsed) {
      paddingLeft -= 3.0; 
    }

    final Color textColor = isActive ? AppColors.primaryLight : Colors.white70;

    return InkWell(
      onTap: onTap,
      hoverColor: Colors.white.withOpacity(0.1),
      child: Container(
        padding: EdgeInsets.only(
          left: isCollapsed ? 0 : paddingLeft,
          right: isCollapsed ? 0 : 12,
          top: 6,
          bottom: 6,
        ),
        decoration: BoxDecoration(
          color: (isActive && level == 0) ? Colors.white.withOpacity(0.05) : Colors.transparent,
          border: hasLeftBorder ? Border(
            left: BorderSide(
              color: isActive ? AppColors.primaryLight : Colors.transparent,
              width: 3,
            ),
          ) : null,
        ),
        child: Row(
          mainAxisAlignment: isCollapsed ? MainAxisAlignment.center : MainAxisAlignment.start,
          children: [
            if (icon != null) ...[
              Icon(
                icon,
                color: textColor,
                size: isCollapsed ? 22 : 18,
              ),
              if (!isCollapsed) const SizedBox(width: 8),
            ] else if (!isCollapsed) ...[
              const SizedBox(width: 26), 
            ],
            if (!isCollapsed)
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    color: textColor,
                    fontSize: 12,
                    fontWeight: isActive ? FontWeight.w500 : FontWeight.w400,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
