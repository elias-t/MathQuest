import { Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

// Default-deny: strip password from every User query result.
// The only opt-back-in is the login bcrypt compare (auth.service.ts).
// Declared as a const so its literal type reaches the PrismaClient generic —
// that is what removes `password` from result types, not just runtime values.
const clientOptions = {
  omit: { user: { password: true } },
} satisfies Prisma.PrismaClientOptions;

@Injectable()
export class PrismaService
  extends PrismaClient<typeof clientOptions>
  implements OnModuleInit
{
  constructor() {
    super(clientOptions);
  }

  async onModuleInit() {
    await this.$connect();
  }
}
