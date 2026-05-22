import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProblemsModule } from './problems/problems.module';
import { SubmissionsModule } from './submissions/submissions.module';

@Module({
  imports: [PrismaModule, AuthModule, ProblemsModule, SubmissionsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
