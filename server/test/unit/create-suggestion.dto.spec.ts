import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  CreateSuggestionDto,
  TargetLanguage,
} from '../../src/modules/suggester/dto/create-suggestion.dto';

async function validateDto(raw: object) {
  const dto = plainToInstance(CreateSuggestionDto, raw);
  const errors = await validate(dto);
  return errors;
}

describe('CreateSuggestionDto — Validações (API-contract)', () => {
  it('deve ser válido com todos os campos corretos', async () => {
    const errors = await validateDto({
      occasion: 'birthday',
      relationship: 'friend',
      language: 'pt-BR',
    });
    expect(errors).toHaveLength(0);
  });

  it('deve falhar quando occasion está vazio', async () => {
    const errors = await validateDto({
      occasion: '',
      relationship: 'friend',
      language: 'pt-BR',
    });
    const occasionErrors = errors.find((e) => e.property === 'occasion');
    expect(occasionErrors).toBeDefined();
  });

  it('deve falhar quando occasion tem menos de 2 caracteres', async () => {
    const errors = await validateDto({
      occasion: 'b',
      relationship: 'friend',
      language: 'pt-BR',
    });
    const occasionErrors = errors.find((e) => e.property === 'occasion');
    expect(occasionErrors).toBeDefined();
    expect(Object.values(occasionErrors.constraints ?? {})).toContain(
      'occasion must be between 2 and 50 characters',
    );
  });

  it('deve falhar quando occasion tem mais de 50 caracteres', async () => {
    const errors = await validateDto({
      occasion: 'a'.repeat(51),
      relationship: 'friend',
      language: 'pt-BR',
    });
    const occasionErrors = errors.find((e) => e.property === 'occasion');
    expect(occasionErrors).toBeDefined();
    expect(Object.values(occasionErrors.constraints ?? {})).toContain(
      'occasion must be between 2 and 50 characters',
    );
  });

  it('deve falhar quando relationship está vazio', async () => {
    const errors = await validateDto({
      occasion: 'birthday',
      relationship: '',
      language: 'pt-BR',
    });
    const relationshipErrors = errors.find(
      (e) => e.property === 'relationship',
    );
    expect(relationshipErrors).toBeDefined();
  });

  it('deve falhar quando language tem valor inválido (fr-FR)', async () => {
    const errors = await validateDto({
      occasion: 'birthday',
      relationship: 'friend',
      language: 'fr-FR',
    });
    const languageErrors = errors.find((e) => e.property === 'language');
    expect(languageErrors).toBeDefined();
    expect(Object.values(languageErrors.constraints ?? {})).toContain(
      'language must be either pt-BR or en-US',
    );
  });

  it('deve usar pt-BR como default quando language é omitido', async () => {
    const errors = await validateDto({
      occasion: 'birthday',
      relationship: 'friend',
      // language omitido
    });
    expect(errors).toHaveLength(0);

    const dto = plainToInstance(CreateSuggestionDto, {
      occasion: 'birthday',
      relationship: 'friend',
    });
    expect(dto.language).toBe(TargetLanguage.PT_BR);
  });

  it('deve aceitar language en-US como valor válido', async () => {
    const errors = await validateDto({
      occasion: 'birthday',
      relationship: 'friend',
      language: 'en-US',
    });
    expect(errors).toHaveLength(0);
  });
});
