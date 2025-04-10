import verifyJWT from "../middlewares/auth.middleware.js"
import { Router } from "express"
import {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
} from "../controllers/comment.controller.js"


const router = Router()
router.use(verifyJWT)


router.route("/v/:videoID")
    .get(getVideoComments) // The page and limit values are passed as query parameters in the URL.
    .post(addComment)

router.route("/c/:commentID")
    .patch(updateComment)
    .delete(deleteComment)


export default router