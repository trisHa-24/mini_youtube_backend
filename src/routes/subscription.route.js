import { Router } from "express";
import { 
    toggleSubscription, 
    getUserChannelSubscribers,
    getSubscribedChannels 
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
    .route("/chan/:channelId")
    .post(toggleSubscription);

router
    .route("/user/:channelId")
    .get(getUserChannelSubscribers);

router
    .route("/subscribed-to/:subscriberId")
    .get(getSubscribedChannels);


export default router;