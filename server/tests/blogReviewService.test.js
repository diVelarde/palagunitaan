jest.mock('../models/blogPostModel', () => ({
  findById: jest.fn(),
  markReviewed: jest.fn(),
}));
jest.mock('../models/editorialActionModel', () => ({
  create: jest.fn(),
}));
jest.mock('../services/notificationService', () => ({
  notifyBlogDecision: jest.fn(),
}));

const blogPostModel = require('../models/blogPostModel');
const editorialActionModel = require('../models/editorialActionModel');
const notificationService = require('../services/notificationService');
const { reviewPost, BlogReviewError } = require('../services/blogReviewService');

describe('blogReviewService.reviewPost', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    blogPostModel.findById.mockResolvedValue({
      id: 12,
      user_id: 7,
      title: 'A remembered story',
      status: 'pending',
    });
    blogPostModel.markReviewed.mockResolvedValue({
      id: 12,
      user_id: 7,
      title: 'A remembered story',
      status: 'published',
      reviewed_by: 3,
      reviewed_at: '2026-11-15 00:00:00',
      rejection_reason: null,
    });
    editorialActionModel.create.mockResolvedValue({ id: 30, action_type: 'approved' });
    notificationService.notifyBlogDecision.mockResolvedValue({});
  });

  it('rejects attempts to review the reviewer’s own post', async () => {
    blogPostModel.findById.mockResolvedValue({
      id: 12,
      user_id: '3',
      status: 'pending',
    });

    const error = await reviewPost({
      postId: 12,
      reviewerId: 3,
      decision: 'approved',
    }).catch((err) => err);

    expect(error).toBeInstanceOf(BlogReviewError);
    expect(error.statusCode).toBe(403);
    expect(blogPostModel.markReviewed).not.toHaveBeenCalled();
    expect(editorialActionModel.create).not.toHaveBeenCalled();
    expect(notificationService.notifyBlogDecision).not.toHaveBeenCalled();
  });

  it('returns 404 when the post does not exist', async () => {
    blogPostModel.findById.mockResolvedValue(null);

    await expect(reviewPost({
      postId: 404,
      reviewerId: 3,
      decision: 'approved',
    })).rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns 409 when an approval targets a non-pending post', async () => {
    blogPostModel.findById.mockResolvedValue({ id: 12, user_id: 7, status: 'published' });

    await expect(reviewPost({
      postId: 12,
      reviewerId: 3,
      decision: 'approved',
    })).rejects.toMatchObject({ statusCode: 409 });
    expect(blogPostModel.markReviewed).not.toHaveBeenCalled();
  });

  it('requires a reason to reject a post', async () => {
    await expect(reviewPost({
      postId: 12,
      reviewerId: 3,
      decision: 'rejected',
      reason: '  ',
    })).rejects.toMatchObject({ statusCode: 400 });
    expect(blogPostModel.markReviewed).not.toHaveBeenCalled();
  });

  it('publishes the post, records the reviewer and audit action, and notifies the author', async () => {
    const result = await reviewPost({
      postId: 12,
      reviewerId: 3,
      decision: 'approved',
    });

    expect(blogPostModel.markReviewed).toHaveBeenCalledWith(12, {
      status: 'published',
      reviewedBy: 3,
      reason: null,
    });
    expect(result.post).toMatchObject({
      status: 'published',
      reviewed_by: 3,
      reviewed_at: '2026-11-15 00:00:00',
    });
    expect(editorialActionModel.create).toHaveBeenCalledWith({
      blogPostId: 12,
      validatorId: 3,
      actionType: 'approved',
      comment: null,
    });
    expect(notificationService.notifyBlogDecision).toHaveBeenCalledWith({
      userId: 7,
      postTitle: 'A remembered story',
      decision: 'approved',
      reason: null,
    });
  });

  it('stores the rejection reason, logs it, and notifies the author', async () => {
    const reason = 'Please add context for this account.';
    blogPostModel.markReviewed.mockResolvedValue({
      id: 12,
      status: 'rejected',
      reviewed_by: 3,
      rejection_reason: reason,
    });

    const result = await reviewPost({
      postId: 12,
      reviewerId: 3,
      decision: 'rejected',
      reason,
    });

    expect(blogPostModel.markReviewed).toHaveBeenCalledWith(12, {
      status: 'rejected',
      reviewedBy: 3,
      reason,
    });
    expect(result.post).toMatchObject({ status: 'rejected', rejection_reason: reason });
    expect(editorialActionModel.create).toHaveBeenCalledWith({
      blogPostId: 12,
      validatorId: 3,
      actionType: 'rejected',
      comment: reason,
    });
    expect(notificationService.notifyBlogDecision).toHaveBeenCalledWith({
      userId: 7,
      postTitle: 'A remembered story',
      decision: 'rejected',
      reason,
    });
  });

  it('does not fail the review when author notification fails', async () => {
    notificationService.notifyBlogDecision.mockRejectedValue(new Error('notification unavailable'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(reviewPost({
      postId: 12,
      reviewerId: 3,
      decision: 'approved',
    })).resolves.toMatchObject({ post: { status: 'published' } });

    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
