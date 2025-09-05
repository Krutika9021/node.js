const express = require('express');
const userModel =require('./usermodel')
const app = express();

app.get('/', (req, res) => {
    res.send('heyy');
})


app.get('/create', async (req, res) => {
    let createuser = await userModel.create({
        name: "minsha",
        username: "mini123",
        email: "minsha14@gmail.com"
    })
    res.send(createuser);
})

app.get('/update', async (req, res) => {

    //userModel.findOneAndUpdate(findone, update, {new:true})

    let updateduser = await userModel.findOneAndUpdate({username: "krits123"}, {name: "krutika salve"}, {new: true})
    res.send(updateduser);
})

app.get('/read', async (req, res) => {
    let users = await userModel.find();
    res.send(users);
})

app.get('/delete', async (req, res) => {
    let users = await userModel.findOneAndDelete({username: "krits123"});
    res.send(users);
})

app.listen(3000);