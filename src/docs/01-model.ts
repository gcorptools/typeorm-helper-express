import { capitalizeFirst } from '@gcorptools/typeorm-helper';
import { IsEmpty, IsOptional, MinLength, IsNotEmpty } from 'class-validator';
import { VALIDATION_GROUPS } from '../constants';
import { GenericModel } from '../models';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Country extends GenericModel {
  @IsEmpty({
    groups: [VALIDATION_GROUPS.create]
  })
  @PrimaryGeneratedColumn()
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
  @Column()
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
  @Column({ unique: true })
  code!: string;

  format(data: any): void {
    super.format(data);
    this.code = data.code.toUpperCase();
    this.name = capitalizeFirst(data.name);
  }
}
