import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema(
    {
            title: {
                type: String,
                required: true,
            },
    
            description: {
                type: String,
            },
    
            thumbnail: {
                type: String,
                required: true,
            },

            owner: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            },
    
            videoFile: {
                type: String, //cloudinary url
                required: true,
            },
    
            isPublished: {
                type: Boolean,
                required: true
            },
    
            views: {
                type: Number,
                default: 0
            },
    
            duration: {
                type: Number,
                required: true
            }
        },
        {
            timestamps: true
        }
)

mongoose.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);