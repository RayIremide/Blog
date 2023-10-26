const mongoose = require("mongoose");
const shortid =require("shortid")
const { userModel } = require("./User");


// Define the blog Schema
const blogSchema = new mongoose.Schema({
  blog_id: {
    type: String,
    default:shortid.generate,
    required: true,
  },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', },

  title: {
    type: String,
    required: true,
    unique:true
  },
  description: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  
  state: {
    type: String,enum:['draft','published'],
    default: 'draft',
  },
  read_count: {
    type: Number
  },
  reading_time: {
    type: Number
  },
  tag: {
    type: [String]
  },
  createdDate:{
    type:Date,
    default: new Date()}
});





const blogModel = mongoose.model('Blog', blogSchema);


module.exports = { blogModel };