import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { GenerationDirection } from '../problems/problems.service';
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
    const attemptNumber = previousAttempts + 1;

    const priorCorrect = await this.prisma.submission.count({
      where: { problemId: dto.problemId, studentId, isCorrect: true },
    });

    const savedSubmission = await this.prisma.submission.create({
      data: {
        answer: dto.answer,
        timeTaken: dto.timeTaken,
        isCorrect,
        aiFeedback,
        attemptNumber,
        problemId: dto.problemId,
        studentId,
      },
    });

    let direction: GenerationDirection | null = null;
    if (isCorrect && priorCorrect === 0) {
      // advance to a harder problem only the FIRST time they solve this one
      direction = 'harder';
    } else if (!isCorrect && attemptNumber === 3) {
      // generate a scaffold exactly once, on the 3rd failed attempt
      direction = 'scaffold';
    }

    // Generation is DEFERRED to the client: the response returns only the
    // direction (fast — just the validation call), and the frontend calls
    // POST /problems/:id/generate-next when the student clicks "Next problem".
    // This keeps the slow (~4.5s) Claude generation off the submit path. The
    // gate above still fires at most once (first solve / 3rd miss), so a
    // student is offered a next problem exactly when they were before.
    return { ...savedSubmission, nextDirection: direction };
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
