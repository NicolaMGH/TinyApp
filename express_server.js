const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
const bcrypt = require('bcrypt');

app.set("view engine", "ejs");

//url database
const urlDatabase = {
  "bV2xn2":{
    id: "userRandomID",
    longURL: "http://www.lighthouselabs.ca"
  },
  "9sm5xK":{
    id: "user2RandomID",
    longURL: "http://www.google.com"
  }
};

//user database
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "123"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "12345"
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
  let templateVars = { urls: urlsForUser(req.cookies["user_id"]), user: user};
  res.render("urls_index", templateVars);

});

app.get("/urls/new", (req, res) => {
  if(req.cookies["user_id"] === undefined){
    res.redirect("/login");
  } else {
    let user = users[req.cookies["user_id"]];
    let templateVars = {user: user};
    res.render("urls_new", templateVars);
  }
});

app.post("/urls/new", (req, res) => {
  res.redirect("/urls/new");
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
  res.render("login", templateVars);
});

//posts to /register when a user hits the register button and creates a new user in the database
app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password){
    res.status(400);
    res.send("Please enter an email and password");
  } else if (findEmail(req.body.email)){
    res.status(400);
    res.send("email already exists");
  } else {
    const password = req.body.password;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const userId = generateRandomId();
    users[userId] = {id: userId, email: req.body.email, password: hashedPassword};
    console.log(users);
    res.cookie("user_id", userId);
    res.redirect("/urls");
  }
});

//add urls to database
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {id: req.cookies['user_id'], longURL: req.body.longURL};
  console.log(urlDatabase)
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  if(!findEmail(req.body.email)){
    res.status(403);
    res.send("E-mail does not exist.");
  } else {
    let user = findUser(req.body.email)

    if (bcrypt.compareSync(req.body.password, user.password)) {
      res.cookie("user_id", user.id);
      res.redirect("/");
    } else{
      res.status(403);
      res.send("Invalid e-mail or password.");
    }
  }


});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

//deletes url
app.post("/urls/:id/delete", (req, res) => {
  if(users[req.cookies['user_id']].id !== auth(req.cookies["user_id"], urlsForUser(req.cookies["user_id"]))){
    res.redirect("/login");

  } else {
    delete urlDatabase[req.params.id];

    res.redirect("/urls");
  }
});

//posts the url udpdate
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id].longURL = req.body.long_URL;
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  // let user = users[req.cookies["user_id"]];
  // let templateVars = {user: user};
  let longaURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longaURL);
});

//updates url
app.get("/urls/:id", (req, res) => {
  if(req.cookies["user_id"] === undefined){
    res.redirect("/login");
  } else if (users[req.cookies['user_id']].id !== auth(req.cookies["user_id"], urlsForUser(req.cookies["user_id"]))){
    res.redirect("/login");
  } else {
    let user = users[req.cookies["user_id"]];
    let templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id].longURL, user: user};
    res.render("urls_show", templateVars);
  }
});

function generateRandomId() {
  let id = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 10; i++) {
    id += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return id;
}

function generateRandomString() {
  let string = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 6; i++) {
    string += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return string;
}

//functions to find email, password and id
function findEmail(email){
  for (let userID in users){
    if(email === users[userID].email){
      return true;
    }
  }
  return false;
}

//finded user object by email and returns that object
function findUser(email){
  for (let user in users){
    if(users[user].email === email){
      return users[user];
    }
  }
  return false;
}

// function findId(email){
//   for (let id in users){
//     if(email === users[id].email){
//       return id;
//     }
//   }
//   return false;
// }

//takes in a user id and database to provide the userid for that database
function auth(userId, db){
  for (let id in db){
    if(userId === db[id].id){
      return db[id].id;
    }
  }
  return false;
}

//pushed user specific urls to a new object
function urlsForUser(id){
  const specific = {};
  for(let spec in urlDatabase){
    if(urlDatabase[spec].id === id){
      specific[spec] = urlDatabase[spec]
    }
  }
  return specific
}


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});