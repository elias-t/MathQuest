import { Controller, Get, Param, Query, Request, UseGuards, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import type { AuthRequest } from '../auth/auth-request.interface';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id/breakdown')
  getStudentBreakdown(@Param('id') id: string, @Request() req: AuthRequest) {
    if (req.user.role !== 'TEACHER') {
      throw new ForbiddenException('Only teachers can view student breakdowns');
    }
    return this.usersService.getStudentBreakdown(id);
  }

  @Get()
  findAll(@Query('role') role: string, @Request() req: AuthRequest) {
    if (req.user.role !== 'TEACHER') {
      throw new ForbiddenException('Only teachers can list users');
    }
    return this.usersService.findAll(role);
  }
}
