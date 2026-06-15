import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ProblemsService } from './problems.service';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';
import { GetHintDto } from './dto/get-hint.dto';
import { GenerateNextDto } from './dto/generate-next.dto';
import { RecommendDto } from './dto/recommend.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import type { AuthRequest } from '../auth/auth-request.interface';

@UseGuards(JwtAuthGuard)
@Controller('problems')
export class ProblemsController {
  constructor(private readonly problemsService: ProblemsService) {}

  @Post()
  create(@Body() dto: CreateProblemDto, @Request() req: AuthRequest) {
    if (req.user.role !== 'TEACHER') throw new ForbiddenException('Only teachers can manage problems');
    return this.problemsService.create(dto, req.user.userId);
  }

  @Get()
  findAll() {
    return this.problemsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.problemsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProblemDto, @Request() req: AuthRequest) {
    if (req.user.role !== 'TEACHER') throw new ForbiddenException('Only teachers can manage problems');
    return this.problemsService.update(id, dto, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: AuthRequest) {
    if (req.user.role !== 'TEACHER') throw new ForbiddenException('Only teachers can manage problems');
    return this.problemsService.remove(id, req.user.userId);
  }

  @Post('recommend')
  async recommend(@Body() dto: RecommendDto = {}, @Request() req: AuthRequest) {
    if (req.user.role !== 'STUDENT') throw new ForbiddenException('Only students can request recommendations');
    const result = await this.problemsService.recommend(req.user.userId, dto?.lastProblemId);
    if (!result) throw new ServiceUnavailableException('No recommendation available yet');
    return result;
  }

  @Post(':id/hint')
  getHint(@Param('id') id: string, @Body() dto: GetHintDto) {
    return this.problemsService.getHint(id, dto.previousHints ?? []);
  }

  @Post(':id/generate-next')
  async generateNext(@Param('id') id: string, @Body() dto: GenerateNextDto) {
    const result = await this.problemsService.generateAndPersist(id, dto.direction ?? 'harder');
    if (!result) throw new ServiceUnavailableException('AI generation service unavailable');
    return result;
  }
}
