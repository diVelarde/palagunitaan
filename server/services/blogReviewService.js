const blogPostModel = require('../models/blogPostModel');
const editorialActionModel = require('../models/editorialActionModel');
const notificationService = require('./notificationService');

class BlogReviewError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

async function reviewPost({ postId, reviewerId, decision, reason }) {
  const post = await blogPostModel.findById(postId, { userId: reviewerId, role: 'validator' });
  if (!post) throw new BlogReviewError('Post not found.', 404);
  if (Number(post.user_id) === Number(reviewerId)) {
    throw new BlogReviewError('You cannot review your own post.', 403);
  }
  if (post.status !== 'pending') {
    throw new BlogReviewError('This post is not awaiting review.', 409);
  }
  if (!['approved', 'rejected'].includes(decision)) {
    throw new BlogReviewError('Decision must be "approved" or "rejected".', 400);
  }
  if (decision === 'rejected' && (typeof reason !== 'string' || !reason.trim())) {
    throw new BlogReviewError('A reason is required when rejecting a blog post.', 400);
  }

  const status = decision === 'approved' ? 'published' : 'rejected';
  const rejectionReason = decision === 'rejected' ? reason.trim() : null;
  const updatedPost = await blogPostModel.markReviewed(postId, {
    status,
    reviewedBy: reviewerId,
    reason: rejectionReason,
  });
  const action = await editorialActionModel.create({
    blogPostId: postId,
    validatorId: reviewerId,
    actionType: decision,
    comment: rejectionReason,
  });

  try {
    await notificationService.notifyBlogDecision({
      userId: post.user_id,
      postTitle: post.title,
      decision,
      reason: rejectionReason,
    });
  } catch (err) {
    console.error('Failed to notify author for blog post', postId, err.message);
  }

  return { post: updatedPost, action };
}

module.exports = { reviewPost, BlogReviewError };
