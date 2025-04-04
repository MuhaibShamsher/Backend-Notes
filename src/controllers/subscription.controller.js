import mongoose from "mongoose"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import { Subscription } from "../models/subscription.models.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if(!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelID!")
    }

    const isSubscribed = await Subscription.findOneAndDelete({
        channel: channelId,
        subscriber: req.user?._id
    })

    if(isSubscribed) {
        return res.status(200).json(
            new ApiResponse(200, {}, "Unsubscribed!")
        )
    }

    const subscribed = await Subscription.create({
        channel: channelId,
        subscriber: req.user?._id
    })

    if(!subscribed) {
        throw new ApiError(400, "Failed to subscribe the channel!")
    }

    return res.status(200).json(
        new ApiResponse(200, subscribed, "Subscribed!")
    )
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if(!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelID!")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $project: {
                            _id: 0,
                            userName: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$subscriber"
        },
        {
            $group: {
                _id: "$channel",
                subscribersCount: {
                    $sum: 1
                },
                subscribers: {
                    $push: "$subscriber"
                }
            }
        },
        {
            $project: {
                _id: 0,
                channel: "$_id",
                subscribersCount: 1,
                subscribers: 1
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(200, subscribers[0] || {}, "All subscribes are fetched successfully!")
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if(!mongoose.isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid channelID!")
    }

    const channels = await Subscription.aggregate([
        {
            $match: {
                subscriber: mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
                pipeline: [
                    {
                        $project: {
                            _id: 0,
                            userName: 1,
                            fullName: 1,
                            avatar: 1,
                            createdAt: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$channel"
        },
        {
            $group: {
                _id: "$subscriber",
                subsribedChannels: {
                    $push: "$channel"
                },
                subsribedChannelsCount: {
                    $sum: 1
                }
            }
        },
        {
            $project: {
                _id: 1,
                subscriber: "$_id",
                subsribedChannelsCount: 1,
                subsribedChannels: 1
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(200, channels[0] || {}, "All subscribed channels are fetched successfully!")
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}


/*
$lookup jitne doucments hoo gai utne documents he return kare gaa.
Agr aik single document mei result chahiye tou $group ka use karo
*/