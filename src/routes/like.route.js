import {Router} from "express";
import {
    toggleVideoLike,
    getLikedVideos
} from "../controllers/like.controller.js"
import { verifyJWT } from '../middlewares/auth.middleware.js';


const router = Router();

router.use(verifyJWT);

router.route('/toggle/v/:videoId').post( toggleVideoLike )
router.route("/videos").get(getLikedVideos);

export default router;
