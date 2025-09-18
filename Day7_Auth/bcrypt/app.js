const express = require('express');
const app = express();
const bcrypt = require('bcrypt');


/* app.get("/", function(req, res) {
    bcrypt.genSalt(10, function(err, salt){
        bcrypt.hash("thisismypass",salt, function(err, hash){
            console.log(hash);
        })
    })
})
*/

/*
app.get("/", function(req, res) {
    
        bcrypt.compare("thisismypa","$2b$10$dTJxsozh6ij45tVUuLa3oeUYvNzryF292Hh9d8Mlb8X./mD118hKi", function(err, result){
            console.log(result);
        })
})
        */

app.get("/", function(req, res) {
    bcrypt.compare("thisismypa","$2b$10$dTJxsozh6ij45tVUuLa3oeUYvNzryF292Hh9d8Mlb8X./mD118hKi", function(err, result){
        console.log(result);
    })
})
app.listen(3000);

