//jshint esversion:6
require("dotenv").config();
var _ = require("lodash");
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const homeStartingContent =
  "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent =
  "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent =
  "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//Database connection
mongoose.connect(
  "mongodb+srv://tnhnkzc:Mnta1173.+@cluster0.6bddj.mongodb.net/blogDB?retryWrites=true&w=majority"
);

//MongoDB Post Schema
const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
});

const Post = mongoose.model("Post", postSchema);

const post1 = new Post({
  title: "Hello!",
  body: "You can add your post by clicking on top right button called < Publish > ",
});
//post1.save();
const defaultPost = [post1];

app.get("/", function (req, res) {
  //Fetch items from DB
  Post.find({}, function (err, foundPosts) {
    if (foundPosts.length === 0) {
      Post.insertMany(defaultPost, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Succesfully saved the default items to the DB.");
        }
      });
      res.redirect("/");
    }
    if (err) {
      console.log(err);
    } else {
      res.render("home", {
        posts: foundPosts,
        homeStartingContent: homeStartingContent,
      });
    }
  });
});
//Post Specific Pages
app.get("/posts/:postId", function (req, res) {
  const desiredPostId = _.capitalize(req.params.postId);
  const storedPostId = Post.findOne(
    { _id: desiredPostId },
    function (err, foundPost) {
      if (foundPost) {
        res.render("post", {
          post: foundPost,
        });
      } else {
        console.log(err);
      }
    }
  );
});
// Delete Post
app.post("/delete", function (req, res) {
  const deleteItem = req.body.deleteItem;
  Post.findByIdAndDelete(deleteItem, function (err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/");
    }
  });
});
// About Page
app.get("/about", function (req, res) {
  res.render("about", {
    aboutContent: aboutContent,
  });
});
//Contact Page
app.get("/contact", function (req, res) {
  res.render("contact", {
    contactContent: contactContent,
  });
});
//Add Post
app.get("/compose", function (req, res) {
  res.render("compose");
});
app.post("/compose", function (req, res) {
  const postTitle = req.body.postTitle;
  const postBody = req.body.postBody;
  const post = new Post({
    title: postTitle,
    body: postBody,
  });
  post.save();
  res.redirect("/");
});

app.listen(process.env.PORT || 3000, function () {
  console.log("Server started on port 3000");
});
