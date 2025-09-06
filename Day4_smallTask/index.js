const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const { log } = require('console');

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, "public")));


app.get('/', function(req,res){
    fs.readdir(`./files`, function(err, files){
        res.render("index", {files: files});
    })
})

app.get('/file/:filename', function (req, res) {
    fs.readFile(`./files/${req.params.filename}`, 'utf-8', function (err, filedata) {
        if (err) {
            console.log(err);
            return res.status(404).send("File not found.");
        }
        res.render('show', { filename: req.params.filename, filedata: filedata });
    });
});

app.get('/edit/:filename', function(req,res){
        res.render("edit", {filename: req.params.filename});
})

app.post('/edit', function(req,res){
        fs.rename(`./files/${req.body.previous}`, `./files/${req.body.new}`, function(err){
            res.redirect('/');
        })
})

app.post('/create', function (req, res) {
    if (!req.body.title) {
        return res.status(400).send("Title is required.");
    }

    const fileName = req.body.title.split(' ').join('') + ".txt";

    fs.writeFile(`./files/${fileName}`, req.body.details || "", function (err) {
        if (err) {
            console.log(err);
            return res.status(500).send("Error creating file.");
        }
        res.redirect('/');
    });
});


app.listen(3000);