import verifyJWT from "../middlewares/auth.middleware.js";
import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js"

import { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    getCurrentUser,
    updatePassword,
    updateAvatar,
    updateCoverImage,
    updateEmail
} from "../controllers/user.controller.js"


const router = Router()

router.route('/register').post(
    upload.fields([ // middleware
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route('/login').post(loginUser)

// secured routes
router.route('/logout').post(verifyJWT, logoutUser)
router.route('/accessToken').post(refreshAccessToken)

router.route('/getCurrentUser').get(verifyJWT, getCurrentUser)

router.route('/updatePassword').post(verifyJWT, updatePassword)
router.route('/updateEmail').post(verifyJWT, updateEmail)

router.route('/updateAvatar').post(verifyJWT, upload.single("avatar"), updateAvatar)
router.route('/updateCoverImage').post(verifyJWT, upload.single("coverImage"), updateCoverImage)


export default router;