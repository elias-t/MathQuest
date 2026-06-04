import { IsInt, IsString, Max, Min } from 'class-validator';

export class CreateProblemDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsString()
  topic!: string;

  @IsInt()
  @Min(1)
  @Max(10)
  difficulty!: number;

  @IsString()
  ageGroup!: string;

  @IsString()
  correctAnswer!: string;

  @IsString()
  hints!: string;
}
