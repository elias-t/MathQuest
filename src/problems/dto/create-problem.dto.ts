export class CreateProblemDto {
  title: string;
  description: string;
  topic: string;
  difficulty: number;
  ageGroup: string;
  correctAnswer: string;
  hints: string;
}