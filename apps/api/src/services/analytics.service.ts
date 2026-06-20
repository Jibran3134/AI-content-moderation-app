import { Submission } from '../models/Submission';
import { Appeal } from '../models/Appeal';
import { Types } from 'mongoose';

export class AnalyticsService {
  /** /overview — totals + verdict distribution */
  async overview() {
    const [totalSubmissions, pendingAppeals, verdictAgg] = await Promise.all([
      Submission.countDocuments(),
      Appeal.countDocuments({ status: 'pending' }),
      Submission.aggregate([
        { $match: { verdict: { $exists: true } } },
        { $group: { _id: '$verdict.outcome', count: { $sum: 1 } } },
      ]),
    ]);

    const verdictDistribution: Record<string, number> = {
      approved: 0,
      flagged: 0,
      blocked: 0,
    };
    for (const row of verdictAgg) {
      if (row._id) verdictDistribution[row._id as string] = row.count as number;
    }

    return { totalSubmissions, pendingAppeals, verdictDistribution };
  }

  /** /submissions-over-time?period=7|30|90 — grouped by day */
  async submissionsOverTime(period: number) {
    const since = new Date();
    since.setDate(since.getDate() - period);

    const rows = await Submission.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', count: 1 } },
    ]);

    return rows;
  }

  /** /category-breakdown — per category, count of detected submissions */
  async categoryBreakdown() {
    const rows = await Submission.aggregate([
      { $match: { 'verdict.categoryResults': { $exists: true, $ne: [] } } },
      { $unwind: '$verdict.categoryResults' },
      { $match: { 'verdict.categoryResults.detected': true } },
      {
        $group: {
          _id: '$verdict.categoryResults.category',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$verdict.categoryResults.confidence' },
        },
      },
      { $sort: { count: -1 } },
      { $project: { _id: 0, category: '$_id', count: 1, avgConfidence: { $round: ['$avgConfidence', 1] } } },
    ]);

    return rows;
  }

  /** /appeals-summary */
  async appealsSummary() {
    const rows = await Appeal.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const summary: Record<string, number> = { total: 0, pending: 0, accepted: 0, rejected: 0 };
    for (const row of rows) {
      const status = row._id as string;
      summary[status] = row.count as number;
      summary.total += row.count as number;
    }
    return summary;
  }

  /** /user-rankings — top 10 by submission count */
  async userRankings() {
    return Submission.aggregate([
      { $group: { _id: '$userId', submissionCount: { $sum: 1 } } },
      { $sort: { submissionCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          userId: { $toString: '$_id' },
          email: '$user.email',
          submissionCount: 1,
        },
      },
    ]);
  }
}

export const analyticsService = new AnalyticsService();
