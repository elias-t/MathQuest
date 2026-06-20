import { Controller, Get, Query, Request, UseGuards, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import type { AuthRequest } from '../auth/auth-request.interface';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query('role') role: string, @Request() req: AuthRequest) {
    if (req.user.role !== 'TEACHER') {
      throw new ForbiddenException('Only teachers can list users');
    }
    return this.usersService.findAll(role);
  }
}
