const { validateBlogPost } = require('../validators/blogPostValidators');

function validate(body) {
  const req = { body };
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };
  const next = jest.fn();
  validateBlogPost(req, res, next);
  return { req, res, next };
}

describe('blog post validation', () => {
  const validContent = { title: 'A post', content: 'A community story.' };

  it('requires consent_confirmed to be true', () => {
    const { next, res } = validate({
      ...validContent,
      consent_confirmed: false,
    });

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(res.payload.errors).toContain('consent_confirmed must be true.');
  });

  it.each([true, 'true', '1'])('accepts explicit true consent values', (consentConfirmed) => {
    const { req, res, next } = validate({
      ...validContent,
      mentions_people: 'true',
      consent_confirmed: consentConfirmed,
    });

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(req.blogPostConsent).toEqual({ mentionsPeople: true, consentConfirmed: true });
  });

  it('defaults mentions_people to false when omitted', () => {
    const { req, next } = validate({
      ...validContent,
      consent_confirmed: true,
    });

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.blogPostConsent).toEqual({ mentionsPeople: false, consentConfirmed: true });
  });

  it('rejects invalid mentions_people values', () => {
    const { next, res } = validate({
      ...validContent,
      mentions_people: 'sometimes',
      consent_confirmed: true,
    });

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(res.payload.errors).toContain('mentions_people must be true or false.');
  });
});
