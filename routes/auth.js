require('dotenv').config();
const express = require('express');
const { insert, checkLogin, checkRegister, checkAndGenerateUserOauth2} = require('../models/db');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const passport = require('passport');
const LocalStrategy = require('passport-local');
const GoogleStrategy = require('passport-google-oauth20').Strategy;


var router = express.Router();

passport.use(new LocalStrategy(function verify(email, password, cb) {
    // jd check loginnya dimasukkan ke passport
    checkLogin(email,password).then(row => {
        if (row) {
            bcrypt.compare(password, row.password, function(err,result) {
                if (result) {
                    console.log("login success")
                    return cb(null,row);
                } else {
                    console.log("login failed")
                    return cb(null, false, { message: 'login failed' });
                }
            });
        }
    });
}));

passport.serializeUser(function(user, cb) {
process.nextTick(function() {
    cb(null, { id: user.id, email: user.email, displayName: user.display_name });
});
});

passport.deserializeUser(function(user, cb) {
process.nextTick(function() {
    return cb(null, user);
});
});

router.get('/login',(req,res,next)=>{
    if (!req.user) { return res.render('login'); } else {
        res.redirect('/');
    }
    next();
})

router.post('/login', passport.authenticate('local',{
    successRedirect: '/',
    failureRedirect: '/login'
}));

router.post('/logout', function(req, res, next) {
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  });

router.get('/register',(req,res)=>{
    res.render('register');
})

router.post('/register',(req,res)=>{
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

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:8010/auth/google/callback",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  async function (accessToken, refreshToken, profile, cb) {
    var user = await checkAndGenerateUserOauth2(profile.id, profile.displayName, profile.emails[0].value);
    return cb(null,user);
  }
));

router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile','email'] }));

router.get('/auth/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/login', }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

module.exports = router;