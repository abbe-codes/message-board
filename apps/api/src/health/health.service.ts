import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

type HealthStatus = 'ok' | 'error';

export interface HealthResponse {
  status: HealthStatus;
  timestamp: string;
  uptimeSeconds: number;
}

export interface ReadinessResponse extends HealthResponse {
  database: HealthStatus;
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  getLiveness(): HealthResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    };
  }

  async getReadiness(): Promise<ReadinessResponse> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        ...this.getLiveness(),
        database: 'ok',
      };
    } catch {
      return {
        status: 'error',
        database: 'error',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.round(process.uptime()),
      };
    }
  }
}
