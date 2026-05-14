import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { appConfig } from './config/app.config';
import { authConfig } from './config/auth.config';
import { databaseConfig } from './config/database.config';
import { envFilePaths } from './config/env-file-paths';
import { validateEnv } from './config/env.schema';
import { HealthModule } from './health/health.module';
import { MessagesModule } from './messages/messages.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: envFilePaths,
      isGlobal: true,
      load: [appConfig, authConfig, databaseConfig],
      validate: validateEnv,
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    MessagesModule,
  ],
})
export class AppModule {}
