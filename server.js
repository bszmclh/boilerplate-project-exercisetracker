const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();

//connecting to MongoDB
mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/views/index.html");
});

//create Schema
const { Schema } = mongoose;
const personSchema = new Schema({
    username: { type: String, Required: true },
    log: [{
        description: String,
        duration: Number,
        date: Date
    }]
});
const User = mongoose.model("User", personSchema);

//Get / Create New User
app.post(
    "/api/users",
    bodyParser.urlencoded({ extended: false }),
    (req, res) => {
        var username = req.body.username;
        User.find({ username: username }, (err, user) => {
            if (user.length > 0) {
                res.end("User already exists");
            } else {
                const newUser = new User({
                    username: username,
                });
                newUser.save((err, data) => {
                    if (err) return console.log(err);
                    res.json({ username: data.username, ["_id"]: data["_id"] });
                });
            }
        });
    }
);

//get users
app.get('/api/users', (req, res) => {
    User.find({}, (err, list) => {
        res.json(list);
    })
})

//Add exercise

app.post(
    "/api/users/:_id/exercises",
    bodyParser.urlencoded({ extended: false }),
    (req, res) => {
        if (req.body.date) {
            var date = new Date(req.body.date);
        } else {
            var date = new Date();
        }

        if (date == "Invalid Date") {
            res.end("Invalid Date");
        } else {
            User.findById(req.params['_id'], (err, user) => {
                if (err || !user) {
                    console.log(err.message);
                    return res.end(err.message);
                }
                user.log.push({
                    description: req.body.description,
                    duration: req.body.duration,
                    date: date
                });
                user.save((err, data) => {
                    if (err) return console.log(err);
                    res.json({
                        username: data.username,
                        description: req.body.description,
                        duration: Number(req.body.duration),
                        ["_id"]: data["_id"],
                        date: date.toDateString()
                    });
                });
            });
        }
    }
);

app.get("/api/users/:_id/logs", (req, res) => {
    var id = req.params["_id"];
    User.findById(id)
        .select({ __v: 0 })
        .exec((err, user) => {
            if (err) {
                return res.end(err.message);
            } else {
                if (!user) {
                    res.end("No User with this ID found");
                } else {
                    let filtered = user.log;
                    if (req.query.from) {
                        let fromDate = new Date(req.query.from);

                        if (fromDate == "Invalid Date") {
                            res.end('Invalide "From" Date');
                        } else {
                            filtered = filtered.filter(d => (d.date >= fromDate));
                        }
                    };

                    if (req.query.to) {
                        let toDate = new Date(req.query.to);
                        if (toDate == "Invalid Date") {
                            res.end('Invalide "To" Date');
                        } else {
                            filtered = filtered.filter(d => (d.date <= toDate));
                        }
                    };

                    if (req.query.limit) {
                        if (req.query.limit < 0) {
                            res.end('Invalid "Limit" value')
                        } else {
                            filtered.splice(req.query.limit)
                        }
                    };
                    filtered.forEach(d => d.string = 'test')

                    res.json({
                        "_id": user['_id'],
                        username: user.username,
                        count: filtered.length,
                        log: filtered
                    })
                }
            }
        });


});

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log('Your app is listening on port ' + listener.address().port)
})