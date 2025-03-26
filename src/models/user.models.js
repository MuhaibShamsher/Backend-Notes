import mongoose from "mongoose";


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

export const User = mongoose.model("User", userSchema);