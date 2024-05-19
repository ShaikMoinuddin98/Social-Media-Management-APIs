const express = require("express");
const app = express(); //our express server app
const jwt = require("jsonwebtoken"); //for creating temporary tokens
const nodemailer = require("nodemailer"); //for sending mails
const session = require("express-session"); //for maintaining session in apis
const mongoose = require("mongoose"); //our database
const bodyParser = require("body-parser");
const passportLocalMongoose = require("passport-local-mongoose"); //passportjs in local stratagy for mongoose
const passport = require("passport");
const LocalStrategy = require("passport-local");
const crypto = require("crypto");
app.use(bodyParser.json());

//our jwt secret
const JWT_SECRET = "Moin-7396JWT";
//encryption keys
const ENCRYPTION_KEY =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"; // Must be 256 bits (32 characters)
const IV_LENGTH = 16; // For AES, this is always 16
let iv = Buffer.from("1234567890123456", "utf-8");

// Encrypt function
function encrypt(text) {
    let cipher = crypto.createCipheriv(
        "aes-256-cbc",
        Buffer.from(ENCRYPTION_KEY, "hex"),
        iv
    );
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    console.log(`Encrypt - iv: ${iv.toString("hex")}, encrypted: ${encrypted}`);
    return iv.toString("hex") + ":" + encrypted;
}

// Decrypt function
function decrypt(text) {
    let textParts = text.split(":");
    let iv = Buffer.from(textParts.shift(), "hex");
    let encryptedText = Buffer.from(textParts.join(":"), "hex");

    console.log(
        `Decrypt - iv: ${iv.toString(
            "hex"
        )}, encryptedText: ${encryptedText.toString("hex")}`
    );

    let decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        Buffer.from(ENCRYPTION_KEY, "hex"),
        iv
    );
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}

//configuring the transporter for sending mails
const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: "imaginary.hub1@gmail.com",
        pass: "hbur gyqg nvgx ltlg",
    },
});

//configuring our mail like the details of mail
const mailoptions = {
    from: {
        name: "Testing",
        address: "imaginary.hub1@gmail.com",
    },
    to: "",
    subject: "",
    text: "",
};

//function for sending mails
const send = async (transporter, mailoptions) => {
    try {
        await transporter.sendMail(mailoptions);
        console.log("email sent");
    } catch (err) {
        console.log(err);
    }
};

//connecting to database
main()
    .then((res) => {
        console.log("connection success");
    })
    .catch((err) => {
        console.log(err);
    });
async function main() {
    await mongoose.connect(
        "mongodb+srv://King-Moin:Moin-7093@cluster0.3uvscb7.mongodb.net/"
    );
}

//our schema of db
const loginschema = new mongoose.Schema({
    username: {
        type: String,
    },
    email: {
        type: String,
    },
    posts: {
        type: Array,
    },
});

//making our loginschema to make username as the main field for userName
loginschema.plugin(passportLocalMongoose, { usernameField: "username" }); //=-

//creating our database instance
const data = mongoose.model("atg", loginschema);

//configuring session options
const sessionoption = {
    secret: "Moin-7396Session",
    resave: false,
    saveUninitialized: true,
};

//using passport locatstrategy for authenticating
passport.use(
    new LocalStrategy({ usernameField: "username" }, data.authenticate())
);

//serializing user
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

//deserializing user
passport.deserializeUser(function (id, done) {
    data
        .findById(id)
        .exec()
        .then((user) => {
            return done(null, user);
        })
        .catch((err) => {
            return done(err, null);
        });
});

//using our session
app.use(session(sessionoption)); //-------------------

//initializing passport and session for it
app.use(passport.initialize()); //--------------
app.use(passport.session());

//function for checking whether user is authenticated or not
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        // console.log(req.user)
        return next(); // If user is authenticated, continue with the next middleware
    }
    res.status(406).json({ Authenication: false, message: "auth failed" }); // If not authenticated, redirect to login page
}

app.get("/dashboard", verifyToken, (req, res) => {
    res.status(200).json({ Authenication: true, message: "Auth success" });
});

