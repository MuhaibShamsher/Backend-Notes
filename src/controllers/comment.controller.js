import mongoose from "mongoose"
import ApiError from "../utils/ApiError"
import ApiResponse from "../utils/ApiResponse"
import asyncHandler from "../utils/asyncHandler.js"
import { Comment } from "../models/comment.models.js"
import { Video } from "../models/video.models.js"


// get all comments for a video
const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const page = parseInt(req.query?.page) || 1
    const limit = Math.min(parseInt(req.query?.limit) || 10, 10)

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoID!");
    }

    const videoExists = await Video.findById(videoId)
    if(!videoExists) {
        throw new ApiError(404, "Video not found!");
    }

    const videoCommentsPipeline = [
        {
            $match: {
                video: mongoose.Types.ObjectId(videoId)
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
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes",
                pipeline: [
                    {
                        $project: {
                            likedBy: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                totalLikes: {
                    $size: "$likes"
                }
            }
        },
        {
            $project: {
                _id: 1,
                video: 1,
                content: 1,
                createdAt: 1,
                owner: 1,
                totalLikes: 1
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        }
    ]

    const comments = await Comment.aggregatePaginate(videoCommentsPipeline, { page, limit })

    if (!comments || comments.docs.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, {}, "No comments found for this video!")
        )
    }

    return res.status(200).json(
        new ApiResponse(200, comments.docs, "All comments are fetched successfully!")
    )
})

const addComment = asyncHandler(async (req, res) => {
    const { videoID } = req.params
    const { content } = req.body

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment is required!")
    }

    if (!mongoose.isValidObjectId(videoID)) {
        throw new ApiError(400, "Invalid videoID!")
    }
    
    const commentDetails = await Comment.create({
        content,
        video: videoID,
        owner: req.user?._id
    })

    return res.status(200).json(
        new ApiResponse(200, commentDetails, "Comment added successfully!")
    )
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentID } = req.params
    const { content } = req.body

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment is required!")
    }

    if (!mongoose.isValidObjectId(commentID)) {
        throw new ApiError(400, "Invalid videoID!")
    }

    const commentDetails = await Comment.findByIdAndUpdate(
        commentID,
        {
            $set: {
                content
            }
        },
        {
            new: true
        }
    )

    if (!commentDetails) {
        throw new ApiError(400, "failed to update comment!")
    }

    return res.status(200).json(
        new ApiResponse(200, commentDetails, "Comment added successfully!")
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentID } = req.params

    const deletedComment = await Comment.findByIdAndDelete(commentID)
    if (!deletedComment) {
        throw new ApiError(400, "Failed to delete comment!")
    }

    await Like.deleteMany({ comment: commentID })

    return res.status(200).json(
        new ApiResponse(200, {}, "Comment deleted successfully!")
    )
})


export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}



/*
const comments = await Comment.aggregatePaginate(videoCommentsPipeline, { page, limit })

......................Output of the above query....................
comments = {
  docs: [
    // Array of comment documents after aggregation and pagination
    {
      _id: "commentId1",
      video: "videoId1",
      content: "This is a great video!",
      createdAt: "2025-04-10T12:00:00Z",
      owner: {
        userName: "johnDoe",
        fullName: "John Doe",
        avatar: "https://link-to-avatar.jpg"
      },
      totalLikes: 10
    },
    {
      _id: "commentId2",
      video: "videoId1",
      content: "Amazing content!",
      createdAt: "2025-04-09T12:00:00Z",
      owner: {
        userName: "janeDoe",
        fullName: "Jane Doe",
        avatar: "https://link-to-avatar.jpg"
      },
      totalLikes: 5
    }
  ],
  totalDocs: 50,  // Total number of comments for that video
  limit: 10,      // The number of items per page (as passed in the query)
  totalPages: 5,  // Total number of pages based on limit and totalDocs
  page: 1,        // Current page number
  pagingCounter: 1,
  hasPrevPage: false,
  hasNextPage: true,
  prevPage: null,
  nextPage: 2
}
*/