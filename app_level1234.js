const express = require('express');
const bodyParser = require('body-parser');
const { insert, check, checkRegister} = require('./models/db');
require('dotenv').config();
const md5 = require('md5');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();
const port = 8010;
app.use(express.static('public'));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));


app.get('/',(req,res)=>{
    res.render('home');
})

app.get('/register',(req,res)=>{
    res.render('register');
})

app.post('/register',(req,res)=>{
    var email = req.body.username;
    var password = req.body.password;
    bcrypt.hash(password, saltRounds, function(err, hash) {
        // Store hash in your password DB.
        checkRegister(email).then(statusRegister=>{
            if (statusRegister==0) {
                insert(email,hash).then(status => {
                    if (status) {
                        console.log('User inserted');
                        res.redirect('/');
                    } else {
                        res.redirect('/register');
                    }
                });
            } else {
                console.log("email already registered!")
                res.redirect('/register');
            }
        })
    });

})

app.get('/login',(req,res)=>{
    res.render('login');
})

app.post('/login',(req,res)=>{
    var email = req.body.username;
    var password = req.body.password;
    check(email,password).then(status => {
        if (status) {
            bcrypt.compare(password, status, function(err, result) {
                // result == true
                if (result) {
                    console.log("login success")
                    res.render('secrets');
                } else {
                    console.log("login failed")
                    res.redirect('/login');
                }
            });
        }
    });
})

app.listen(port,()=>{
    console.log(`server running on port ${port}`);
});