import asyncHandler from '../utils/asyncHandler.js'
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApirResponse.js";
import jwt from "jsonwebtoken"
import { User } from '../models/user.models.js';
import { uploadOnCloudinary, deleteOnCloudinary } from '../utils/cloudinary.js';
import mongoose from 'mongoose';


/*
** For Registering a user **
-> get data from frontend
-> validate all required fields are filled
-> check if user already exists
-> retreive images from local server
-> store images on cloudinary
-> create a user object and store the data on the database
-> verify that the user is created and send a response to user excluding password & refrestToekn values
*/

const registerUser = asyncHandler(async (req, res) => {
    const { userName, email, password, fullName } = req.body;

    const emptyField = [userName, email, password, fullName].some(field => !field || field.trim() === "") // check this
    if (emptyField) {
        throw new ApiError(400, "All fields are required");
    }

    const alreadyExists = await User.findOne({
        $or: [{ userName }, { email }]
    })
    if (alreadyExists) {
        throw new ApiError(400, "User already exists");
    }

    let avatarUploaded;
    if (req.files && req.files.avatar && req.files.avatar.length > 0) {
        const avatarLocalPath = req.files.avatar[0].path
        avatarUploaded = await uploadOnCloudinary(avatarLocalPath);
    } else {
        throw new ApiError(400, "Avatar image required");
    }

    let coverImageUploaded;
    if (req.files && req.files.coverImage && req.files.coverImage.length > 0) {
        const coverImageLocalPath = req.files.coverImage[0].path;
        coverImageUploaded = await uploadOnCloudinary(coverImageLocalPath);
    } else {
        coverImageUploaded = ""
    }

    const userRegistered = await User.create({
        userName,
        email,
        password,
        fullName,
        coverImage: coverImageUploaded === "" ? "" : coverImageUploaded.url,
        avatar: avatarUploaded.url
    })

    if (!userRegistered) {
        throw new ApiError(500, "Failed to registered user");
    }

    const user = await User.findById(userRegistered._id).select("-password -refreshToken");

    res.status(200).json(
        new ApiResponse(200, user, "User registered successfully!")
    )
})

/*
** Logining User**
-> get data from client
-> validate all fields are filled
-> check if userName/email exists in the database
-> check if password is correct
-> generate access token and refresh token
-> send tokens as cookies
*/

const loginUser = asyncHandler(async (req, res) => {
    const { userName, email, password } = req.body;

    if ((!userName && !email) || !password) {
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findOne({
        $or: [{ userName }, { email }]
    })

    if (!user) {
        throw new ApiError(400, "Incorrect credentials!");
    }

    const validPassword = await user.isPasswordCorrect(password);
    if (!validPassword) {
        throw new ApiError(400, "Incorrect credentials!");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "user logged in successfully!"
            )
        )
})

/*
** Logging Out **
-> Require user ID to remove tokens from DB and Cookies
-> Use middleware that allowed to add "user" property in the 'req'
-> Retrieve ID from user and performed require action
*/

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true // this will allow to return updated user
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, "User logout successfully!")
        )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request!")
    }

    let decodedToken;
    try {
        decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
        throw new ApiError(403, "Invalid or expired refresh token!");
    }

    const user = await User.findById(decodedToken?._id)

    if (!user) {
        throw new ApiError(401, "Invalid refresh token!");
    }

    if (incomingRefreshToken !== user.refreshToken) {
        throw new ApiError(401, "Unauthorized access!");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false })

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, { accessToken, refreshToken }, "New access token is generated!")
        )
})

const updatePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    console.log(oldPassword)
    console.log(newPassword)

    if (!newPassword || newPassword.trim().length < 5) {
        throw new ApiError(400, "New password must be at least 5 characters long!");
    }

    if (newPassword !== confirmPassword) {
        throw new ApiError(400, "new Password and confirm Password should be same!")
    }

    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found!")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Enter your correct password!")
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false })

    return res.status(200).json(
        new ApiResponse(200, {}, "Password Updated Successfully!")
    )
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, req.user, "Current logged in user!")
    )
})

const updateAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(404, "Avatar file required!")
    }

    const fileUploaded = await uploadOnCloudinary(avatarLocalPath);

    if (!fileUploaded.url) {
        throw new ApiError(500, "Failed to upload file!")
    }

    const user = await User.findById(req.user._id).select("-password -refreshToken")
    if(!user) {
        throw new ApiError(500, "User not found!")
    }

    if(user.avatar) {
        await deleteOnCloudinary(user.avatar);
    }

    user.avatar = fileUploaded.url
    await user.save({ validateBeforeSave: false })

    return res.status(200).json(
        new ApiResponse(200, user, "Avatar updated successfully!")
    )
})

const updateCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(404, "Cover image file required!")
    }

    const fileUploaded = await uploadOnCloudinary(coverImageLocalPath);

    if (!fileUploaded.url) {
        throw new ApiError(500, "Failed to upload file!")
    }

    const user = await User.findById(req.user._id).select("-password -refreshToken")
    if(!user) {
        throw new ApiError(500, "User not found!")
    }

    if(user.coverImage) {
        await deleteOnCloudinary(user.avatar);
    }

    user.coverImage = fileUploaded.url
    await user.save({ validateBeforeSave: false })

    return res.status(200).json(
        new ApiResponse(200, user, "Cover image updated successfully!")
    )
})

const updateEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if(!email || email?.trim() === "") {
        throw new ApiError(400, "Invalid email!")
    }

    const userExists = await User.findOne({ email })
    if(userExists) {
        throw new ApiError(404, "This email is already in use!")
    }

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                email: email
            }
        },
        {
            new: true
        }
    )

    return res.status(200).json(
        new ApiResponse(200, {}, "Email updated Successfully!")
    )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const userName = req.params;

    if(!userName && userName.trim() === "") {
        throw new ApiError(404, "User not found!")
    }

    const channel = await User.aggregate([
        {
            $match: {
                userName: userName
            }
        },

        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },

        {
            // MongoDB finds all subscriptions where User._id matches subscriptions.subscriber and stores them in the subscribedTo array.
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },

        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                subscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    // current active user kya viewing user ke subscriber list mei hai ya nahi
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]}, 
                        then: true,
                        else: false
                    }
                }
            }
        },

        {
            $project: {
                // _id will be displayed by default unless you explicitly exclude it.
                userName: 1,
                fullName: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: 1,
                subscribedToCount: 1,
                isSubscribed: 1
            }
        }
    ])

    // optional channing will check for null and undefined
    // not operator will return true if an array is empty
    if(!channel?.length) {
        throw new ApiError(404, "Channel does not exists!")
    }

    // aggregate() returns an array. so, channel will be an array of a object
    return res.status(200).json(
        new ApiResponse(200, channel[0], "User channel fetched successfully!")
    )
})

const watchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId(req.user?._id)
            }
        },

        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",

                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",

                            pipeline: [
                                {
                                    $project: {
                                        userName: 1,
                                        fullName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },

                    {
                        // The $first operator extracts the first element of the owner array and assigns it to the owner field.
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    if(!user) {
        throw new ApiError(404, "Invalid user!")
    }

    return res.status(200).json(
        new ApiResponse(200, user[0].watchHistory, "watch histort fetched successfully!")
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    updatePassword,
    updateAvatar,
    updateCoverImage,
    updateEmail,
    getUserChannelProfile,
    watchHistory
}



/*
arr.some() = Returns true if at least one element passes, otherwise false.

User.findById(userRegistered._id).select("-password -refreshToken")
retrieves a user from the database while excluding fields password and refreshToken

User.findOne({
    $or: [{ userName }, { email }]
});
check if a user with the same userName or email already exists.


$set → Updates or adds a field to a document.
$unset → Completely removes a field from a document.

MongoDB aggregation operators:
$size:  counts elements in an array.
$in:    checks if a value exists inside an array.
$cond:  acts like an IF-ELSE statement.
*/


/*
Output of the watchHistory functioon:
[
    {
        "_id": "U1",
        "userName": "john_doe",
        "watchHistory": [
            {
                "_id": "V101",
                "title": "MongoDB Aggregation",
                "owner": {
                    "userName": "alice_smith",
                    "fullName": "Alice Smith",
                    "avatar": "alice_avatar.jpg"
                }
            },
            {
                "_id": "V102",
                "title": "Node.js Crash Course",
                "owner": {
                    "userName": "bob_jones",
                    "fullName": "Bob Jones",
                    "avatar": "bob_avatar.jpg"
                }
            }
        ]
    }
]
*/