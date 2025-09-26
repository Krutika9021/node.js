const express = require('express');
const app = express();
const userModel = require('./models/user');
const postModel = require('./models/post');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const crypto = require("crypto");
const path = require("path");

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images/uploads')
    },
    filename: function (req, file, cb) {
        crypto.randomBytes(12, function (err, bytes){
            const fn = bytes.toString("hex") + path.extname(file.originalname)
            cb(null, fn)
        })
    }
})

const upload = multer({ storage: storage })


app.get('/', (req, res) => {
    res.render("index");
});

app.get("/test", (req, res) => {
    res.render("test");
});

app.post("/upload", upload.single("image"), (req, res) => {
    console.log(req.file);
});

app.get('/login', (req, res) => {
    res.render("login");
});

app.get('/profile', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({email: req.user.email}).populate("posts");
    res.render("profile", {user});

});

app.get('/like/:id', isLoggedIn, async (req, res) => {
    let post = await postModel.findOne({_id: req.params.id}).populate("user");

    if(post.likes.indexOf(req.user.userid) === -1){
        post.likes.push(req.user.userid);
    }
    else{
        post.likes.splice(post.likes.indexOf(req.user.userid), 1)
    }
    await post.save();
    res.redirect("/profile");
});

app.get("/edit/:id", isLoggedIn, async (req, res) => {
    let post = await postModel.findOne({_id: req.params.id}).populate("user");

    res.render("edit", {post})
});

app.post("/update/:id", isLoggedIn, async (req, res) => {
    let post = await postModel.findOneAndUpdate({_id: req.params.id}, {content: req.body.content});

    res.redirect("/profile")
});

app.post('/post', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({email: req.user.email});
    let {content} = req.body;

    let post = await postModel.create({
        user: user._id,
        content
    });

    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");
});

app.post('/register', async (req, res) => {
    try {
        let { email, password, username, name, age } = req.body;

        // check if user exists
        let existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).send("User already exists");
        }

        // hash password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // create new user
        let newUser = await userModel.create({
            username,
            email,
            name,
            age,
            password: hash
        });

        // sign token with new user info
        let token = jwt.sign(
            { email: newUser.email, userid: newUser._id },
            "shhhh"
        );

        // set cookie
        res.cookie("token", token);
        res.send("Registered Successfully");
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

app.post('/login', async (req, res) => {
    try {
        let { email, password} = req.body;

        // check if user exists
        let existingUser = await userModel.findOne({ email });
        if (!existingUser) {
            return res.status(400).send("User does not exist");
        }

        const isMatch = await bcrypt.compare(password, existingUser.password);
        if(!isMatch) res.status(400).send("Something went wrong"); 
        let token = jwt.sign(
            { email: existingUser.email, userid: existingUser._id },
            "shhhh"
        );

        res.cookie("token", token); 
        res.redirect("/profile");
        
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

app.get('/logout', (req, res) => {
    res.cookie("token", "");
    res.redirect("/login");
})

function isLoggedIn(req, res, next) {
    if(req.cookies.token === "") res.redirect("/login");
    else {
        let data =  jwt.verify(req.cookies.token, "shhhh");
        req.user = data;
        next();
    }
}

app.listen(3000);
