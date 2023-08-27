const dotenv = require('dotenv');
const mongoose = require("mongoose");
dotenv.config({path: './config.env'});
const app = require('./app');
// console.log(process.env.MONGODB_URL);
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false
})
mongoose.connect(process.env.MONGODB_URL)
.then(data=>console.log("Database is Successfuly Connected"))
.catch(err =>console.log("Database error",err))

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`App is Running on Port ${port}`);
  });




