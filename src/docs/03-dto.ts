import { IsEmpty, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { VALIDATION_GROUPS } from '../constants';
import { GenericDto } from '../dtos';

export class CountryDto extends GenericDto {
  @IsEmpty({
    groups: [VALIDATION_GROUPS.create]
  })
  id!: number;

  @IsOptional({
    groups: [VALIDATION_GROUPS.patch]
  })
  @MinLength(1, {
    groups: [VALIDATION_GROUPS.default]
  })
  @IsNotEmpty({
    groups: [VALIDATION_GROUPS.update, VALIDATION_GROUPS.create]
  })
  name!: string;

  @IsOptional({
    groups: [VALIDATION_GROUPS.patch]
  })
  @MinLength(1, {
    groups: [VALIDATION_GROUPS.default]
  })
  @IsNotEmpty({
    groups: [VALIDATION_GROUPS.update, VALIDATION_GROUPS.create]
  })
  code!: string;
}
