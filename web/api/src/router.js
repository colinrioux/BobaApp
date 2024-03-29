/**
 * Authentication Routes
 *
 * @author Colin Rioux <crioux@scu.edu>
 * @author Horatio Xiao <hxiao@scu.edu>
 * @author Chris Tian <ctian@scu.edu>
 */

const bcrypt = require('bcrypt');
const passport = require('fastify-passport').default;
const LocalStrategy = require('passport-local');

passport.registerUserSerializer = async function (user, done) {
    return done(null, user.id);
}

//TODO
// passport.registerUserDeserializer = async function(serialized, request) {

// }

module.exports = async function (api, opts) {
    // Configure passport js
    api.register(passport.initialize());
    api.register(passport.secureSession());

    // api.db.dbList().run().then(function (result) {
    //     console.log(result);
    // });

    passport.use(new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true
    },
        function (req, username, password, done) {
            // req.body.email
            // req.body.password
            // req.body.accountType ==> customer, owner, admin
            console.log(username)
            api.db.db('users')
                .table(req.body.userType)
                .filter(api.db.row('username').eq(username))
                .run().then(function (err, user) {
                    if (err) {
                        return done(err);
                    }

                    if (!user) {
                        return done(null, false);
                    }

                    user.toArray(function (err, result) {
                        if (err || result.length == 0) {
                            // error handling
                            return done(null, false);
                        }

                        if (!bcrypt.compareSync(password, result[0].password)) {
                            return done(null, false);
                        }

                        return done(null, result[0]);
                    });
                });
        }
    ));


    api.get('/ping', async function (req, res) {
        return { hello: 'colin' };
    });

    api.get('/', {
        preValidation: passport.authenticate('local', { successRedirect: '/', failureRedirect: '/auth' })
    }, async function (req, res) {
        return { hi: 'colin' };
    });


    /**
     * Used to log a user into the platform
     */
    api.post('/login', {
        prevalidation: passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login', failureFlash: true })
        // },
        //     async (request) => `Hello ${request.user.name}!`
    }, async function (req, res) {
        return { success: true, message: "" };
    });


    // api.post('/login', async function (req, res) {
    //     var userType = req.body.userType;
    //     var loginUser = {
    //         username: req.body.username,
    //         password: req.body.password,
    //         userType: userType
    //     };
    //     console.log(loginUser)
    //     return api.db.db("users")
    //         .table(userType)
    //         .filter(api.db.row('username').eq(username))
    //         .run().then(function (result) {
    //             if (result.errors > 0) {
    //                 return { success: false, message: "db insert error" };
    //             }
    //             return { success: true, message: "" };
    //         });
    // });

    /**
     * Used to register a user
     */
    api.post('/register', async function (req, res) {
        try {
            var userType = req.body.userType;
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            var user = {
                email: req.body.email,
                username: req.body.username,
                password: hashedPassword,
                userType: userType
            };
            console.log(user)
            return api.db.db("users")
                .table(userType)
                .insert(user)
                .run().then(function (result) {
                    if (result.errors > 0) {
                        return { success: false, message: "db insert error" };
                    }
                    return { success: true, message: "" };
                });
        } catch {
            return { success: false, message: "error" };
        }
    });

    /**
     * Used to authenticate a user's access to the API
     */
    api.get('/auth', async function (req, res) {
        // TODO (this might just be a simple redirect to /login)
    });

    /**
     * Used to search for boba restaurants based on a search query
     */
    api.get('/search/:query', async function (req, res) {
        var query = req.params['query'];
        var str = '^';
        var quer = str.concat(query);

        return api.db.db("restaurants")
            .table("locations")
            .filter(api.db.row('name').match(quer))
            .run().then(function (result) {
                if (result.errors > 0) {
                    return { success: false, message: "db error" };
                }

                if (result.length <= 0) {
                    return { success: false, message: "no restaurants found" };
                }

                return { success: true, message: "", result: result }
            });
    });

    /**
     * Used to search for boba restaurants relative to the requester's location
     */
    api.get('/search/:lat/:lng', async function (req, res) {
        var lat = Number(req.params['lat']);
        var lng = Number(req.params['lng']);

        var lat_bounds = [-10, 10];
        var lng_bounds = [-10, 10];

        return api.db.db("restaurants")
            .table("locations")
            .between(lat + lat_bounds[0], lat + lat_bounds[1], { index: 'lat' })
            .run().then(function (result) {
                if (result.errors > 0) {
                    return { success: false, message: "db error" };
                }
                var results = [];
                for (let x in result) {
                    var loc = result[x];
                    if (lng_bounds[0] + lng <= loc.lng && lng_bounds[1] + lng >= loc.lng) {
                        results.push(loc);
                    }
                }
                return { success: true, message: "", result: results };
            });
        // TODO
        // 1. Determine range of lat/lng coordinates that are in a radius of MAX 25 miles
        // 2. Make a call to the database fetching all entries within the range
        // 3. Return a response of the json format:
        // var response = { 
        //     results: [{
        //         name: "Restaurant A",
        //         //...
        //     }, {
        //         name: "Restaurant B",
        //         //...
        //     }]
        // }
    });

    /**
     * Used to bookmark a location
     */
    api.put('/bookmark/add/:lat/:lng', async function (req, res) {
        var lat = req.params['lat'];
        var lng = req.params['lng'];

        // TODO
        // 1. Get the user via their api session cookie
        // 2. Update the user's db save to include the lat/lng of their new bookmark
        // 2.a. If lat/lng bookmark already exists, success = false, message = "exists"
        // 3. Return a json response: { success: true/false, message: "" }
    });

    /**
     * Used to remove a bookmark
     */
    api.delete('/bookmark/remove/:lat/:lng', async function (req, res) {
        var lat = req.params['lat'];
        var lng = req.params['lng'];

        // TODO
        // 1. Get the user via their api session cookie
        // 2. Update the user's db save to remove the bookmark of lat/lng
        // 3. Return a json response: { success: true/false, message: "" }
    });

    /**
     * Used to get a restaurant at an exact location
     * - Useful for bookmarks / other requests requiring a lat/lng ==> name translation
     */
    api.get('/restaurant/get/:lat/:lng', async function (req, res) {
        var lat = req.params['lat'];
        var lng = req.params['lng'];

        return api.db.db("restaurants")
            .table("locations")
            .filter({ lat: Number(lat), lng: Number(lng) })
            .run().then(function (result) {
                if (result.errors > 0) {
                    return { success: false, message: "db error" };
                }
                if (result.length <= 0) {
                    return { success: false, message: "no results found" };
                }
                return { success: true, message: "", result: result[0] };
            });
    });

    /**
     * Used to list all restaurants
     */
    api.get('/restaurant/list', async function (req, res) {
        return api.db.db("restaurants")
            .table("locations")
            .filter(function (doc) {
                return doc.hasFields('name');
            })
            .run().then(function (result) {
                if (result.errors > 0) {
                    return { success: false, message: "db error" };
                }

                return { success: true, message: "", result: result };
            });
    });

    /**
     * Used to add a restaurant at lat/lng into the database
     */
    api.post('/restaurant/add/:lat/:lng', async function (req, res) {
        var lat = req.params['lat'];
        var lng = req.params['lng'];

        var document = {
            name: req.body.name,
            lat: Number(lat),
            lng: Number(lng),
            address: req.body.address,
            hours: req.body.hours,
            owner: req.body.owner,
            feedback: []
        };

        return api.db.db("restaurants")
            .table("locations")
            .insert(document)
            .run().then(function (result) {
                if (result.errors > 0) {
                    return { success: false, message: "db insert error" };
                }
                return { success: true, message: "" };
            });
    });

    /**
     * Used to submit feedback to the restaurant at lat/lng
     */
    api.post('/feedback/add/:lat/:lng', async function (req, res) {
        var lat = req.params['lat'];
        var lng = req.params['lng'];

        var feedback = {
            title: req.body.title,
            summary: req.body.summary
        };

        // Todo handle achievements for user

        return api.db.db("restaurants")
            .table("locations")
            .filter({ lat: Number(lat), lng: Number(lng) })
            .update({
                feedback: api.db.row('feedback').append(feedback)
            })
            .run().then(function (result) {
                if (result.errors > 0) {
                    return { success: false, message: "db update error" };
                }
                return { success: true, message: "" };
            });
    });

    /**
     * Used to get the feedback for a restaurant at lat/lng
     */
    api.get('/feedback/list/:lat/:lng', async function (req, res) {
        var lat = req.params['lat'];
        var lng = req.params['lng'];

        // TODO
        // 1. Verify if the user via user session cookie is restaurant owner
        // 2. Verify if the user is this restaurant's owner (comparing lat/lng)

        return api.db.db("restaurants")
            .table("locations")
            .filter({ lat: Number(lat), lng: Number(lng) })
            .run().then(function (result) {
                if (result.errors > 0) {
                    return { success: false, message: "db error" };
                }
                return { success: true, message: "", result: result[0].feedback };
            });
    });
};
