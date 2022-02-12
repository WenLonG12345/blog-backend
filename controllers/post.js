const Post = require('../models/post');
const FeaturedPost = require('../models/featuredPost');
const cloudinary = require('../cloud');
const { isValidObjectId } = require('mongoose');
const { addtoFeaturedPost, removeFromFeturedPost, isFeaturedPost } = require('../utils');
const post = require('../models/post');

exports.createPost = async (req, res) => {

  const { title, meta, content, slug, author, tags, featured } = req.body;
  const { file } = req;
  const isPostExist = await Post.findOne({ slug });

  if (isPostExist) return res.status(401).json({ error: 'Slug exist! Please use another slug.' })

  const newPost = new Post({ title, meta, content, slug, author, tags });

  if (file) {
    const { secure_url: url, public_id } = await cloudinary.uploader.upload(file.path);
    newPost.thumbnail = { url, public_id }
  }

  await newPost.save();

  if (featured) {
    await addtoFeaturedPost(newPost._id);
  }

  res.json({
    post: {
      id: newPost._id,
      title,
      meta,
      slug,
      content,
      thumbnail: newPost.thumbnail?.url,
      author: newPost.author
    }
  });
};

exports.deletePost = async (req, res) => {
  const { postId } = req.params;
  if (!isValidObjectId(postId)) {
    return res.status(401).json({ error: 'Invalid request' });
  }

  const post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json({ error: 'Post not found!' });
  }

  const public_id = post.thumbnail?.public_id;
  if (public_id) {
    const { result } = await cloudinary.uploader.destroy(public_id)

    if (result !== 'ok') {
      return res.status(404).json({ error: 'Remove thumbnail unsuccessful' });
    }
  }

  await Post.findByIdAndDelete(postId);
  await removeFromFeturedPost(postId);
  res.json({ message: 'Post removed successfully' });
}

exports.updatePost = async (req, res) => {

  const { title, meta, content, slug, author, tags, featured } = req.body;
  const { file } = req;

  const { postId } = req.params;
  if (!isValidObjectId(postId)) {
    return res.status(401).json({ error: 'Invalid request' });
  }

  const post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json({ error: 'Post not found!' });
  }

  const public_id = post.thumbnail?.public_id;
  if (public_id && file) {
    const { result } = await cloudinary.uploader.destroy(public_id)

    if (result !== 'ok') {
      return res.status(404).json({ error: 'Remove thumbnail unsuccessful' });
    }
  }

  if (file) {
    const { secure_url: url, public_id } = await cloudinary.uploader.upload(file.path);
    post.thumbnail = { url, public_id }
  }
  post.title = title;
  post.meta = meta;
  post.content = content;
  post.slug = slug;
  post.author = author;
  post.tags = tags;


  if (featured) {
    await addtoFeaturedPost(post._id);
  } else {
    await removeFromFeturedPost(post._id);
  }

  await post.save();

  res.json({
    post: {
      id: post._id,
      title,
      meta,
      slug,
      content,
      thumbnail: post.thumbnail?.url,
      author: post.author,
      content,
      tags,
      featured
    }
  });
}

exports.getPost = async (req, res) => {
  const { slug } = req.params;
  if (!slug) {
    return res.status(401).json({ error: 'Invalid request' });
  }

  const post = await Post.findOne({ slug });
  if (!post) {
    return res.status(404).json({ error: 'Post not found!' });
  }

  const featured = await isFeaturedPost(post._id);

  const { title, meta, content, author, tags, createdAt } = post;

  res.json({
    post: {
      id: post._id,
      title,
      meta,
      content,
      thumbnail: post.thumbnail?.url,
      author,
      content,
      tags,
      featured,
      createdAt
    }
  });
}

exports.getFeaturedPost = async (req, res) => {
  const featuredPosts = await FeaturedPost.find({})
    .sort({ createdAt: -1 })
    .populate('post');

  return res.json(
    featuredPosts.map(({ post }) => ({
      id: post._id,
      title: post.title,
      meta: post.meta,
      slug: post.slug,
      thumbnail: post.thumbnail?.url,
      author: post.author
    }))
  );
}

exports.getLatestPosts = async (req, res) => {
  const { pageNumber = 0, limit = 10 } = req.query;
  const posts = await Post.find({})
    .sort({ createdAt: -1 })
    .skip(parseInt(pageNumber) * parseInt(limit))
    .limit(parseInt(limit));

  res.json({
    posts: posts.map((post) => ({
      id: post._id,
      title: post.title,
      meta: post.meta,
      slug: post.slug,
      thumbnail: post.thumbnail?.url,
      author: post.author
    }))
  });
}

exports.searchPost = async (req, res) => {
  const { title } = req.query;

  if (!title.trim()) {
    return res.status(401).json({ error: 'search query is missing!' });
  }
  const posts = await Post.find({ title: { $regex: title, $options: 'i' } })

  res.json({
    posts: posts.map((post) => ({
      id: post._id,
      title: post.title,
      meta: post.meta,
      slug: post.slug,
      thumbnail: post.thumbnail?.url,
      author: post.author
    }))
  });
}

exports.getRelatedPosts = async (req, res) => {

  const { postId } = req.query;

  if (!isValidObjectId(postId)) {
    return res.status(401).json({ error: 'Invalid request' });
  }

  const post = await Post.findById(postId);

  if (!post) {
    return res.status(401).json({ error: 'Post not found!' });
  }

  const relatedPosts = await Post.find({
    tags: { $in: [...post.tags] },
    _id: { $ne: post._id },
  })
    .sort('-createdAt').limit(5);

  res.json({
    posts: relatedPosts.map((post) => ({
      id: post._id,
      title: post.title,
      meta: post.meta,
      slug: post.slug,
      thumbnail: post.thumbnail?.url,
      author: post.author,
      tags: post.tags
    }))
  });
}

exports.uploadImage = async (req, res) => {

  const { file } = req;

  if (!file) return res.status(401).json({ error: 'Invalid request' });

  const { secure_url: url, public_id } = await cloudinary.uploader.upload(file.path);

  res.status(201).json({image: url})
}