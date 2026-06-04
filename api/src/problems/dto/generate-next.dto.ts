import { IsIn, IsOptional } from 'class-validator';

export class GenerateNextDto {
  @IsOptional()
  @IsIn(['harder', 'easier', 'similar', 'scaffold'])
  direction?: string = 'harder';
}
