function home(req, res) {
    res.render('home')
}

async function protectedRoute(req, res) {  
    res.render('protected-route', { currentUser: req.user});
}

async function fileUploader(req, res) {  
    res.render('fileUploader', { currentUser: req.user});
}

async function logOut(req, res, next) {
    req.logout((err) => {
        if(err) {
            return next(err);
        }
        res.redirect("/")
    })
}

module.exports = { home, protectedRoute, fileUploader, logOut }
