const logInGet = require('../controllers/login')
const passport = require('passport')

const login = require('express').Router()

login.get('/', logInGet)
login.post('/', passport.authenticate('local', {
    successRedirect: "/protected-route",
    failureRedirect: "/"
}))

module.exports = login;