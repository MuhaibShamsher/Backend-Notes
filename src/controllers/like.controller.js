import mongoose from "mongoose"
import asyncHandler from '../utils/asyncHandler.js'
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js";
import { Like } from "../models/like.models.js"


const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const deleted = await Like.findOneAndDelete({
        video: videoId,
        likedBy: req.user?._id
    })

    if (deleted) {
        return res.status(204).json(
            new ApiResponse(204, {}, "Unliked Video!")
        )
    }

    await Like.create({
        video: videoId,
        likedBy: req.user?._id
    })

    return res.status(201).json(
        new ApiResponse(201, {}, "Liked Video!")
    )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid commentId");
    }

    const deleted = await Like.findOneAndDelete({
        comment: commentId,
        likedBy: req.user?._id
    })

    if (deleted) {
        return res.status(204).json(
            new ApiResponse(204, {}, "Unliked Comment!")
        )
    }

    await Like.create({
        comment: commentId,
        likedBy: req.user?._id
    })

    return res.status(201).json(
        new ApiResponse(201, {}, "Liked Comment!")
    )
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    if (!mongoose.isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId");
    }

    const deleted = await Like.findOneAndDelete({
        tweet: tweetId,
        likedBy: req.user?._id
    })

    if (deleted) {
        return res.status(204).json(
            new ApiResponse(204, {}, "Unliked Tweet!")
        )
    }

    await Like.create({
        tweet: tweetId,
        likedBy: req.user?._id
    })

    return res.status(201).json(
        new ApiResponse(201, {}, "Liked Tweet!")
    )
})

const getLikedVideos = asyncHandler(async (req, res) => {
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
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
                        $unwind: "$owner"
                    },
                    {
                        $project: {
                            title: 1,
                            description: 1,
                            views: 1,
                            owner: 1
                        }
                    }
                ]
            }
        },
        {
            $group: {
                _id: "$likedBy",
                likedVideosCount: {
                    $sum: 1
                },
                videos: {
                    $push: "$video"
                }
            }
        },
        {
            $project: {
                likedBy: "$_id",
                likedVideosCount: 1,
                videos: 1
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(200, likedVideos[0] || {}, "All Liked videos are fetched!")
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}