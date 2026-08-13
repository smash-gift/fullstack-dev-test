/// Erros lançados pela camada de rede (`ApiClient`) e propagados pelos repositórios.
sealed class ApiException implements Exception {
  const ApiException(this.message);

  final String message;

  @override
  String toString() => message;
}

/// Falha ao completar a requisição HTTP (sem conexão, timeout, DNS, etc.).
final class NetworkException extends ApiException {
  const NetworkException([
    super.message = 'Não foi possível conectar ao servidor.',
  ]);
}

/// O backend respondeu, mas com um status HTTP fora da faixa 2xx.
///
/// Quando o corpo da resposta segue o formato de erro documentado em
/// `docs/contracts/api-contracts.md` (`{"error": {"code", "message", "details"}}`), [code] e
/// [details] são preenchidos com os valores estruturados e [message] recebe a mensagem do backend
/// (não deve ser exibida diretamente ao usuário sem tradução — ver `code` para isso). Caso o corpo
/// não venha no formato esperado, [code] e [details] ficam `null` e [message] mantém o texto
/// genérico padrão.
final class ServerException extends ApiException {
  const ServerException(
    this.statusCode, [
    super.message = 'O servidor retornou um erro.',
    this.code,
    this.details,
  ]);

  final int statusCode;
  final String? code;
  final List<String>? details;
}

/// O backend respondeu com sucesso (2xx), mas o corpo não pôde ser interpretado como esperado.
final class UnexpectedResponseException extends ApiException {
  const UnexpectedResponseException([
    super.message = 'Recebemos uma resposta inesperada do servidor.',
  ]);
}
