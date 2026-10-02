import api from '../api/axios';

async function getPosts({ limit, offset } = {}) {
  const res = await api.get('/api/blog', { params: { limit, offset } });
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

async function createPost({ title, content, coverImage }) {
  let payload = { title, content };
  if (coverImage) {
    payload = new FormData();
    payload.append('title', title);
    payload.append('content', content);
    payload.append('coverImage', coverImage);
  }
  const res = await api.post('/api/blog', payload);
  return res.data.post;
}

const blogService = {
  getPosts,
  getPostById,
  getMyPosts,
  createPost
};

export default blogService;