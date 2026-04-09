import 'package:flutter/material.dart';
import 'package:giftmsg/app/gift_msg_app.dart';
import 'package:giftmsg/features/suggestions/data/suggestion_service.dart';

void main() {
  runApp(GiftMsgApp(service: SuggestionService()));
}
