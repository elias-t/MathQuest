import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';

@Injectable()
export class SubmissionsService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  async create(dto: CreateSubmissionDto, studentId: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { id: dto.problemId },
    });
    if (!problem) throw new NotFoundException('Problem not found');

    const aiResult = await this.aiService.validateAnswer(
      problem.description,
      dto.answer,
      problem.correctAnswer,
    );

    const isCorrect = aiResult
      ? aiResult.is_correct
      : dto.answer.trim().toLowerCase() === problem.correctAnswer.trim().toLowerCase();

    const aiFeedback = aiResult
      ? `${aiResult.feedback} ${aiResult.encouragement}`.trim()
      : null;

    const previousAttempts = await this.prisma.submission.count({
      where: { problemId: dto.problemId, studentId },
    });

    const savedSubmission = await this.prisma.submission.create({
      data: {
        answer: dto.answer,
        timeTaken: dto.timeTaken,
        isCorrect,
        aiFeedback,
        attemptNumber: previousAttempts + 1,
        problemId: dto.problemId,
        studentId,
      },
    });

    const allSubmissions = await this.prisma.submission.findMany({
      where: { studentId },
      include: { problem: { select: { topic: true } } },
    });

    const topicMap = new Map<string, { correct: number; total: number }>();
    for (const s of allSubmissions) {
      const topic = s.problem.topic;
      const entry = topicMap.get(topic) ?? { correct: 0, total: 0 };
      entry.total += 1;
      if (s.isCorrect) entry.correct += 1;
      topicMap.set(topic, entry);
    }

    const topicPerformance = Array.from(topicMap.entries()).map(
      ([topic, { correct, total }]) => ({ topic, correct, total }),
    );

    const recommendation = await this.aiService.getRecommendation(
      topicPerformance,
      problem.id,
    );

    return { ...savedSubmission, recommendation: recommendation ?? null };
  }

  findMySubmissions(studentId: string) {
    return this.prisma.submission.findMany({
      where: { studentId },
      include: {
        problem: { select: { title: true, topic: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByProblem(problemId: string, teacherId: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { id: problemId },
    });
    if (!problem) throw new NotFoundException('Problem not found');
    if (problem.createdById !== teacherId) throw new ForbiddenException('Not the owner');

    return this.prisma.submission.findMany({
      where: { problemId },
      include: {
        student: { select: { displayName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
