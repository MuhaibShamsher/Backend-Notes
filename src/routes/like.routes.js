import verifyJWT from "../middlewares/auth.middleware.js"
import { Router } from "express"
import {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
} from "../controllers/like.controller.js"


const router = Router()
router.use(verifyJWT)


router.route("/video/:videoID")
    .patch(toggleVideoLike)

router.route("/comment/:commentID")
    .patch(toggleCommentLike)

router.route("/tweet/:tweetID")
    .patch(toggleTweetLike)

router.route("/liked-videos")
    .get(getLikedVideos)


export default router