app.post("/signup", async (req, res) => {
    try {
        console.log(req.body);

        let { email, username, password } = req.body;

        email = encrypt(email); //encrypting email

        let inf = {
            username: username,
            email: email,
        };
        let u1 = new data(inf);
        if (password.length < 6) {
            res
                .status(406)
                .json({ message: "password must contain more than 6 letters" });
        } else {
            let reguser = await data.register(u1, password);

            req.login(u1, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    const token = generateToken(u1); //generatin token on successful login

                    passport.authenticate("local", { failureRedirect: "/login" })(
                        req,
                        res,
                        function () {
                            //passing the token in response
                            res.status(200).json({
                                Authenication: true,
                                message: "signup success",
                                token: token,
                            });
                        }
                    );
                }
            });
        }
    } catch (err) {
        res.status(406).json({ message: err.message });
    }
});

app.post("/login", (req, res) => {
    let { username, password } = req.body;

    const user = new data({
        username: username,
        password: password,
    });
    try {
        req.login(user, (err) => {
            if (err) {
                console.log(err);
                res.status(406).json({ message: err.message });
            } else {
                //generating tokken
                const token = generateToken(user);

                passport.authenticate("local", { failureRedirect: "/login" })(
                    req,
                    res,
                    function () {
                        res.status(200).json({
                            Authenication: true,
                            message: "Login success",
                            token: token,
                        });
                    }
                );
            }
        });
    } catch (err) {
        res.status(406).json({ message: err.message });
    }
});

app.post("/logout", async (req, res, next) => {
    //logout method
    await req.logout((err) => {
        if (err) {
            return next(err);
        } else {
            res.status(200).json({ message: "Logout success" });
        }
    });
});

app.post("/forgetpass", async (req, res) => {
    try {
        let { email } = req.body;
        email = encrypt(email);
        console.log(email);
        let user = await data.findOne({ email: email });

        if (user) {
            const secret = JWT_SECRET + "Moin-7093";
            const payload = {
                email: user.email,
                id: user.id,
            };
            console.log(payload);
            const token = jwt.sign(payload, secret, { expiresIn: "2m" });
            const link = `http://localhost:9000/reset-pass/${user.id}/${token}`;
            console.log(link);
            mailoptions.to = decrypt(email);
            mailoptions.subject = "Password Reset Request";
            mailoptions.text = `use this link for updating password,link expires in 2 min,${link}`;
            send(transporter, mailoptions).then((re) => {
                res.status(200).json({ message: "mail sent to given email" });
            });
        } else {
            throw new Error("User not found");
        }
    } catch (error) {
        res.status(406).json({ message: error.message });
    }
});

app.post("/reset-pass/:id/:token", async (req, res) => {
    let { token, id } = req.params;

    let { password } = req.body;

    const secret = JWT_SECRET + "Moin-7093";
    try {
        if (password.length < 6) {
            res.status(406).json({ message: "pass must be greater than 6 chars" });
        } else {
            const payload = jwt.verify(token, secret);
            let u = await data.findOne({ email: payload.email });

            let cp = { username: u.username, email: u.email, post: u.posts };

            await data
                .deleteOne({ email: u.email })
                .then(async (re) => {
                    console.log(u);
                    let d = new data(cp);
                    let ruser = await data.register(d, password);
                    res.status(200).json({ message: "password changed successfully" });
                })
                .catch((err) => {
                    console.log(err);
                    res.status(406).json({ message: err.message });
                });
        }
    } catch (err) {
        console.log(err);
        res.status(406).json({ message: err.message });
    }
});

//Task 2 Starts from here

app.post("/createpost", isLoggedIn, verifyToken, async (req, res) => {
    try {
        console.log(req.user);
        let u = req.user;

        let { post } = req.body;
        let presentposts = [...req.user.posts];
        let newpost = { pname: post, like: 0, comments: [] };
        presentposts.push(newpost);
        let d = await data
            .updateOne({ username: u.username }, { $set: { posts: presentposts } })
            .then((re) => {
                res.status(200).json({ message: "posted successfully" });
            });
    } catch (err) {
        console.log(err);
        res.status(406).json({ Error: err.message });
    }
});

