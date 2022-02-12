const FeaturedPost = require('../models/featuredPost');

const MAX_FEATURED_POST = 4;

exports.addtoFeaturedPost = async (postId) => {

  const isPostExist = await FeaturedPost.findOne({ post: postId });

  if (isPostExist) return;

  const featuredPost = new FeaturedPost({ post: postId });
  await featuredPost.save();

  const sortedPost = await FeaturedPost.find({}).sort({ createdAt: -1 });
  sortedPost.forEach(async (post, index) => {
    if (index >= MAX_FEATURED_POST) {
      await FeaturedPost.findByIdAndDelete(post._id);
    }
  })
};

exports.removeFromFeturedPost = async (postId) => {
  await FeaturedPost.findOneAndDelete({ post: postId });
};

exports.isFeaturedPost = async(postId) => {
  const post = await FeaturedPost.findOne({ post: postId });
  return post? true: false;
}