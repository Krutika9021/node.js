const express = require('express')
const app = express();

app.use(function(req, res, next){
    console.log("Middleware it is!!");
    next();
});

app.use(function(req, res, next){
    console.log("Another middleware!!")
    next();
});

app.get("/", function(req, res) {
    res.send(" Hello, This is my 1st request!");
})
/*
app.get("/profiles", function(req, res) {
    res.send("And my Name is ~autonomous");
})
*/

/*
app.get("/profiles", function(req, res, next){
    return next(new Error("something went wrong"));
});

app.use(function(req,res,next){
   console.error(err.stack)
   res.status(500).send("Something went wrong, I don't know what!")
})
   */

app.listen(3000);