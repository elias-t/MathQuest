import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface ValidationResult {
  is_correct: boolean;
  feedback: string;
  encouragement: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

  constructor(private httpService: HttpService) {}

  async validateAnswer(
    problem: string,
    studentAnswer: string,
    correctAnswer: string,
  ): Promise<ValidationResult | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiUrl}/validate`, {
          problem,
          student_answer: studentAnswer,
          correct_answer: correctAnswer,
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error('AI validation failed', error.message);
      return null;
    }
  }
}
