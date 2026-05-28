const passport = require('passport');
const { prisma } = require('../lib/prisma');
const bcrypt = require('bcryptjs')
const LocalStrategy = require('passport-local').Strategy;

const verificationCallback = async (username, password, done) => {
    try {
        const user = await prisma.user.findUnique({
            where: { username: username },
        })
        if(!user) {
            return done(null, false, { message: "Incorrect username!" })
        }
        const match = await bcrypt.compare(password, user.password);
        if(!match) {
            return done(null, false, { message: "Incorrect password!" });
        }
        return done(null, user)
    } catch(err) {
        return done(err)
    }
}

passport.use(new LocalStrategy(verificationCallback));

passport.serializeUser((user, done) => {
    done(null, user.id)
})

passport.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: id },
        })
        done(null, user)
    } catch(err) {
        done(err)
    }
})