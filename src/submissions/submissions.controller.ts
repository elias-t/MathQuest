import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  create(@Body() dto: CreateSubmissionDto, @Request() req: any) {
    if (req.user.role !== 'STUDENT') throw new ForbiddenException();
    return this.submissionsService.create(dto, req.user.userId);
  }

  @Get('my')
  findMySubmissions(@Request() req: any) {
    if (req.user.role !== 'STUDENT') throw new ForbiddenException();
    return this.submissionsService.findMySubmissions(req.user.userId);
  }

  @Get('problem/:problemId')
  findByProblem(@Param('problemId') problemId: string, @Request() req: any) {
    if (req.user.role !== 'TEACHER') throw new ForbiddenException();
    return this.submissionsService.findByProblem(problemId, req.user.userId);
  }
}
