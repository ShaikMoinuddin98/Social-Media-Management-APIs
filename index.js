const express = require("express")
const app = express()//our express server app
const jwt = require("jsonwebtoken")//for creating temporary tokens
const nodemailer = require("nodemailer")//for sending mails 
const session = require("express-session")//for maintaining session in apis
const mongoose = require("mongoose")//our database
const bodyParser = require("body-parser")
const passportLocalMongoose = require("passport-local-mongoose")//passportjs in local stratagy for mongoose
const passport = require("passport")
const LocalStrategy = require("passport-local")

app.use(bodyParser.json());

//our jwt secret
const JWT_SECRET = "Moin-7396JWT"




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
        address: "imaginary.hub1@gmail.com"
    },
    to: "",
    subject: "",
    text: ""

}

//function for sending mails
const send = async (transporter, mailoptions) => {
    try {
        await transporter.sendMail(mailoptions)
        console.log("email sent")

    }
    catch (err) {
        console.log(err)
    }
}



//connecting to database
main()
    .then((res) => {
        console.log("connection success")
    })
    .catch((err) => {
        console.log(err)
    })
async function main() {
    await mongoose.connect("mongodb+srv://King-Moin:Moin-7093@cluster0.3uvscb7.mongodb.net/");
}

//our schema of db
const loginschema = new mongoose.Schema({
    username: {
        type: String
    },
    email: {
        type: String
    }
})

//making our loginschema to make username as the main field for userName
loginschema.plugin(passportLocalMongoose, { usernameField: 'username' })//=-

//creating our database instance
const data = mongoose.model("atg", loginschema)

//configuring session options
const sessionoption = { secret: "Moin-7396Session", resave: false, saveUninitialized: true }

//using passport locatstrategy for authenticating
passport.use(new LocalStrategy({ usernameField: 'username' }, data.authenticate()));


//serializing user
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

//deserializing user
passport.deserializeUser(function (id, done) {
    data.findById(id).exec()
        .then(user => {
            return done(null, user);
        })
        .catch(err => {
            return done(err, null);
        });
});

//using our session
app.use(session(sessionoption))//-------------------

//initializing passport and session for it
app.use(passport.initialize())//--------------
app.use(passport.session())


//function for checking whether user is authenticated or not
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        // console.log(req.user)
        return next(); // If user is authenticated, continue with the next middleware
    }
    res.status(406).json({ Authenication: false, message: "auth failed" }); // If not authenticated, redirect to login page
}



app.get("/dashboard", isLoggedIn, (req, res) => {
    res.status(200).json({ Authenication: true, message: "Auth success" })
})



app.post("/signup", async (req, res) => {
    try {
        console.log(req.body)

        let { email, username, password } = req.body

        let inf = {

            username: username,
            email: email
        }
        let u1 = new data(inf)
        if (password.length < 6) {

            res.status(406).json({ message: "password must contain more than 6 letters" })
        }
        else {
            let reguser = await data.register(u1, password)

            req.login(u1, (err) => {
                if (err) {
                    console.log(err)
                }

                else {


                    passport.authenticate("local", { failureRedirect: "/login" })(req, res, function () {

                        res.status(200).json({ Authenication: true, message: "signup success" })
                    })


                }
            })
        }
    }

    catch (err) {

        res.status(406).json({ message: err.message })
    }

})



app.post("/login", (req, res) => {
    let { username, password } = req.body
    const user = new data({
        username: username,
        password: password
    })
    try {
        req.login(user, (err) => {
            if (err) {
                console.log(err)
                res.status(406).json({ message: err.message })
            }

            else {


                passport.authenticate("local")(req, res, function () {

                    res.status(200).json({ Authenication: true, message: "Login success" })
                })


            }
        })
    }
    catch (err) {
        res.status(406).json({ message: err.message })

    }

})

app.post("/logout", async (req, res, next) => {
    //logout method
    await req.logout((err) => {
        if (err) {
            return next(err)
        }
        else {
            res.status(200).json({ message: "Logout success" })
        }
    })

})











app.post("/forgetpass", async (req, res) => {
    try {
        let { email } = req.body;
        let user = await data.findOne({ email: email });

        if (user) {

            const secret = JWT_SECRET + "Moin-7093"
            const payload = {
                email: user.email,
                id: user.id
            }
            console.log(payload)
            const token = jwt.sign(payload, secret, { expiresIn: "2m" })
            const link = `http://localhost:9000/reset-pass/${user.id}/${token}`
            console.log(link)
            mailoptions.to = email
            mailoptions.subject = "Password Reset Request"
            mailoptions.text = `use this link for updating password,link expires in 2 min,${link}`
            send(transporter, mailoptions)
                .then((re) => {
                    res.status(200).json({ message: "mail sent to given email" })
                })
        } else {
            throw new Error("User not found");
        }
    } catch (error) {

        res.status(406).json({ message: error.message })

    }
});



app.post("/reset-pass/:id/:token", async (req, res) => {
    let { token, id } = req.params

    let { password } = req.body

    const secret = JWT_SECRET + "Moin-7093"
    try {
        if (password.length < 6) {

            res.render("updatepass.ejs")
        }
        else {
            const payload = jwt.verify(token, secret)
            let u = await data.findOne({ email: payload.email })


            let cp = { username: u.username, email: u.email }

            await data.deleteOne({ email: u.email })
                .then(async (re) => {


                    console.log(u)
                    let d = new data(cp)
                    let ruser = await data.register(d, password)
                    res.status(200).json({ message: "password changed successfully" })
                })
                .catch((err) => {
                    console.log(err)
                    res.status(406).json({ message: err.message })
                })

        }
    }
    catch (err) {

        console.log(err)
        res.status(406).json({ message: err.message })
    }
})















app.listen("9000", () => {
    console.log("listening")
})