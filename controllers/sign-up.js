const bcrypt = require('bcryptjs');
const { prisma } = require('../lib/prisma');
async function getSignUp(req, res) {
    res.render('sign-up');
}

async function postSignUp(req, res) {
    try {
    const {username, email, password} = req.body;
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
        data: {
            username: username,
            email: email,
            password: hashedPassword,
        }
    })
    res.send("User sign-up successful")
} catch(error) {
    console.error(error)
    res.status(500).send('Sign-up failed!')
}
}

module.exports = { getSignUp, postSignUp }