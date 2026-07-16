import { IsInt, IsString, Min } from 'class-validator';

export class CreateSubmissionDto {
  @IsString()
  problemId!: string;

  @IsString()
  answer!: string;

  @IsInt()
  @Min(0)
  timeTaken!: number;
}
