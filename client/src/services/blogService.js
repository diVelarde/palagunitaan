import api from '../api/axios';

async function getPosts({ limit, offset, q, author, from, to, sort } = {}) {
  const res = await api.get('/api/blog', { params: { limit, offset, q, author, from, to, sort } });
  return res.data.posts;
}

async function getPostById(id) {
  const res = await api.get(`/api/blog/${id}`);
  return res.data.post;
}

async function getMyPosts() {
  const res = await api.get('/api/blog/mine');
  return res.data.posts;
}

async function getPendingPosts() {
  const res = await api.get('/api/blog/pending');
  return res.data.posts;
}

async function reviewPost(id, decision, reason) {
  const res = await api.patch(`/api/blog/${id}/review`, { decision, reason });
  return res.data;
}

async function createPost({ title, content, coverImage, mentionsPeople, consentConfirmed }) {
  let payload = {
    title,
    content,
    mentions_people: mentionsPeople,
    consent_confirmed: consentConfirmed,
  };
  if (coverImage) {
    payload = new FormData();
    payload.append('title', title);
    payload.append('content', content);
    payload.append('mentions_people', String(mentionsPeople));
    payload.append('consent_confirmed', String(consentConfirmed));
    payload.append('coverImage', coverImage);
  }
  const res = await api.post('/api/blog', payload);
  return res.data.post;
}

const blogService = {
  getPosts,
  getPostById,
  getMyPosts,
  getPendingPosts,
  reviewPost,
  createPost
};

export default blogService;