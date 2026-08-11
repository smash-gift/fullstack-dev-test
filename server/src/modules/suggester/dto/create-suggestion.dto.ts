import { IsString, IsNotEmpty, Length, IsEnum, IsOptional } from 'class-validator';

export enum TargetLanguage {
  PT_BR = 'pt-BR',
  EN_US = 'en-US',
}

export class CreateSuggestionDto {
  @IsString()
  @IsNotEmpty({ message: 'occasion is required' })
  @Length(2, 50, { message: 'occasion must be between 2 and 50 characters' })
  occasion: string;

  @IsString()
  @IsNotEmpty({ message: 'relationship is required' })
  @Length(2, 50, {
    message: 'relationship must be between 2 and 50 characters',
  })
  relationship: string;

  @IsOptional()
  @IsEnum(TargetLanguage, {
    message: 'language must be either pt-BR or en-US',
  })
  language?: TargetLanguage = TargetLanguage.PT_BR;
}
