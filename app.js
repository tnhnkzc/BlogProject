//jshint esversion:6
require("dotenv").config();
var _ = require("lodash");
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const mongoose = require("mongoose");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const FacebookStrategy = require("passport-facebook"); //FOR FACEBOOK LOGIN HAVE TO INSTALL VIA NPM AS WELL
const findOrCreate = require("mongoose-findorcreate");
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
app.use(
  session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

//Database connection
mongoose.connect(process.env.MONGODB_URI);

//MongoDB Post Schema
const postSchema = new mongoose.Schema({
  title: String,
  body: String,
  author: String,
});
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  facebookId: String,
});
postSchema.plugin(passportLocalMongoose);
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const Post = mongoose.model("Post", postSchema);

const post1 = new Post({
  title: "Hello!",
  body: "You can add your post by clicking on top right button called < Publish > ",
  author: "Tunahan Kuzucu",
});
//post1.save();
const defaultPost = [post1];

const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (user, done) {
  done(null, user);
});
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      callbackURL: "https://blogtunahan.herokuapp.com//auth/google/profile",
      passReqToCallback: true,
    },
    function (request, accessToken, refreshToken, profile, done) {
      User.findOrCreate(
        { username: profile.emails[0].value, googleId: profile.id },
        function (err, user) {
          return done(err, user);
        }
      );
    }
  )
);
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_SECRET,
      callbackURL: "https://blogtunahan.herokuapp.com//auth/facebook/profile",
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate(
        { username: profile.displayName, facebookId: profile.id },
        function (err, user) {
          return cb(err, user);
        }
      );
    }
  )
);
// GET ROUTES //
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
        user: req.user,
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
          user: req.user,
        });
      } else {
        console.log(err);
      }
    }
  );
});
app.get("/register", function (req, res) {
  res.render("register", {
    user: req.user,
  });
});
app.get("/login", function (req, res) {
  res.render("login", {
    user: req.user,
  });
});
// About Page
app.get("/about", function (req, res) {
  res.render("about", {
    aboutContent: aboutContent,
    user: req.user,
  });
});
//Contact Page
app.get("/contact", function (req, res) {
  res.render("contact", {
    contactContent: contactContent,
    user: req.user,
  });
});
//Add Post
app.get("/compose", function (req, res) {
  res.set(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stal   e=0, post-check=0, pre-check=0"
  );
  if (req.isAuthenticated()) {
    res.render("compose", {
      user: req.user,
    });
  } else {
    res.redirect("/login");
  }
});
//GOOGLE LOGIN
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
app.get(
  "/auth/google/profile",
  passport.authenticate("google", {
    successRedirect: "/profile",
    failureRedirect: "/auth/google/failure",
  })
);
// FACEBOOK LOGIN
app.get(
  "/auth/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);
app.get(
  "/auth/facebook/profile",
  passport.authenticate("facebook", { failureRedirect: "/register" }),
  function (req, res) {
    res.redirect("/profile");
  }
);
app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});
app.get("/profile", function (req, res) {
  if (req.isAuthenticated()) {
    Post.find({ author: req.user.username }, function (err, foundPosts) {
      if (foundPosts) {
        res.render("profile", {
          userName: req.user.username,
          user: req.user,
          userPosts: foundPosts,
        });
      } else {
        console.log(err);
      }
    });
  }
});
app.get("/profile/:userName", function (req, res) {
  const desiredUserName = req.params.userName;
  Post.find({ author: desiredUserName }, function (err, foundPosts) {
    if (foundPosts) {
      res.render("profile", {
        userPosts: foundPosts,
        userName: foundPosts.author,
      });
    }
  });
});

// POST ROUTES //
// Delete Post
app.post("/delete", function (req, res) {
  const deleteItem = req.body.deleteItem;
  Post.findByIdAndDelete(deleteItem, function (err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/profile");
    }
  });
});

//Publish a post
app.post("/compose", function (req, res) {
  const postTitle = req.body.postTitle;
  const postBody = req.body.postBody;
  const author = req.user.username;
  Post.create({
    title: postTitle,
    body: postBody,
    author: author,
  });
  res.redirect("/");
});

// Register Locally
app.post("/register", function (req, res) {
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/");
        });
      }
    }
  );
});

// Login Locally
app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureMessage: true,
  }),
  function (req, res) {
    res.redirect("/");
  }
);

app.listen(process.env.PORT || 3000, function () {
  console.log("Server started on port 3000");
});
