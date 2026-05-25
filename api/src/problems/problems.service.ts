import { Injectable, NotFoundException, ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';

@Injectable()
export class ProblemsService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  findAll() {
    return this.prisma.problem.findMany({ include: { createdBy: true } });
  }

  async findOne(id: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { id },
      include: { createdBy: true },
    });
    if (!problem) throw new NotFoundException('Problem not found');
    return problem;
  }

  create(dto: CreateProblemDto, userId: string) {
    return this.prisma.problem.create({
      data: { ...dto, createdById: userId },
    });
  }

  async update(id: string, dto: UpdateProblemDto, userId: string) {
    const problem = await this.prisma.problem.findUnique({ where: { id } });
    if (!problem) throw new NotFoundException('Problem not found');
    if (problem.createdById !== userId) throw new ForbiddenException('Not the owner');
    return this.prisma.problem.update({ where: { id }, data: dto });
  }

  async remove(id: string, userId: string) {
    const problem = await this.prisma.problem.findUnique({ where: { id } });
    if (!problem) throw new NotFoundException('Problem not found');
    if (problem.createdById !== userId) throw new ForbiddenException('Not the owner');
    return this.prisma.problem.delete({ where: { id } });
  }

  async getHint(problemId: string, previousHints: string[]) {
    const problem = await this.prisma.problem.findUnique({ where: { id: problemId } });
    if (!problem) throw new NotFoundException('Problem not found');
    const result = await this.aiService.getHint(problem.description, previousHints);
    if (!result) throw new ServiceUnavailableException('AI hint service unavailable');
    return result;
  }
}
