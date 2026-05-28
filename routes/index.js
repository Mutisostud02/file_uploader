const home = require('../controllers');
const { isAuthenticated } = require('../controllers/isAuthenticated');
const index = require('express').Router()

index.get('/', home.home);
index.get('/protected-route', isAuthenticated, home.protectedRoute)
index.get('/fileUploader', isAuthenticated, home.fileUploader)
index.get('/logout', home.logOut);


module.exports = index;