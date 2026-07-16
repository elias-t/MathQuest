import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getStudentBreakdown(studentId: string) {
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        createdAt: true,
      },
    });
    if (!student) throw new NotFoundException('Student not found');
    if (student.role !== 'STUDENT') {
      throw new BadRequestException('User is not a student');
    }

    const submissions = await this.prisma.submission.findMany({
      where: { studentId },
      include: {
        problem: {
          select: {
            id: true,
            title: true,
            topic: true,
            difficulty: true,
            aiGenerated: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const byProblem = new Map<string, typeof submissions>();
    for (const s of submissions) {
      const list = byProblem.get(s.problemId) ?? [];
      list.push(s);
      byProblem.set(s.problemId, list);
    }

    const solved: any[] = [];
    const failed: any[] = [];
    const aiGenerated: any[] = [];

    for (const [problemId, attempts] of byProblem.entries()) {
      const problem = attempts[0].problem;
      const gotItRight = attempts.some(a => a.isCorrect);
      const attemptCount = attempts.length;
      const latestAttempt = attempts[attempts.length - 1];

      const summary = {
        problemId,
        title: problem.title,
        topic: problem.topic,
        difficulty: problem.difficulty,
        attempts: attemptCount,
        isCorrect: gotItRight,
        lastAttemptAt: latestAttempt.createdAt,
      };

      if (gotItRight) {
        solved.push(summary);
      } else if (attemptCount >= 3) {
        failed.push(summary);
      }

      if (problem.aiGenerated) {
        aiGenerated.push(summary);
      }
    }

    const totalSubmissions = submissions.length;
    const totalProblems = byProblem.size;
    const successRate = totalProblems === 0
      ? 0
      : Math.round((solved.length / totalProblems) * 100);

    return {
      student,
      stats: {
        totalSubmissions,
        totalProblems,
        successRate,
        solvedCount: solved.length,
        failedCount: failed.length,
        aiGeneratedCount: aiGenerated.length,
      },
      solved,
      failed,
      aiGenerated,
    };
  }

  findAll(role?: string) {
    return this.prisma.user.findMany({
      where: role ? { role: role as any } : undefined,
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        createdAt: true,
      },
      orderBy: { displayName: 'asc' },
    });
  }
}
