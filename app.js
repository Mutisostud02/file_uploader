require('dotenv').config()
const Express = require('express')
const session = require('express-session')
const { PrismaPg } = require('@prisma/adapter-pg')
const { PrismaClient } = require('./generated/prisma/client.js')
const { PrismaSessionStore } = require('@quixo3/prisma-session-store')
const path = require('path')
const passport = require('passport')
require('./config/passport.js')

const app = Express()

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.use(Express.urlencoded({ extended : true}))
app.use(Express.static(path.join(__dirname, 'public')))

//pg-prisma session configurations
const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

//session configurations
app.use(session({
    store: new PrismaSessionStore(
        prisma,
        {
            checkPeriod: 2 * 60 * 1000,  //ms
            dbRecordIdIsSessionId: true,
            dbRecordIdFunction: undefined,
        }
    ),
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }    
}))

app.use(passport.session())

//get current session user middleware
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next()
})

//import route files
const signUp = require('./routes/sign-up.js')
const login = require('./routes/login.js')
const index = require('./routes/index.js')

//register routes middleware
app.use('/', index)
app.use('/sign-up', signUp);
app.use('/login', login);

//error handler
app.use((error, req, res, next) => {
    console.error(error)
    res.status(500).send("Server Error!")
})

const port = process.env.PORT || 8000;

app.listen(port, (error) => {
    if(error) {
        console.error('Server Error!', error)
        return;
    }
    console.log(`Server running at port ${port}...`)
})