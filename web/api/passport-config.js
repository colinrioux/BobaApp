const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
const { ModuleFilenameHelpers } = require('webpack')

function initialize(passport, getUserByUsername, getUserByID) {
    const autehnticateUser = (username, password, done) => {
        const user = getUserByUsername(username)
        if (user == null) {
            return (null, false, { message: 'No user with that username' })
        }

        try {
            if (await bcrypt.compare(password, user.password)) {
                return done(null, user)
            } else {
                return done(null, false, { message: "User password incorrect" })
            }
        } catch (e) {
            return done(e)
        }
    }

    passport.use(new LocalStrategy({ usernameField: 'username' },
        authenticateUser))
    passport.serializeUser((user, done) => done(null, user.id))
    passport.deseralizeUser((id, done) => {
        done(null, getUserByID(id))
    })
}

module.exports = initialize