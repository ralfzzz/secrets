const express = require('express');
var router = express.Router();
const { insertSecret, getSecret } = require('../models/db');

router.get('/', async (req,res,next)=>{
    // console.log(req.user);
    if (!req.user) { return res.render('home'); } else {
        var secrets = await getSecret();
        return res.render('secrets', {user: req.user, secrets: secrets});
    }
    next();
})

router.post('/submit',(req,res,next) => {
    var resultInsertSecret = insertSecret(req.body.secrets, req.body.writers);
    if (resultInsertSecret) {
        console.log('secrets inserted into DB!')
        res.redirect('/');
    } else {
        console.log('failed inserted secrets!')
        res.redirect('/');
    }
    next();
});

module.exports = router;
