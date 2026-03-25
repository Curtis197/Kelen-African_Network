-- ============================================================
-- Migration 015: Views + Materialized Views
-- ============================================================

-- ── 1. project_budget_summary (regular view) ───────────────
-- Aggregates payments per project in the project's currency.
-- Mixed-currency payments are flagged but not converted.

CREATE OR REPLACE VIEW project_budget_summary AS
SELECT
  p.id                        AS project_id,
  p.budget_total,
  p.budget_currency,

  -- Sum only payments in the same currency as the project
  COALESCE(SUM(
    CASE WHEN pay.currency = p.budget_currency THEN pay.amount ELSE 0 END
  ), 0)                       AS total_paid,

  -- Remaining budget (NULL if no budget set; never negative)
  CASE
    WHEN p.budget_total IS NOT NULL THEN
      GREATEST(0,
        p.budget_total - COALESCE(SUM(
          CASE WHEN pay.currency = p.budget_currency THEN pay.amount ELSE 0 END
        ), 0)
      )
    ELSE NULL
  END                         AS remaining,

  COUNT(pay.id)               AS payment_count,

  -- Flag if any payment uses a different currency
  BOOL_OR(
    pay.currency IS DISTINCT FROM p.budget_currency
    AND pay.currency IS NOT NULL
  )                           AS has_mixed_currencies

FROM user_projects p
LEFT JOIN project_payments pay ON pay.project_id = p.id
GROUP BY p.id;

-- ── 2. professional_top_projects (regular view) ────────────
-- Top verified+linked recommendations per professional.
-- Used in the client dashboard to show a pro's track record.
-- Adapted to actual recommendations column names.

CREATE OR REPLACE VIEW professional_top_projects AS
SELECT
  r.professional_id,
  r.id                         AS recommendation_id,
  r.project_description        AS project_title,
  r.budget_range,
  r.completion_date            AS project_date,
  r.photo_urls                 AS project_photos,
  r.created_at,
  ROW_NUMBER() OVER (
    PARTITION BY r.professional_id
    ORDER BY r.created_at DESC
  )                            AS rank
FROM recommendations r
WHERE r.verified = TRUE
  AND r.linked   = TRUE;

-- ── 3. professional_analytics_view (materialized) ─────────
-- Pre-aggregated per-professional analytics for the pro dashboard.
-- Refreshed hourly by a cron job.

CREATE MATERIALIZED VIEW professional_analytics_view AS
SELECT
  p.id                                    AS professional_id,

  -- Last 30 days
  COUNT(pv.id) FILTER (
    WHERE pv.created_at >= NOW() - INTERVAL '30 days'
  )                                       AS views_last_30_days,

  COUNT(pi.id) FILTER (
    WHERE pi.created_at >= NOW() - INTERVAL '30 days'
  )                                       AS clicks_last_30_days,

  -- Current calendar month
  COUNT(pv.id) FILTER (
    WHERE date_trunc('month', pv.created_at) = date_trunc('month', NOW())
  )                                       AS views_this_month,

  COUNT(pi.id) FILTER (
    WHERE date_trunc('month', pi.created_at) = date_trunc('month', NOW())
  )                                       AS clicks_this_month,

  -- Conversion rate (clicks / views, last 30 days)
  CASE
    WHEN COUNT(pv.id) FILTER (WHERE pv.created_at >= NOW() - INTERVAL '30 days') = 0
    THEN 0
    ELSE ROUND(
      (COUNT(pi.id) FILTER (WHERE pi.created_at >= NOW() - INTERVAL '30 days')::NUMERIC
       / COUNT(pv.id) FILTER (WHERE pv.created_at >= NOW() - INTERVAL '30 days')) * 100,
      2
    )
  END                                     AS conversion_rate_30d,

  -- Top traffic source (last 30 days)
  (
    SELECT source FROM profile_views pv2
    WHERE pv2.professional_id = p.id
      AND pv2.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY source
    ORDER BY COUNT(*) DESC
    LIMIT 1
  )                                       AS top_source,

  -- Top viewer country (last 30 days)
  (
    SELECT viewer_country FROM profile_views pv3
    WHERE pv3.professional_id = p.id
      AND pv3.created_at >= NOW() - INTERVAL '30 days'
      AND viewer_country IS NOT NULL
    GROUP BY viewer_country
    ORDER BY COUNT(*) DESC
    LIMIT 1
  )                                       AS top_viewer_country

FROM professionals p
LEFT JOIN profile_views       pv ON pv.professional_id = p.id
LEFT JOIN profile_interactions pi ON pi.professional_id = p.id
GROUP BY p.id;

-- Unique index required for REFRESH CONCURRENTLY
CREATE UNIQUE INDEX idx_analytics_view_pro ON professional_analytics_view(professional_id);

-- ── 4. platform_metrics_view (materialized) ────────────────
-- Platform-wide admin dashboard metrics.
-- Refreshed every 15 minutes by a cron job.

CREATE MATERIALIZED VIEW platform_metrics_view AS
SELECT
  -- User counts
  (SELECT COUNT(*) FROM users WHERE role = 'client')                    AS total_clients,
  (SELECT COUNT(*) FROM users WHERE role IN ('pro_africa','pro_europe')) AS total_professionals,
  (SELECT COUNT(*) FROM users WHERE role = 'admin')                     AS total_admins,

  -- Status distribution
  (SELECT COUNT(*) FROM professionals WHERE status = 'gold')            AS gold_count,
  (SELECT COUNT(*) FROM professionals WHERE status = 'silver')          AS silver_count,
  (SELECT COUNT(*) FROM professionals WHERE status = 'white')           AS white_count,
  (SELECT COUNT(*) FROM professionals WHERE status = 'red')             AS red_count,
  (SELECT COUNT(*) FROM professionals WHERE status = 'black')           AS black_count,

  -- Subscription counts
  (SELECT COUNT(*) FROM subscriptions WHERE status = 'active')          AS active_subscriptions,
  (SELECT COUNT(*) FROM subscriptions WHERE status = 'past_due')        AS past_due_subscriptions,

  -- Verification queue
  (SELECT COUNT(*) FROM verification_queue WHERE status = 'pending')    AS queue_pending,
  (SELECT COUNT(*) FROM verification_queue WHERE status = 'in_review')  AS queue_in_review,

  -- Activity last 30 days
  (SELECT COUNT(*) FROM profile_views
     WHERE created_at >= NOW() - INTERVAL '30 days')                    AS views_last_30_days,
  (SELECT COUNT(*) FROM profile_interactions
     WHERE created_at >= NOW() - INTERVAL '30 days')                    AS clicks_last_30_days,

  -- New users this week
  (SELECT COUNT(*) FROM users
     WHERE created_at >= NOW() - INTERVAL '7 days')                     AS new_users_this_week,

  -- Snapshot time
  NOW()                                                                  AS refreshed_at;

-- Unique index for REFRESH CONCURRENTLY
CREATE UNIQUE INDEX idx_platform_metrics_singleton ON platform_metrics_view((1));
