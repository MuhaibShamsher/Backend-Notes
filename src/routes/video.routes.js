import verifyJWT from "../middlewares/auth.middleware.js";
import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js"
import { 
    getAllVideos,
    getVideoById,
    publishAVideo,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
from "../controllers/video.controller.js";


const router = Router()


// Apply verifyJWT middleware to all routes in this file
router.use(verifyJWT)


// routes
router.route("/")
    .get(getAllVideos)
    
router.route("/v/publish")
    .post(
        upload.fields([
            { name: "thumbnail", maxCount: 1},
            { name: "videoFile", maxCount: 1},
        ]),
        publishAVideo
    )

router.route("/v/:id")
    .get(getVideoById)
    .delete(deleteVideo)
    .patch(upload.single("thumbnail"), updateVideo)

router.route("/v/publish-toggle/:id")
    .patch(togglePublishStatus)


export default router