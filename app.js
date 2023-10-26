const express = require('express')
const mongoDB = require('./Database/connectDB')
require('dotenv').config();
const morgan = require('morgan');
const path =require('path')

const viewRouter= require('./Views/viewRouter')


const app = express();
const PORT = process.env.PORT

// Connecting to mongoDB server
mongoDB.connectToMongoDB()

app.use(morgan('dev'));
app.use(express.json()) 
app.use(express.urlencoded({ extended: true })); 

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'Views'));

app.use('/blog', viewRouter)


// home route
app.get('/', (req, res) => {
    return res.status(200).json({ message: 'success', status: true })
})

// global error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
      data: null,
      error: 'Server Error'
  })
})


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });