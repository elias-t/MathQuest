import { IsIn, IsOptional } from 'class-validator';
import type { GenerationDirection } from '../problems.service';

export class GenerateNextDto {
  @IsOptional()
  @IsIn(['harder', 'easier', 'similar', 'scaffold'])
  direction?: GenerationDirection = 'harder';
}
