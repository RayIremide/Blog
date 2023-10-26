const express = require('express');
const userService = require('../Services/user.services');
const blogService = require('../Services/blog.services')
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const logger = require('../logger/index');
const { error } = require('winston');


require('dotenv').config();


const viewRouter = express.Router();
viewRouter.use(cookieParser())

// Route for the entry page
viewRouter.get('/index', (req, res) => {
    res.render('index', { user: res.locals.user });
})


// Route for the blog home page
viewRouter.get('/home', async (req, res) => {
    const userFirstName = req.userFirstName;
    const userLastName = req.userLastName;
    const page = parseInt(req.query.page) || 1; // Get the current page from query parameters
    const perPage = 20; // Define the number of items per page
    const searchParams = {
        author: req.query.author, // Get the author query parameter for search
        title: req.query.title, // Get the title query parameter for search
        tags: req.query.tags, // Get the tags query parameter for search
    };
    const sortCriteria = req.query.sort || 'timestamp'; // Get the sort query parameter or default to 'timestamp'
  
    const response = await blogService.getAllBlog(page, perPage, searchParams, sortCriteria);
  
    res.render('home', {
      user: res.locals.user,
      blogs: response.data.blogs,
      userFirstName,
      userLastName,
      currentPage: page, // Pass the current page to the template
      totalPages: Math.ceil(response.data.totalCount / perPage), // Calculate the total number of pages
      searchParams,
      sortCriteria,
    });
});

  


// Define a route for rendering the authenticate page
viewRouter.get('/authenticate', (req, res) => {
    res.render('authenticate', { user: res.locals.user });
});


// Define a route for rendering the signup page
viewRouter.get('/signup', (req, res) => {
    res.render('signup');
});


//Define a route to handle the signup form submission
viewRouter.post('/signup', async (req, res) => {
    const userData = {
        email: req.body.email,
        password: req.body.password,
        username:req.body.username,
        first_name:req.body.firstname,
        last_name:req.body.lastname
    };

    const response = await userService.Signup(userData);

    if (response.code === 201) {
        res.redirect("login"); 
    } else {
        res.render('signup', { error: response.message });
    }
});



// Define a route for rendering the login page
viewRouter.get('/login', (req, res) => {
    res.render('login');
});

viewRouter.post('/login', async (req, res) => {
    const response = await userService.Login({ email: req.body.email, password: req.body.password })


    if (response.code === 200) {
        // set cookie
        res.cookie('jwt', response.data.token)
        res.redirect("dashboard")
    } else {
        res.render('login', { error: response.message })
    }
});



viewRouter.use(async (req, res, next) => {
    const token = req.cookies.jwt;
    if (token) {
        try {
            const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decodedToken._id
            const { first_name, last_name } = decodedToken;
          
            req.userId = userId; 
            req.userFirstName = first_name;
            req.userLastName = last_name;

            next();
        } catch (error) {
            
            res.redirect('home'); 
        }
    } else {
        
        res.redirect('home'); 
    }
});




// Define a route for rendering the CreateBlog page
viewRouter.get('/createBlog', (req, res) => {
    res.render('createBlog');
});

//Route to handle the create blog
viewRouter.post('/createBlog', async (req, res) => {
    const blogData = {
        author: req.userId,
        title: req.body.title,
        description: req.body.description,
        body: req.body.content,
        tag: req.body.tag

    
    };
    console.log(blogData)

    const response = await blogService.createBlog(blogData);

    if (response.code === 201) {
        res.redirect("dashboard"); 
    } else {
        res.render('createBlog', { error: response.message});
    }
});


// Define a route for rendering the Dashboard page
viewRouter.get('/dashboard', async (req, res) => {
    const user = req.userId;
    const userFirstName = req.userFirstName;
    const userLastName = req.userLastName;
    const response = await blogService.getOneBlog(user);

    if (response.success) {
        // Assuming that the 'userBlogs' property exists in the 'response.data' object
        const userBlogs = response.data.blogs;

        res.render('dashboard', { user: res.locals.user, userBlogs,userFirstName,userLastName });
    } else {
        // Handle the error appropriately
        res.status(response.code).send(response.message);
    }
});


