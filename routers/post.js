const { createPost, deletePost, updatePost, getPost, getFeaturedPost, getLatestPosts, searchPost, getRelatedPosts, uploadImage } = require('../controllers/post');
const multer = require('../middlewares/multer');
const { postValidator, validate } = require('../middlewares/postValidator');
const { parseData } = require('../middlewares');

const router = require('express').Router();

router.post(
  '/create',
  multer.single('thumbnail'),
  parseData,
  postValidator,
  validate,
  createPost
);

router.delete('/:postId', deletePost)

router.put(
  '/:postId',
  multer.single('thumbnail'),
  parseData,
  postValidator,
  validate,
  updatePost
);

router.get("/post/:slug", getPost);

router.get('/featured', getFeaturedPost);

router.get('/posts', getLatestPosts);

router.get('/search', searchPost);

router.get('/related', getRelatedPosts);

router.post(
  '/upload-image',
  multer.single('image'),
  uploadImage
);


module.exports = router;