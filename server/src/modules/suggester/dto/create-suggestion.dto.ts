import {
  IsString,
  IsNotEmpty,
  Length,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TargetLanguage {
  PT_BR = 'pt-BR',
  EN_US = 'en-US',
}

export class CreateSuggestionDto {
  @ApiProperty({
    description: 'Festive occasion or event for the gift card',
    example: 'birthday',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: 'occasion is required' })
  @Length(2, 50, { message: 'occasion must be between 2 and 50 characters' })
  occasion: string;

  @ApiProperty({
    description: 'Relationship between the sender and recipient',
    example: 'friend',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: 'relationship is required' })
  @Length(2, 50, {
    message: 'relationship must be between 2 and 50 characters',
  })
  relationship: string;

  @ApiPropertyOptional({
    description: 'Target language for the generated message suggestions',
    enum: TargetLanguage,
    default: TargetLanguage.PT_BR,
    example: TargetLanguage.PT_BR,
  })
  @IsOptional()
  @IsEnum(TargetLanguage, {
    message: 'language must be either pt-BR or en-US',
  })
  language?: TargetLanguage = TargetLanguage.PT_BR;
}
