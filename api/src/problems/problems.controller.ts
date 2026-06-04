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
import { JwtAuthGuard } from '../auth/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('problems')
export class ProblemsController {
  constructor(private readonly problemsService: ProblemsService) {}

  @Post()
  create(@Body() dto: CreateProblemDto, @Request() req: any) {
    if (req.user.role !== 'TEACHER') throw new ForbiddenException();
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
  update(@Param('id') id: string, @Body() dto: UpdateProblemDto, @Request() req: any) {
    if (req.user.role !== 'TEACHER') throw new ForbiddenException();
    return this.problemsService.update(id, dto, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    if (req.user.role !== 'TEACHER') throw new ForbiddenException();
    return this.problemsService.remove(id, req.user.userId);
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
