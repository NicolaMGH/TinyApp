const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

//url database
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//user database
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

app.get("/", (req, res) => {
  let user = users[req.cookies["user_id"]];
  let templateVars = {user: user};
  res.render("index", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  let user = users[req.cookies["user_id"]];
  let templateVars = {user: user};
  res.send("<html><body>Hello <b>World</b></body></html>\n");
  res.render("urls_index", templateVars);
});

app.get("/urls", (req, res) => {
  let user = users[req.cookies["user_id"]];
  let templateVars = { urls: urlDatabase, user: user};
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let user = users[req.cookies["user_id"]];
  let templateVars = {user: user};
  res.render("urls_new", templateVars);
});

//renders register page
app.get("/register", (req, res) => {
  let user = users[req.cookies["user_id"]];
  let templateVars = {user: user};
  res.render("register", templateVars);
});

//renders login page
app.get("/login", (req, res) => {
  let user = users[req.cookies["user_id"]];
  let templateVars = {user: user};
  res.render("login", templateVars)
})

//posts to /register when a user hits the register button and creates a new user in the database
app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password){
    res.status(400);
    res.send("Please enter an email and password");
  } else if (findEmail(req.body.email)){
    res.status(400);
    res.send("email already exists");
  } else {
    const userId = generateRandomString();
    users[userId] = {id: userId, email: req.body.email, password: req.body.password};
    console.log(users);
    res.cookie("user_id", userId);
    res.redirect("/urls");
  }
});

//add urls to database
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  if(!findEmail(req.body.email)){
    res.status(403);
    res.send("E-mail does not exist.");
  } else if (!findPassword(req.body.password)){
    res.status(403);
    res.send("Password is invalid.");
  } else {
    res.cookie("user_id", findId(req.body.email));
    res.redirect("/");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
})

//deletes url
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.long_URL;
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  let user = users[req.cookies["user_id"]];
  let templateVars = {user: user};
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL, templateVars);
});

app.get("/urls/:id", (req, res) => {
  let user = users[req.cookies["user_id"]];
  let templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id], user: user};
  res.render("urls_show", templateVars);
});

function generateRandomString() {
  let id = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++) {
    id += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return id;
}

function findEmail(email){
  for (let userID in users){
    if(email === users[userID].email){
      return true;
    }
    return false;
  }
};

function findPassword(password){
  for (let pass in users){
    if(password === users[pass].password){
      return true;
    }
    return false;
  }
};

function findId(email){
  for (let id in users){
    if(email === users[id].email){
      return id;
    }
    return false;
  }
};




app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});