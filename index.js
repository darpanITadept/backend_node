import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt'

mongoose
  .connect("mongodb://localhost:27017", {
    dbName: "backend",
  })
  .then((c) => console.log("Database Connected"))
  .catch((e) => console.log(e));

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const User = mongoose.model("User", userSchema);

// Creating the server
const app = express();

// Using Middlewares
// -----------------
// We use app.use to execute the middleware
// We use static for local files
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//  Setting up the view Engine
app.set("view engine", "ejs");

const isAuthenticated = async (req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    const decoded = jwt.verify(token, "djfaskjdklfjd");
    req.user = await User.findById(decoded._id);

    next();
  } else {
    res.redirect("login");
  }
};

// Get requests
app.get("/", isAuthenticated, (req, res) => {
  res.render("logout", { name: req.user.name });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/logout", (req, res) => {

  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.redirect("/");
});

app.get("/register", (req, res) => {
  res.render("register");
});

// Post requests
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const findUser = await User.findOne({ email });

  if (!findUser) return res.redirect("/register");

  const isMatch = await bcrypt.compare(password, findUser.password)

  if (!isMatch) return res.render("login", { email, message: "Incorrect Password" });

  const token = jwt.sign({ _id: findUser._id },'djfaskjdklfjd');

  res.cookie('token',token,{
    httpOnly:true,
    expires: new Date(Date.now() + 60 * 1000)
  })

  res.redirect('/')
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  const findUser = await User.findOne({ name, email });

  if (findUser) {
    return res.redirect("/login");
  }

  const hashedPassword = await bcrypt.hash(password,10)

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  // Creating a token
  const token = jwt.sign({ _id: user._id }, "djfaskjdklfjd");

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });

  res.redirect("/login");
});

app.listen(8080, () => {
  console.log("Server is working");
});
