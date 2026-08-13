/// Limites de tamanho dos campos de texto livre do formulário (ocasião e relacionamento).
///
/// Espelha `docs/contracts/api-contracts.md` (`POST /messages`): `occasion`/`relationship` devem
/// ter entre 1 e 300 caracteres após `trim()`. Se esse limite mudar no contrato, atualize aqui.
class FormFieldLimits {
  const FormFieldLimits._();

  static const minLength = 1;
  static const maxLength = 300;
}
