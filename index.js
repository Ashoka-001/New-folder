//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
require('dotenv').config();
app.use('/public', express.static('public'));

// upload files
const multer = require("multer");
// connecting with mongoose
const mongoose = require("mongoose");
// connection with atlas
const uri = process.env.uri;
// console.log(uri)
mongoose.connect(uri)
.then(() => console.log('Database connected successfully'))
.catch((err) => console.error('Database connection error: ', err));

//movie schema to save the movie details in database
const movieSchema = new mongoose.Schema({
  movieName : String,
  thumbnail : String,
  director : String ,
  language : String ,
  releaseYear : String,
  rating : String
});

//create the model for the schema to be used as json object

const movieDB = mongoose.model("movieDB", movieSchema);
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// use multer to add the poster (thumbnail) of the movie

const storage = multer.diskStorage({
  destination: "public/uploads/",
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = uniqueSuffix + "-" + file.originalname;
    cb(null, filename);
  },
});
const upload = multer({ storage: storage });

// handle the get request for the landing page
app.get("/", async function(req, res) {

  // diplay all available movies in database

  const data = await movieDB.find();
  res.render("index", { data,count:""});  
});

// update the movie details if any correction

app.post("/updateMovie", upload.single('thumbnail'),async function(req, res){
  const {_id ,movieName, director, language, releaseYear, rating } = req.body;
  try{
    const updateMovie = await movieDB.findOneAndUpdate(
      {_id : _id},
      { $set: { movieName, director, language, releaseYear, rating } },
      {new: true}
      );
      console.log(_id);
    if(updateMovie){
      console.log("Movie Update");
      res.redirect("/");
    }

  }
  catch{
    res.status(500).send("Movie can not updated");
  }
});

// adding  Movie details into the database 

app.post("/addMovie", upload.single("thumbnail"),async function(req, res){
  const {movieName, director, language, releaseYear, rating } = req.body;
  try{
    const thumbnail = req.file.filename;
    const newMovie = new movieDB({
      movieName, director, language, releaseYear, rating, thumbnail
    });
    await newMovie.save();
    res.redirect("/");

  }
  catch{
    res.status(500).send("Error in adding movies");
  }
});



// find and display the result acoording to filter used

app.get("/findAnddisplay/:param/:value", async function( req, res){
  const parameter = req.params.param;
  const value = req.params.value;
  const query = {};
  query[parameter] = value;
  console.log(parameter + " " + value);
  const data = await movieDB.find(query);
  res.render("index", { data, count:"" });

}); 
//counting number of movies based on language

app.get("/countMovie/:lang", async function(req, res){
  try{
    const value = req.params.lang;
    const countMovies = await movieDB.countDocuments({language : value});
    const msg = `Number of movies : ${countMovies} in ${value}.` ;
    const data = await movieDB.find();
    res.render("index",{data,count:msg});
  }
  catch{
    
    res.send("unable to find movies.");
  }
});

//delete the details of action perfomed previously

app.get("/delete/:id", async function(req, res){
  try{
    const id = req.params.id;
    const deletedMovie = await movieDB.findOneAndDelete(id);
    if(deletedMovie){
      //console.log("Deleted the movie");
      res.redirect("/");
    }
    else{
      res.send("Details are not found");
    }
  }
  catch{
    res.send("can not delete the detail");
  }
});

   

const  start = async() => {
  await app.listen(3000, function() {
  
    console.log(`Server started on port 3000`);
  });
} 
start();