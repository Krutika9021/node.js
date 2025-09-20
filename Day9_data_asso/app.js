const express = require('express');
const app = express();
const userModel = require('./models/user');
const postModel = require('./models/post');
const post = require('./models/post');

app.get('/', (req, res) => {
    res.send('Hello World');
})

app.get('/create',async function (req, res) {
    let user = await userModel.create({
        username: "Kruti",
        email: "kruti@gmail.com",
        age: 21
    });

    res.send(user);
})

app.get('/post/create', async function (req, res) {
   let post = await postModel.create({
        postdata: "This is my first post",
        user: "68cef8c91aa45661cae67dfb"
    });

    let user = await userModel.findOne({_id: "68cef8c91aa45661cae67dfb"});
    user.posts.push(post._id);
    await user.save();
    res.send({post, user});
})

app.listen(3000);