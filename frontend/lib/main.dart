import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Gift Card Message Suggester',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const MessageSuggesterPage(),
    );
  }
}

class MessageSuggesterPage extends StatefulWidget {
  const MessageSuggesterPage({super.key});

  @override
  State<MessageSuggesterPage> createState() => _MessageSuggesterPageState();
}

class _MessageSuggesterPageState extends State<MessageSuggesterPage> {
  final TextEditingController _occasionController = TextEditingController();
  final TextEditingController _relationshipController = TextEditingController();
  
  List<String> _suggestions = [
    'Hope you love it!',
    'Enjoy your day!',
    'Happy holidays!',
  ];
  
  bool _isLoading = false;

  @override
  void dispose() {
    _occasionController.dispose();
    _relationshipController.dispose();
    super.dispose();
  }

  Future<void> _fetchSuggestions() async {
    if (_occasionController.text.isEmpty || _relationshipController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Por favor, preencha ambos os campos.')),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final url = Uri.parse('http://192.168.15.5:5000/v1/messager-sugester');
      print('Iniciando requisição para: $url');
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'occasion': _occasionController.text,
          'relationship': _relationshipController.text,
        }),
      ).timeout(const Duration(seconds: 10)); // Adicionado timeout de 10 segundos

      print('Status Code: ${response.statusCode}');
      print('Response Body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _suggestions = List<String>.from(data['result']);
        });
        
        // Limpar os campos após o sucesso
        _occasionController.clear();
        _relationshipController.clear();
        
        print('Sugestões atualizadas e inputs limpos: $_suggestions');
      } else {
        throw Exception('Erro na API (${response.statusCode}): ${response.body}');
      }
    } catch (e) {
      print('Erro capturado: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Gift Card Message Suggester',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: false,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Occasion Input
            const Text(
              'Occasion',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _occasionController,
              decoration: const InputDecoration(
                hintText: 'e.g., Birthday',
                border: OutlineInputBorder(),
                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
            ),
            const SizedBox(height: 16),

            // Relationship Input
            const Text(
              'Relationship',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _relationshipController,
              decoration: const InputDecoration(
                hintText: 'e.g., Mother',
                border: OutlineInputBorder(),
                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
            ),
            const SizedBox(height: 24),

            // Get Suggestions Button
            ElevatedButton(
              onPressed: _isLoading ? null : _fetchSuggestions,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue.shade700,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: _isLoading 
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                  )
                : const Text(
                    'Get suggestions',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
            ),
            const SizedBox(height: 24),

            // Suggestions Section
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.grey.shade200,
                  borderRadius: BorderRadius.circular(8),
                ),
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Suggestions:',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),
                    Expanded(
                      child: ListView.separated(
                        itemCount: _suggestions.length,
                        separatorBuilder: (context, index) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          return Container(
                            decoration: BoxDecoration(
                              color: Colors.white,
                              border: Border.all(color: Colors.blue.shade300),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                            child: Text(
                              '${index + 1}. ${_suggestions[index]}',
                              style: const TextStyle(fontSize: 16),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
