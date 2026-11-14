CREATE TABLE IF NOT EXISTS content_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  target_type ENUM('entry', 'blog_post') NOT NULL,
  target_id INT NOT NULL,
  reporter_id INT NOT NULL,
  reason VARCHAR(100) NOT NULL,
  message TEXT NULL,
  status ENUM('open', 'closed') NOT NULL DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_content_reports_target (target_type, target_id, status, reporter_id),
  INDEX idx_content_reports_status_created (status, created_at),
  CONSTRAINT fk_content_reports_reporter
    FOREIGN KEY (reporter_id) REFERENCES users(id)
    ON DELETE CASCADE
);
