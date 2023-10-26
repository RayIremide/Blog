const mongoose = require("mongoose");
const shortid =require("shortid")
const bcrypt = require('bcrypt');

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

// Define the user Schema
const userSchema = new Schema({
  user_id: {
    type: String,
    default:shortid.generate,
    required: true,
  },
  username: {
    type: String,
    required: true,
    max: [20, "username must not exceed 20 characters"]
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  first_name: {
    type: String,
    required: true,
  },
  last_name: {
    type: String,
    required: true,
  },
  createdDate:{
    type:Date,
    default: new Date()}
});


// before save
userSchema.pre('save', async function (next) {
  const user = this;
  const hash = await bcrypt.hash(this.password, 10);

  this.password = hash;
  next();
})

userSchema.methods.isValidPassword = async function(password) {
  const user = this;
  const compare = await bcrypt.compare(password, user.password);

  return compare;
}



const userModel = mongoose.model('User', userSchema);


module.exports = { userModel };

