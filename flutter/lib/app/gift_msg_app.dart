import 'package:flutter/material.dart';
import 'package:giftmsg/features/suggestions/data/suggestion_service.dart';
import 'package:giftmsg/features/suggestions/presentation/screens/main_screen.dart';

class GiftMsgApp extends StatelessWidget {
  const GiftMsgApp({super.key, required this.service});

  final SuggestionService service;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'GiftMsg',
      theme: ThemeData(
        primarySwatch: Colors.pink,
        fontFamily: 'Montserrat',
      ),
      home: MainScreen(service: service),
      debugShowCheckedModeBanner: false,
    );
  }
}