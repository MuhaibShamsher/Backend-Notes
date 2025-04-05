import mongoose from "mongoose"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import { Playlist } from "../models/playlist.models.js"
import { Video } from "../models/video.models.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    if(!name || name.trim() === "") {
        throw new ApiError(400, "Invalid playlist name!")
    }

    const playlist = Playlist.create({
        name,
        description,
        owner: req.user?._id
    })

    if(!playlist) {
        throw new ApiError(400, "Failed to create a playlist!")
    }

    return res.status(200).json(
        new ApiResponse(200, playlist, "Playlist created successfully!")
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body

    if(!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID!")
    }

    if(!name || !description) {
        throw new ApiError(400, "Name or description required!")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description
            }
        },
        {
            new: true
        }
    )

    if(!updatedPlaylist) {
        throw new ApiError(400, "failed to update a playlist")
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Playlist updated successfully!")
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if(!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID!")
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId)

    if(!deletedPlaylist) {
        throw new ApiError(404, "failed to delete a playlist!")
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "playlist deleted successfully!")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if(!mongoose.isValidObjectId(playlistId) || !mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID!")
    }

    const video = await Video.findById(videoId)
    if(!video) {
        throw new ApiError(400, "Invalid video ID!")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: {
                video: videoId
            }
        },
        {
            new: true
        }
    )

    if(!updatedPlaylist) {
        throw new ApiError(400, "Failed to update a playlist!")
    }

    return res.status(200).json(
        new ApiResponse(200, updatedPlaylist, "Playlist updated successfully!")
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if(!mongoose.isValidObjectId(playlistId) || !mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invald playlistID or videoID!")
    }

    const videoExists = await Video.findById(videoId)
    if(!videoExists) {
        throw new ApiError(404, "Invalid videoId!")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                video: videoId
            }
        },
        {
            new: true
        }
    )

    if(!updatedPlaylist) {
        throw new ApiError(404, "failed to remove a video from playlist!")
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Video removed successfully!")
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params

    if(!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId!")
    }

    const playlistExists = await Playlist.find({ owner: userId })
    if(!playlistExists) {
        throw new ApiError("Playlist not exist!")
    }

    const userPlaylist = await Playlist.aggregate([
        {
            $match: {
                owner: mongoose.Types.ObjectId(userId)
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $match: {
                            isPublished: true
                        }
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        _id: 0,
                                        userName: 1,
                                        fullName: 1,
                                        avatar: 1
                                    }
                                },
                                {
                                    $unwind: "$owner"
                                }
                            ]
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            title: 1,
                            description: 1,
                            thumbnail: 1,
                            videoFile: 1,
                            views: 1,
                            owner: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $sum: "$videos.views"
                }
            }
        },
        {
            $project: {
                _id: 1,
                owner: 1,
                name: 1,
                description: 1,
                totalVideos: 1,
                totalViews: 1,
                videos: 1
            }
        }
    ])

    if(!userPlaylist) {
        throw new ApiError(404, "Failed to fetch playlist!")
    }

    return res.status(200).json(
        new ApiResponse(200, userPlaylist, "Playlist fetched successfully!")
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    
    if(!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlistId!")
    }

    let playlistExists = await Playlist.findById(playlistId)
    if(!playlistExists) {
        throw new ApiError(400, "Playlist not exists!")
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: owner,
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
            $unwind: "$owner"
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    {
                        $match: {
                            isPublished: true
                        }
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        _id: 0,
                                        userName: 1,
                                        fullName: 1,
                                        avatar: 1
                                    }
                                },
                                {
                                    $unwind: "$owner"
                                }
                            ]
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            title: 1,
                            description: 1,
                            thumbnail: 1,
                            videoFile: 1,
                            owner: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                totalVideos: {
                    $size: "$video"
                }
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                owner: 1,
                totalVideos: 1,
                video: 1
            }
        }
    ])

    if(!playlist) {
        throw new ApiError(400, "failed to fetch playlist!")
    }

    return res.status(200).json(
        new ApiResponse(200, playlist[0], "playlist fetch successfully!")
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}