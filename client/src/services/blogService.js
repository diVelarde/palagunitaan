import api from '../api/axios';

async function getPosts({ limit, offset } = {}) {
  const res = await api.get('/api/blog', { params: { limit, offset } });
  return res.data.posts;
}

async function getMyPosts() {
  const res = await api.get('/api/blog/mine');
  return res.data.posts;
}

async function createPost({ title, content }) {
  const res = await api.post('/api/blog', { title, content });
  return res.data.post;
}

const blogService = {
  getPosts,
  getMyPosts,
  createPost
};

export default blogService;