ALTER TABLE editorial_actions
  MODIFY heritage_entry_id INT NULL,
  ADD COLUMN blog_post_id INT NULL,
  ADD CONSTRAINT fk_editorial_actions_blog_post
    FOREIGN KEY (blog_post_id) REFERENCES blog_posts(id)
    ON DELETE CASCADE;