// Route to get a single blog post
viewRouter.get('/blog/:id', async (req, res) => {
    const blogId = req.params.id; 
    const userFirstName = req.userFirstName;
    const userLastName = req.userLastName;

    try {
        const blog = await blogService.getBlogById(blogId);

        if (blog.success) {
            res.render('blog', {
                blog: blog.data.blog,
                user: res.locals.user,
                userFirstName: userFirstName,
                userLastName: userLastName
            });
        } else {
            res.status(404).send("Blog not found");
        }
    } catch (error) {
        res.status(500).send("Internal Server Error: " + error.message);
    }
});



// Route to get a single blog post- Edit route
viewRouter.get('/edit/:id', async (req, res) => {
    const blogId = req.params.id; 
    const userFirstName = req.userFirstName;
    const userLastName = req.userLastName;

    try {
        const blog = await blogService.getBlogById(blogId);

        if (blog.success) {
            res.render('edit', {
                blog: blog.data.blog,
                user: res.locals.user,
                userFirstName: userFirstName,
                userLastName: userLastName
            });
        } else {
            res.status(404).send("Blog not found");
        }
    } catch (error) {
        res.status(500).send("Internal Server Error: " + error.message);
    }
});


// // Route to delete a task
viewRouter.post('/delete/:id', async (req, res) => {
    const blogId = req.params.id; 

    try {
        const deletedBlog = await blogService.deleteBlog(blogId);

        if (deletedBlog.success) {
            res.redirect("/blog/dashboard");
        } else {
            res.status(deletedBlog.code).send('Failed to delete task: ' + deletedBlog.message);
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).send('Failed to delete task: ' + error.message);
    }
});


// Route to update and publish a blog
viewRouter.post('/update/:id', async (req, res) => {
    const blogId = req.params.id;

    const { title, description, body, tag } = req.body;

    // Define the update object with the new data and state
    const update = {
      title,
      description,
      body,
      tag,
      state: 'published',
      createdDate: new Date(),
    };

    try {
      const updatedBlog = await blogService.updateBlog(blogId, update);
      console.log(updatedBlog)

      if (updatedBlog.success) {
        // Blog updated successfully, redirect to the dashboard
        res.redirect("/blog/dashboard");
      } else {
        res.status(updatedBlog.code).send('Failed to update blog: ' + updatedBlog.message);
      }
    } catch (error) {
      console.error('Error updating blog:', error);
      res.status(500).send('Failed to update blog: ' + error.message);
    }
});



  // Define a route for rendering the Draft page
viewRouter.get('/draft', async (req, res) => {
    const user = req.userId;
    const userFirstName = req.userFirstName;
    const userLastName = req.userLastName;
    const response = await blogService.getAllDraftPost(user);

    if (response.success) {

        const userBlogs = response.data.blog;

        res.render('draft', { user: res.locals.user, userBlogs,userFirstName,userLastName });
    } else {
        // Handle the error appropriately
        res.status(response.code).send(response.message);
    }
});
  

  // Define a route for rendering the Published page
  viewRouter.get('/published', async (req, res) => {
    const user = req.userId;
    const userFirstName = req.userFirstName;
    const userLastName = req.userLastName;
    const response = await blogService.getAllPublishPost(user);

    if (response.success) {

        const userBlogs = response.data.blog;

        res.render('published', { user: res.locals.user, userBlogs,userFirstName,userLastName });
    } else {
        // Handle the error appropriately
        res.status(response.code).send(response.message);
    }
});

// /views/logout
viewRouter.get('/logout', (req, res) => {    
    res.clearCookie('jwt')
    res.redirect('index')
});

// SEARCH FOR AUTHOR, TITLE, TAGS
viewRouter.get('/search', async (req, res) => {
    const { author, title, tags } = req.query;
  
    try {
      const searchResults = await blogService.searchBlogs(author, title, tags); 
      res.render('search', { results: searchResults }); 
    } catch (error) {
      res.status(500).json({ error: 'An error occurred' });
    }
  });

viewRouter.get('/search', (req, res) => {
    res.render('search', { results: [] }); 
  });


module.exports = viewRouter;