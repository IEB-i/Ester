import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'theme/app_theme.dart';
import 'screens/novo_cadastro_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.web,
  );
  runApp(const EsterApp());
}

class EsterApp extends StatelessWidget {
  const EsterApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ester - IEBI',
      theme: AppTheme.lightTheme,
      home: const NovoCadastroScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}
