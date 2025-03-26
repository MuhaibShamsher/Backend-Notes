import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
    {
        userName: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true
        },

        password: {
            type: String,
            required: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },

        fullName: {
            type: String,
            required: true,
            trim: true
        },

        avatar: {
            type: String, // cloudinary url
            required: true
        },

        coverImage: {
            type: String, // cloudinary url
        },

        refreshToken: {
            type: String
            // required: true,
        },

        watchHistory: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video"
            }
        ]
    },
    {
        timestamps: true
    }
)


userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }

    next();
})


userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}


userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            userName: this.userName,
            fullName: this.fullName,
            email: this.email
        },

        process.env.ACCESS_TOKEN_SECRET,

        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}


userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        { _id: this._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    )
}


export const User = mongoose.model("User", userSchema);






/*
bcrypt:
    A package that converts passwords into hashes
    bcrypt.hash(password, saltRounds) => Hashing a Password
    bcrypt.compare(enteredPassword, storedHashedPassword) => Comparing Passwords, return true or false

JWT: JSON Web Token
    A secure way to transmit information between a client and a server.
    consist of three parts:
    1. Header:	Contains metadata like token type & algorithm { "alg": "HS256", "typ": "JWT" }
    2. Payload:	Contains user data { "userId": "1234567890", "role": "admin" }
    3. Signature: Ensures JWT is not modified (A hashed value using a secret key)

    JWT aik bear token hai, mtlb jis ke pass yeh token hoo gaa us ko data bhej dai gai
    Access Token database mei save nahi hoo gaa, Refresh token database mei save hoo gaa
    Refresh token is used to generate a new access token

    token = jwt.sign({ paylaod }, secret key, { options })

Pre Hook/Middleware: 
    A pre hook in Mongoose is a middleware that executes before an operation/event happens in the database.
    schemaName.pre(event, call-back function)
    Arrow functions (() => {}) do NOT have their own 'this' so avoid them in mongoose hooks

Custom hooks:
    schemaName.methods.propertyName = () => {}
*/