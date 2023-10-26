const Blog = require('../Database/Model/Blog')
const User = require('../Database/Model/User')
const jwt = require('jsonwebtoken');
const logger = require('../logger/index')
require('dotenv').config();



// Get all published blog posts with pagination, search, and sorting
const getAllBlog = async (page, perPage, searchParams, sortCriteria) => {
  try {
    // Calculate the skip value based on the page and perPage values
    const skip = (page - 1) * perPage;

    // Create a query object for finding published blogs
    const query = {
      state: 'published',
    };

    // Apply search parameters if provided
    if (searchParams.author) {
      query['author'] = searchParams.author;
    }
    if (searchParams.title) {
      query['title'] = { $regex: searchParams.title, $options: 'i' }; // Case-insensitive title search
    }
    if (searchParams.tags) {
      query['tags'] = { $in: searchParams.tags };
    }

    // Define the sort options based on the criteria
    const sortOptions = {
      timestamp: 'createdDate', // Map 'timestamp' to 'createdDate'
      read_count: 'read_count',
      reading_time: 'reading_time',
    };
    const sortField = sortOptions[sortCriteria] || 'createdDate'; // Default to 'createdDate' for unknown criteria

    // Query the database to fetch published blogs with pagination, search, and sorting
    const blogs = await Blog.blogModel
      .find(query)
      .skip(skip)
      .limit(perPage)
      .populate('author', 'first_name last_name')
      .sort(sortField) // Apply sorting
      .exec();

    // Fetch the total count of published blogs for pagination
    const totalCount = await Blog.blogModel
      .countDocuments(query)
      .exec();

    return {
      code: 200,
      success: true,
      message: 'Blogs fetched successfully',
      data: {
        blogs,
        totalCount,
      }
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      code: 500,
      success: false,
      message: 'Internal server error',
      error: error.message
    };
  }
};




const getOneBlog = async (author) => {
  try {
    const blogs = await Blog.blogModel.find({ author: author})
    .populate('author', 'first_name last_name'); 

    return {
      code: 200,
      success: true,
      message: 'Blogs fetched successfully',
      data: {
        blogs
      }
    };
  } catch (error) {
    return {
      code: 500,
      success: false,
      message: 'Error fetching blogs',
      error: error.message
    };
  }
}


//Service code to read a single blog from the dashboard
const getBlogById = async (blog_id) => {
  try {
    const blog = await Blog.blogModel.findOne({ blog_id })
      .populate('author', 'first_name last_name');

    if (!blog) {
      return {
        code: 404,
        success: false,
        message: 'Blog not found'
      };
    }

    return {
      code: 200,
      success: true,
      message: 'Blog fetched successfully',
      data: {
        blog
      }
    };
  } catch (error) {
    return {
      code: 500,
      success: false,
      message: 'Error fetching blog',
      error: error.message
    };
  }
}


//Create a Blog
const createBlog = async ({ author,title,description,body, state,tag }) => {
    const newBlog = { author,title,description,body, state,tag};
    try {
      const blog = await Blog.blogModel.create(newBlog); 
      return {
        message: 'Blog created successfully',
        code: 201,
        data: { newBlog: blog}, 
      };
    } catch (error) {
      logger.error('[UserService] => Blog creation process failed', error);
      return {
        message: 'Failed to create blog',
        code: 500,
      };
    }
  }



  
// Delete a blog
const deleteBlog = async (blog_id) => {
  try {
    const deletedBlog = await Blog.blogModel.findOneAndRemove(blog_id)

    if (!deletedBlog) {
      return {
        code: 404,
        success: false,
        message: 'Blog not found',
      };
    }

    return {
      code: 200,
      success: true,
      message: 'Blog deleted successfully',
      data: {
        blog: deletedBlog,
      },
    };
  } catch (error) {
    console.error('Error deleting blog:', error);
    return {
      code: 500,
      success: false,
      message: 'Error deleting blog',
      error: error.message,
    };
  }
};



// Edit and Update a blog
const updateBlog = async (blog_id, update) => {
  try {
    const updatedBlog = await Blog.blogModel.findOneAndUpdate({ blog_id }, update, { new: true });

    if (!updatedBlog) {
      return {
        code: 404,
        success: false,
        message: 'Blog not found',
      };
    }

    return {
      code: 200,
      success: true,
      message: 'Blog updated successfully',
      data: {
        blog: updatedBlog,
      },
    };
  } catch (error) {
    console.error('Error updating blog:', error);
    return {
      code: 500,
      success: false,
      message: 'Error updating blog',
      error: error.message,
    };
  }
};


// Get draft post
const getAllDraftPost = async (author) => {
  const draftPost = await Blog.blogModel.find({ state: 'draft',author:author })
  .populate('author', 'first_name last_name'); 
  return {
      code: 200,
      success: true,
      message: 'Draft Post fetched successfully',
      data: {
          blog: draftPost
      }
  }
}


// Get published post
const getAllPublishPost = async (author) => {
  const publishPost = await Blog.blogModel.find({ state: 'published',author:author })
  .populate('author', 'first_name last_name'); 
  return {
      code: 200,
      success: true,
      message: 'Draft Post fetched successfully',
      data: {
          blog: publishPost
      }
  }
}

// SEARCH FOR AUTHOR, TITLE AND TAGS
const searchBlogs = async(author, title, tags) => {
  const query = {};

  if (author) {
    query.author = author;
  }

  if (title) {
    query.title = title;
  }

  if (tags) {
    query.tags = tags;
  }

  const searchResults = await Blog.blogModel.find(query);

  return searchResults;
}




//Read Count Function
const readCount = async (blog_id) => {
  try {
    const blog = await Blog.blogModel.findOne({ blog_id });

    if (!blog) {
      return { error: 'Blog post not found' }; 
    }

    // Increment the read count by 1
    blog.read_count = (blog.read_count || 0) + 1;

    // Save the updated blog post to the database
    await blog.save();

    return { success: true }; // Return a success message as an object
  } catch (error) {
    console.error('Error:', error);
    return { error: 'Internal server error' }; 
  }
};





  module.exports = {
    getAllBlog,
    createBlog,
    getOneBlog,
    getBlogById,
    deleteBlog,
    updateBlog,
    getAllDraftPost,
    getAllPublishPost,
    readCount,
    searchBlogs
            }