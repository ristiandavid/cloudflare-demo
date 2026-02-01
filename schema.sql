-- Pulse Database Schema

-- Table: feedback
-- Stores individual feedback items extracted from sources
CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  raw_text TEXT NOT NULL,
  sentiment REAL,
  urgency INTEGER,
  category TEXT,
  cluster_id TEXT
);

-- Table: clusters
-- Stores grouped/clustered feedback items
CREATE TABLE IF NOT EXISTS clusters (
  id TEXT PRIMARY KEY,
  summary TEXT,
  category TEXT,
  avg_sentiment REAL,
  avg_urgency REAL,
  count_today INTEGER DEFAULT 0,
  count_7d INTEGER DEFAULT 0,
  trend_score REAL DEFAULT 0,
  escalated INTEGER DEFAULT 0
);

-- Table: reports
-- Stores daily generated reports
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  summary TEXT,
  json TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_source ON feedback(source);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_cluster_id ON feedback(cluster_id);
CREATE INDEX IF NOT EXISTS idx_clusters_category ON clusters(category);
CREATE INDEX IF NOT EXISTS idx_clusters_escalated ON clusters(escalated);
