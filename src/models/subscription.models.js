import mongoose from "mongoose";


const subscriptionSchema = new mongoose.Schema(
    {
        channel: {
            type: mongoose.Schema.Types.ObjectId, // the one who owned the channel
            ref: "User"
        },

        subscriber: {
            type: mongoose.Schema.Types.ObjectId, // the one who is subscribing the channel
            ref: "User"
        }
    },
    {
        timestamps: true
    }
)

export const Subscription = mongoose.model("Subscription", subscriptionSchema);