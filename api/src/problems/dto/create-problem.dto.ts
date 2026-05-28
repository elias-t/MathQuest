import { IsInt, Max, Min } from 'class-validator';

export class CreateProblemDto {
  title: string;
  description: string;
  topic: string;
  @IsInt()
  @Min(1)
  @Max(10)
  difficulty: number;
  ageGroup: string;
  correctAnswer: string;
  hints: string;
}
