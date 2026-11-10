import { prisma } from '../db/prisma';

export class HistoryService {
  public static async getHistoricalStatistics(region?: string, periodType?: string) {
    const where: any = {};
    if (region && region !== 'all') {
      where.region = { contains: region, mode: 'insensitive' };
    }
    if (periodType) {
      where.periodType = periodType;
    }

    const records = await prisma.historicalFireStatistics.findMany({
      where,
      orderBy: { startDate: 'asc' }
    });

    return records.map((r) => ({
      id: r.id,
      region: r.region,
      periodType: r.periodType,
      startDate: r.startDate.toISOString(),
      endDate: r.endDate.toISOString(),
      observationCount: r.observationCount,
      averageFrp: r.averageFrp,
      peakFrp: r.peakFrp,
      source: r.source,
      aggregatedAt: r.aggregatedAt.toISOString()
    }));
  }
}

