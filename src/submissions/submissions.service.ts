import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';

@Injectable()
export class SubmissionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSubmissionDto, studentId: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { id: dto.problemId },
    });
    if (!problem) throw new NotFoundException('Problem not found');

    const isCorrect =
      dto.answer.trim().toLowerCase() === problem.correctAnswer.trim().toLowerCase();

    const previousAttempts = await this.prisma.submission.count({
      where: { problemId: dto.problemId, studentId },
    });

    return this.prisma.submission.create({
      data: {
        answer: dto.answer,
        timeTaken: dto.timeTaken,
        isCorrect,
        attemptNumber: previousAttempts + 1,
        problemId: dto.problemId,
        studentId,
      },
    });
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
