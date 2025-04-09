import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js"
import {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
} from "../controllers/playlist.controller.js"


const router = Router()
router.use(verifyJWT)


router.route("/")
    .post(createPlaylist)

router.route("/:playlistID")
    .get(getPlaylistById)
    .patch(updatePlaylist)
    .delete(deletePlaylist)

router.route("/add/:videoID/:playlistID")
    .post(addVideoToPlaylist)

router.route("/remove/:videoID/:playlistID")
    .delete(removeVideoFromPlaylist)

router.route("user/:userID")
    .get(getUserPlaylists)


export default router