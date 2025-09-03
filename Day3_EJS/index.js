const express = require('express');
const app = express();
const path = require('path');

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public'))); //currpath + /public ... //inshort we will get all static files from public folder
app.set("view engine", "ejs");        //setting view engine to ejs

app.get("/", function(req, res){
    res.render("index");
});

app.get("/profile/:username", function(req, res){ // : makes username a variable and it is dynamic now
    res.send(`Welcome,, ${req.params.username}`)
})

app.get("/author/:username/:age", function(req, res) {
    res.send(`Welcome, ${req.params.username}, your age is ${req.params.age}`);
})

app.listen(3000, function(){
    console.log("Server is running");
})