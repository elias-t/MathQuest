import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface ValidationResult {
  is_correct: boolean;
  feedback: string;
  encouragement: string;
}

interface HintResult {
  hint: string;
  hint_level: number;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

  constructor(private httpService: HttpService) { }

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
      this.logger.error('AI validation failed', (error as Error).message);
      return null;
    }
  }

  async indexProblem(
    problemId: string,
    title: string,
    description: string,
    topic: string,
    difficulty: number,
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(`${this.aiUrl}/rag/index`, {
          problem_id: problemId,
          title,
          description,
          topic,
          difficulty,
        }),
      );
    } catch (error) {
      this.logger.error('RAG indexing failed: ' + JSON.stringify({
        message: (error as any).message,
        status: (error as any)?.response?.status,
        data: (error as any)?.response?.data,
      }));
    }
  }

  async getRecommendation(
    topicPerformance: { topic: string; correct: number; total: number }[],
    lastProblemId?: string,
  ): Promise<Record<string, unknown> | null> {
    try {
      this.logger.log('RAG payload: ' + JSON.stringify({
        student_id: '',
        topic_performance: topicPerformance,
        last_problem_id: lastProblemId ?? null,
      }));
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiUrl}/rag/recommend`, {
          student_id: '',
          topic_performance: topicPerformance,
          last_problem_id: lastProblemId ?? null,
        }),
      );
      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        this.logger.log('No recommendation available — not enough candidates');
        return null;
      }
      this.logger.error('RAG recommendation failed', (error as Error).message);
      return null;
    }
  }

  async getHint(
    problem: string,
    correctAnswer: string,
    previousHints: string[],
  ): Promise<HintResult | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiUrl}/hint`, {
          problem,
          correct_answer: correctAnswer,
          previous_hints: previousHints,
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error('AI hint failed', (error as Error).message);
      return null;
    }
  }
}
