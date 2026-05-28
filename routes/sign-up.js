const { getSignUp, postSignUp} = require('../controllers/sign-up')
const signUp = require('express').Router()

signUp.get('/', getSignUp);
signUp.post('/', postSignUp);

module.exports = signUp;