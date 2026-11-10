import { prisma } from '../db/prisma';
import { FireIncidentDto } from '../types';
import { FireService } from './fireService';
import { AppError } from '../middleware/errorHandler';

export class IncidentService {
  public static async listIncidents(params: {
    status?: string;
    minLat?: number;
    maxLat?: number;
    minLon?: number;
    maxLon?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ items: FireIncidentDto[]; total: number }> {
    const where: any = {};

    if (params.status) {
      where.status = params.status;
    }
    if (params.minLat !== undefined && params.maxLat !== undefined) {
      where.latitude = { gte: params.minLat, lte: params.maxLat };
    }
    if (params.minLon !== undefined && params.maxLon !== undefined) {
      where.longitude = { gte: params.minLon, lte: params.maxLon };
    }

    const limit = Math.min(params.limit || 100, 500);
    const offset = params.offset || 0;

    const [incidents, total] = await Promise.all([
      prisma.fireIncident.findMany({
        where,
        orderBy: { peakFrp: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.fireIncident.count({ where })
    ]);

    const items: FireIncidentDto[] = incidents.map((inc) => ({
      id: inc.id,
      name: inc.name,
      centroidLat: inc.latitude,
      centroidLon: inc.longitude,
      firstObservedAt: inc.firstObservedAt.toISOString(),
      lastObservedAt: inc.lastObservedAt.toISOString(),
      status: inc.status,
      observationCount: inc.observationCount,
      peakFrp: inc.peakFrp || 0,
      totalFrp: inc.totalFrp || 0,
      region: inc.region,
      estimatedPerimeter: inc.estimatedPerimeter
    }));

    return { items, total };
  }

  public static async getIncidentById(id: string) {
    const inc = await prisma.fireIncident.findUnique({
      where: { id },
      include: {
        observations: {
          orderBy: { frp: 'desc' }
        }
      }
    });

    if (!inc) {
      throw new AppError('Fire incident cluster not found', 404);
    }

    return {
      id: inc.id,
      name: inc.name,
      centroidLat: inc.latitude,
      centroidLon: inc.longitude,
      firstObservedAt: inc.firstObservedAt.toISOString(),
      lastObservedAt: inc.lastObservedAt.toISOString(),
      status: inc.status,
      observationCount: inc.observationCount,
      peakFrp: inc.peakFrp || 0,
      totalFrp: inc.totalFrp || 0,
      region: inc.region,
      estimatedPerimeter: inc.estimatedPerimeter,
      observations: inc.observations.map(FireService.enrichObservation)
    };
  }
}

