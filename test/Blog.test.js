const supertest = require('supertest');
const app = require('../app'); 
const Blog = require('../Database/Model/Blog');
const ServiceCode= require('../Services/blog.services'); 

jest.mock('./blogModel');

// TEST TO GET ALL BLOGS
describe('getAllBlog', () => {
  it('should return a list of published blog posts', async () => {
    // Define test data for pagination, search, and sorting
    const page = 1;
    const perPage = 10;
    const searchParams = { author: 'TestAuthor', title: 'TestTitle', tags: ['Tag1', 'Tag2'] };
    const sortCriteria = 'timestamp'; // You can change this to test different sorting criteria

    // Use Supertest to send a GET request to your endpoint
    const response = await supertest(app)
      .get('/api/posts')
      .query({ page, perPage, ...searchParams, sortCriteria });

    // Assertions
    expect(response.status).toBe(200); // Expect a successful response
    expect(response.body.success).toBe(true); // Expect a successful response
    expect(response.body.message).toBe('Blogs fetched successfully'); // Expect the correct success message
    expect(response.body.data).toHaveProperty('blogs'); // Expect a 'blogs' property in the response data

  });


});





// TEST TO DISPLAY A BLOG
describe('getOneBlog', () => {
  it('should return a list of blogs by a specific author', async () => {
    const author = 'John Doe';
    const blogData = [
      { title: 'Blog 1', content: 'Content 1', author: author },
      { title: 'Blog 2', content: 'Content 2', author: author },
    ];

    // Mock the find method to return the blog data
    Blog.blogModel.find.mockResolvedValue(blogData);

    const response = await request(app).get(`/blogs/${author}`); // Adjust the route as per your app's setup

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Blogs fetched successfully');
    expect(response.body.data.blogs).toEqual(blogData);
  });

  it('should handle errors when fetching blogs', async () => {
    const author = 'NonexistentAuthor';

    // Mock the find method to throw an error
    Blog.blogModel.find.mockRejectedValue(new Error('Database error'));

    const response = await request(app).get(`/blogs/${author}`); // Adjust the route as per your app's setup

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Error fetching blogs');
    expect(response.body.error).toBe('Database error');
  });
});



// TEST TO GET BLOG BY ID
describe('getBlogById', () => {
  it('should return a single blog by ID', async () => {
    const blogId = '12345';
    const blogData = {
      _id: '12345',
      title: 'Sample Blog',
      content: 'Sample content',
      author: {
        _id: 'author123',
        first_name: 'John',
        last_name: 'Doe',
      },
    };

    // Mock the findOne method to return the blog data
    Blog.blogModel.findOne.mockResolvedValue(blogData);

    const result = await getBlogById(blogId);

    expect(result.code).toBe(200);
    expect(result.success).toBe(true);
    expect(result.message).toBe('Blog fetched successfully');
    expect(result.data.blog).toEqual(blogData);
  });

  it('should handle the case when the blog is not found', async () => {
    const blogId = 'nonexistentID';

    // Mock the findOne method to return null (blog not found)
    Blog.blogModel.findOne.mockResolvedValue(null);

    const result = await getBlogById(blogId);

    expect(result.code).toBe(404);
    expect(result.success).toBe(false);
    expect(result.message).toBe('Blog not found');
  });

  it('should handle errors when fetching the blog', async () => {
    const blogId = 'errorID';

    // Mock the findOne method to throw an error
    Blog.blogModel.findOne.mockRejectedValue(new Error('Database error'));

    const result = await getBlogById(blogId);

    expect(result.code).toBe(500);
    expect(result.success).toBe(false);
    expect(result.message).toBe('Error fetching blog');
    expect(result.error).toBe('Database error');
  });
});






// TEST TO CREATE A BLOG
describe('createBlog', () => {
  it('should create a new blog successfully', async () => {
    const blogData = {
      author: 'John Doe',
      title: 'Test Blog',
      description: 'A test blog',
      body: 'This is the blog content.',
      state: 'published',
      tag: 'testing',
    };

    // Mock the create method to return the created blog
    Blog.blogModel.create.mockResolvedValue(blogData);

    const result = await createBlog(blogData);

    expect(result.message).toBe('Blog created successfully');
    expect(result.code).toBe(201);
    expect(result.data.newBlog).toEqual(blogData);
  });

  it('should handle errors when creating a blog', async () => {
    const blogData = {
      author: 'John Doe',
      title: 'Test Blog',
      description: 'A test blog',
      body: 'This is the blog content.',
      state: 'published',
      tag: 'testing',
    };

    // Mock the create method to throw an error
    Blog.blogModel.create.mockRejectedValue(new Error('Database error'));

    const result = await createBlog(blogData);

    expect(result.message).toBe('Failed to create blog');
    expect(result.code).toBe(500);
  });
});


// TEST TO DELETE A BLOG

describe('deleteBlog', () => {
  it('should delete a blog successfully', async () => {
    const blogId = '12345';
    const deletedBlog = {
      _id: '12345',
      title: 'Deleted Blog',
      description: 'A deleted blog',
      body: 'This is the deleted blog content.',
    };

    // Mock the findOneAndRemove method to return the deleted blog
    Blog.blogModel.findOneAndRemove.mockResolvedValue(deletedBlog);

    const result = await deleteBlog(blogId);

    expect(result.message).toBe('Blog deleted successfully');
    expect(result.code).toBe(200);
    expect(result.data.blog).toEqual(deletedBlog);
  });

  it('should handle the case when the blog is not found', async () => {
    const blogId = 'nonexistentID';

    // Mock the findOneAndRemove method to return null (blog not found)
    Blog.blogModel.findOneAndRemove.mockResolvedValue(null);

    const result = await deleteBlog(blogId);

    expect(result.code).toBe(404);
    expect(result.success).toBe(false);
    expect(result.message).toBe('Blog not found');
  });

  it('should handle errors when deleting the blog', async () => {
    const blogId = 'errorID';

    // Mock the findOneAndRemove method to throw an error
    Blog.blogModel.findOneAndRemove.mockRejectedValue(new Error('Database error'));

    const result = await deleteBlog(blogId);

    expect(result.code).toBe(500);
    expect(result.success).toBe(false);
    expect(result.message).toBe('Error deleting blog');
    expect(result.error).toBe('Database error');
  });
});
