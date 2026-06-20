import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';

export type GenerationDirection = 'harder' | 'easier' | 'similar' | 'scaffold';

interface GenerateNextResult {
  description: string;
  machine_form: string;
  problem_type: string;
  variable: string;
  correct_answer: string;
  difficulty: number;
  solution_steps: string[];
  new_skill: string;
}

@Injectable()
export class ProblemsService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  findAll() {
    return this.prisma.problem.findMany({
      include: {
        createdBy: {
          select: { id: true, email: true, displayName: true, role: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, email: true, displayName: true, role: true },
        },
      },
    });
    if (!problem) throw new NotFoundException('Problem not found');
    return problem;
  }

  async create(dto: CreateProblemDto, userId: string) {
    const problem = await this.prisma.problem.create({
      data: { ...dto, createdById: userId },
    });

    void this.aiService.indexProblem(
      problem.id,
      problem.title,
      problem.description,
      problem.topic,
      problem.difficulty,
    );

    return problem;
  }

  async update(id: string, dto: UpdateProblemDto, userId: string) {
    const problem = await this.prisma.problem.findUnique({ where: { id } });
    if (!problem) throw new NotFoundException('Problem not found');
    if (problem.createdById !== userId)
      throw new ForbiddenException('Not the owner');
    return this.prisma.problem.update({ where: { id }, data: dto });
  }

  async remove(id: string, userId: string) {
    const problem = await this.prisma.problem.findUnique({ where: { id } });
    if (!problem) throw new NotFoundException('Problem not found');
    if (problem.createdById !== userId)
      throw new ForbiddenException('Not the owner');
    return this.prisma.problem.delete({ where: { id } });
  }

  async generateAndPersist(
    sourceProblemId: string,
    direction: GenerationDirection,
  ): Promise<any> {
    const source = await this.prisma.problem.findUnique({
      where: { id: sourceProblemId },
    });
    if (!source) throw new NotFoundException('Problem not found');

    const result: GenerateNextResult | null = await this.aiService.generateNext(
      source.description,
      source.machineForm,
      source.variable,
      source.topic,
      source.difficulty,
      direction,
    );
    if (!result) return null;

    const deltaMap: Record<GenerationDirection, number> = {
      harder: 1,
      easier: -1,
      scaffold: -1,
      similar: 0,
    };
    const delta = deltaMap[direction] ?? 0;
    const newDifficulty = Math.min(10, Math.max(1, source.difficulty + delta));

    const newProblem = await this.prisma.problem.create({
      data: {
        title: `Practice: ${result.new_skill ?? source.topic}`,
        description: result.description,
        topic: source.topic,
        difficulty: newDifficulty,
        ageGroup: source.ageGroup,
        correctAnswer: result.correct_answer,
        hints: result.solution_steps.join('\n'),
        createdById: source.createdById,
        aiGenerated: true,
        machineForm: result.machine_form,
        variable: result.variable,
      },
    });

    void this.aiService.indexProblem(
      newProblem.id,
      newProblem.title,
      newProblem.description,
      newProblem.topic,
      newProblem.difficulty,
    );

    return newProblem;
  }

  async recommend(studentId: string, lastProblemId?: string): Promise<any> {
    const submissions = await this.prisma.submission.findMany({
      where: { studentId },
      include: { problem: { select: { topic: true } } },
    });

    const map = new Map<string, { correct: number; total: number }>();
    for (const s of submissions) {
      const t = s.problem.topic;
      const entry = map.get(t) ?? { correct: 0, total: 0 };
      entry.total += 1;
      if (s.isCorrect) entry.correct += 1;
      map.set(t, entry);
    }
    const topicPerformance = Array.from(map.entries()).map(([topic, v]) => ({
      topic,
      correct: v.correct,
      total: v.total,
    }));

    const result = await this.aiService.getRecommendation(
      studentId,
      topicPerformance,
      lastProblemId,
    );
    return result;
  }

  async getHint(problemId: string, previousHints: string[]): Promise<any> {
    const problem = await this.prisma.problem.findUnique({
      where: { id: problemId },
    });
    if (!problem) throw new NotFoundException('Problem not found');
    const result = await this.aiService.getHint(
      problem.description,
      problem.correctAnswer,
      previousHints,
    );
    if (!result)
      throw new ServiceUnavailableException('AI hint service unavailable');
    return result;
  }

  async getStats(problemId: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { id: problemId },
    });
    if (!problem) throw new NotFoundException('Problem not found');

    const submissions = await this.prisma.submission.findMany({
      where: { problemId },
      orderBy: { createdAt: 'asc' },
    });

    const totalSubmissions = submissions.length;

    const studentIds = new Set(submissions.map((s) => s.studentId));
    const studentsAttempted = studentIds.size;

    const studentsCorrect = new Set(
      submissions.filter((s) => s.isCorrect).map((s) => s.studentId),
    ).size;

    const successRate =
      studentsAttempted === 0
        ? 0
        : Math.round((studentsCorrect / studentsAttempted) * 100);

    const attemptsByStudent: number[] = [];
    for (const sid of studentIds) {
      const studentSubs = submissions.filter((s) => s.studentId === sid);
      const firstCorrect = studentSubs.find((s) => s.isCorrect);
      if (firstCorrect) {
        attemptsByStudent.push(firstCorrect.attemptNumber);
      }
    }
    const avgAttemptsToSolve =
      attemptsByStudent.length === 0
        ? 0
        : Math.round(
            (attemptsByStudent.reduce((a, b) => a + b, 0) /
              attemptsByStudent.length) *
              10,
          ) / 10;

    const avgTimeTaken =
      totalSubmissions === 0
        ? 0
        : Math.round(
            submissions.reduce((acc, s) => acc + s.timeTaken, 0) /
              totalSubmissions,
          );

    return {
      totalSubmissions,
      studentsAttempted,
      studentsCorrect,
      successRate,
      avgAttemptsToSolve,
      avgTimeTaken,
    };
  }
}
