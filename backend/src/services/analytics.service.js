// src/services/analytics.service.js

import { Claim }     from "../models/claim.model.js";
import { User }      from "../models/user.model.js";
import { StpConfig } from "../models/stpConfig.model.js";
import { CLAIM_STATUS } from "../constants/appConstants.js";

/**
 * Master analytics aggregation.
 * Returns ALL data needed for the admin analytics page in a single call.
 * Runs all DB queries in parallel for maximum performance.
 *
 * @returns {object} Full analytics payload
 */
export const getAnalytics = async () => {
  const [
    claimStats,
    fraudTrend,
    fraudDistribution,
    userStats,
    recentClaims,
    stpConfig,
  ] = await Promise.all([
    getClaimStats(),
    getFraudTrend(),
    getFraudDistribution(),
    getUserStats(),
    getRecentClaims(),
    StpConfig.findOne().lean(),
  ]);

  return {
    claim_stats:        claimStats,
    fraud_trend:        fraudTrend,
    fraud_distribution: fraudDistribution,
    user_stats:         userStats,
    recent_claims:      recentClaims,
    stp_config:         stpConfig,
  };
};

/**
 * Returns total claim count and breakdown by status.
 * Also returns the overall average fraud score.
 *
 * @returns {object} {
 *   total, approved, rejected, pending, escalated,
 *   avg_fraud_score, approval_rate_percent
 * }
 */
const getClaimStats = async () => {
  const result = await Claim.aggregate([
    {
      $group: {
        _id:             null,
        total:           { $sum: 1 },
        approved:        { $sum: { $cond: [{ $eq: ["$claim_status", CLAIM_STATUS.APPROVED]  }, 1, 0] } },
        rejected:        { $sum: { $cond: [{ $eq: ["$claim_status", CLAIM_STATUS.REJECTED]  }, 1, 0] } },
        pending:         { $sum: { $cond: [{ $eq: ["$claim_status", CLAIM_STATUS.PENDING]   }, 1, 0] } },
        escalated:       { $sum: { $cond: [{ $eq: ["$claim_status", CLAIM_STATUS.ESCALATED] }, 1, 0] } },
        avg_fraud_score: { $avg: "$fraud_score" },
      },
    },
  ]);

  if (!result.length) {
    return {
      total: 0, approved: 0, rejected: 0,
      pending: 0, escalated: 0,
      avg_fraud_score: 0, approval_rate_percent: 0,
    };
  }

  const s = result[0];
  return {
    total:                s.total,
    approved:             s.approved,
    rejected:             s.rejected,
    pending:              s.pending,
    escalated:            s.escalated,
    avg_fraud_score:      parseFloat((s.avg_fraud_score || 0).toFixed(3)),
    approval_rate_percent: s.total > 0
      ? parseFloat(((s.approved / s.total) * 100).toFixed(1))
      : 0,
  };
};

/**
 * Returns average fraud score grouped by day for the last 30 days.
 * Used for the fraud trend line chart on the analytics page.
 *
 * @returns {Array<{ date: string, avg_fraud_score: number, claim_count: number }>}
 */
const getFraudTrend = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await Claim.aggregate([
    { $match: { created_at: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: {
          year:  { $year:  "$created_at" },
          month: { $month: "$created_at" },
          day:   { $dayOfMonth: "$created_at" },
        },
        avg_fraud_score: { $avg: "$fraud_score" },
        claim_count:     { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    {
      $project: {
        _id:  0,
        date: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: {
              $dateFromParts: {
                year: "$_id.year", month: "$_id.month", day: "$_id.day",
              },
            },
          },
        },
        avg_fraud_score: { $round: ["$avg_fraud_score", 3] },
        claim_count:     1,
      },
    },
  ]);

  return result;
};

/**
 * Buckets all claims by fraud score range.
 * Used for the fraud risk distribution bar/pie chart.
 *
 * @returns {object} {
 *   low: number,     // fraud_score 0.00 – 0.33
 *   medium: number,  // fraud_score 0.34 – 0.66
 *   high: number,    // fraud_score 0.67 – 1.00
 * }
 */
const getFraudDistribution = async () => {
  const result = await Claim.aggregate([
    {
      $group: {
        _id: null,
        low:    { $sum: { $cond: [{ $lte: ["$fraud_score", 0.33] }, 1, 0] } },
        medium: { $sum: { $cond: [{ $and: [
          { $gt:  ["$fraud_score", 0.33] },
          { $lte: ["$fraud_score", 0.66] },
        ]}, 1, 0] } },
        high:   { $sum: { $cond: [{ $gt: ["$fraud_score", 0.66] }, 1, 0] } },
      },
    },
  ]);

  if (!result.length) return { low: 0, medium: 0, high: 0 };

  const { low, medium, high } = result[0];
  return { low, medium, high };
};

/**
 * Returns total user count and new signups in the last 7 days.
 *
 * @returns {object} { total_users, new_users_last_7_days }
 */
const getUserStats = async () => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [total_users, new_users_last_7_days] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ created_at: { $gte: sevenDaysAgo } }),
  ]);

  return { total_users, new_users_last_7_days };
};

/**
 * Returns the 10 most recently submitted claims with user info populated.
 * Used for the recent claims table on the analytics page.
 *
 * @returns {Array} Array of claim objects with user_id populated
 */
const getRecentClaims = async () => {
  return Claim.find()
    .sort({ created_at: -1 })
    .limit(10)
    .select("claim_id claim_type claim_amount claim_status fraud_score created_at user_id")
    .lean();
};
