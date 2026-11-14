ALTER TABLE blog_posts
  ADD COLUMN status ENUM('pending', 'published', 'rejected') NOT NULL DEFAULT 'pending',
  ADD COLUMN reviewed_by INT NULL,
  ADD COLUMN reviewed_at DATETIME NULL,
  ADD COLUMN rejection_reason TEXT NULL,
  ADD CONSTRAINT fk_blog_posts_reviewed_by
    FOREIGN KEY (reviewed_by) REFERENCES users(id);

UPDATE blog_posts
SET status = 'published';