app.post("/getposts", verifyToken, async (req, res) => {
    try {
        let { user } = req.body;

        console.log(req.body);
        let d = await data.findOne({ username: user });
        console.log(d);

        if (d) {
            if (d.posts.length >= 1) {
                res.status(200).json({ message: d.posts });
            } else {
                res.status(406).json({ message: "no posts" });
            }
        } else {
            res.status(406).json({ message: "user not found" });
        }
    } catch (err) {
        res.status(406).json({ message: err.message });
    }
});

app.delete("/deletepost", isLoggedIn, verifyToken, async (req, res) => {
    try {
        console.log(req.user);
        let { post_no } = req.body;
        if (post_no <= req.user.posts.length) {
            let userposts = req.user.posts;
            userposts.splice(post_no - 1, 1);
            let r = await data
                .updateOne(
                    { username: req.user.username },
                    { $set: { posts: userposts } }
                )
                .then((re) => {
                    console.log(re);
                    res.status(200).json({ message: "deleted successfully" });
                });
        } else {
            res.status(406).json({ message: "post not found" });
        }
    } catch (err) {
        res.status(406).json({ error: err.message });
    }
});

app.post("/updatepost", isLoggedIn, verifyToken, async (req, res) => {
    try {
        let { post, post_no } = req.body;
        let currentposts = req.user.posts;
        if (currentposts.length >= post_no) {
            currentposts[post_no - 1].pname = post;

            let r = await data
                .updateOne(
                    { username: req.user.username },
                    { $set: { posts: currentposts } }
                )
                .then((re) => {
                    res.status(200).json({ message: "post updated" });
                });
        } else {
            res.status(406).json({ message: "post not found" });
        }
    } catch (err) {
        res.status(406).json({ message: err.message });
    }
});

app.post("/like", verifyToken, async (req, res) => {
    try {
        let { user, post_no } = req.body;
        let u = await data.findOne({ username: user });
        // .then(async (ress) => {
        if (u) {
            if (u.posts.length >= post_no) {
                console.log(u);
                let post = u.posts;
                console.log(post);
                post[post_no - 1].like += 1;
                let r = await data
                    .updateOne({ username: user }, { $set: { posts: post } })
                    .then((re) => {
                        console.log(re);
                        res.status(200).json({ message: "liked success" });
                    });
            } else {
                res.status(406).json({ message: "post not found" });
            }
        } else {
            res.status(406).json({ message: "user not found" });
        }
        // })
    } catch (err) {
        console.log(err);
        res.status(406).json({ message: "user not found" });
    }
});

app.post("/comment", verifyToken, async (req, res) => {
    try {
        let { user, post_no, comment } = req.body;
        let u = await data.findOne({ username: user });
        if (u) {
            if (u.posts.length >= post_no) {
                let post = u.posts;
                post[post_no - 1].comments.push(comment);
                let r = await data.updateOne(
                    { username: user },
                    { $set: { posts: post } }
                );
                res.status(200).json({ message: "commented" });
            } else {
                res.status(406).json({ message: "Post not found" });
            }
        } else {
            res.status(406).json({ message: "user not found" });
        }
    } catch (err) {
        console.log(err);
        res.status(406).json({ message: err.message });
    }
});

app.delete("/deleteaccount", isLoggedIn, verifyToken, async (req, res) => {
    try {
        let u = await data.deleteOne({ username: req.user.username }).then((re) => {
            res.status(200).json({ message: "account deleted" });
        });
    } catch (err) {
        res.status(406).json({ message: err.message });
    }
});

//task 3

//function for generating JWT token
function generateToken(user) {
    return jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, {
        expiresIn: "1h",
    });
}

//JWT middleware for verifying token
function verifyToken(req, res, next) {
    const token = req.headers["authorization"];
    console.log(req.headers);
    if (!token) return res.status(403).json({ message: "No token provided" });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err)
            return res.status(500).json({ message: "Failed to authenticate token" });

        req.userId = decoded.id;
        next();
    });
}

app.listen("9000", () => {
    console.log("listening");
});
