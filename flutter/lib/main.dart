import 'package:flutter/material.dart';
import 'screens/main_screen.dart';

void main() {
  runApp(const GiftMsgApp());
}

class GiftMsgApp extends StatelessWidget {
  const GiftMsgApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'GiftMsg',
      theme: ThemeData(
        primarySwatch: Colors.pink,
        fontFamily: 'Montserrat',
      ),
      home: const MainScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}
