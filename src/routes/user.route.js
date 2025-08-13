import {Router} from 'express'
import { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, updateAccountDetails, getCurrentUser } from '../controllers/user.controller.js'
import { upload } from '../middlewares/multer.middleware.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = Router()

router.route('/register').post(
    upload.fields([
        {
            name: 'avatar',
            maxCount: 1
        },
        {
            name: 'coverImage',
            maxCount: 1
        }
    ]),
    registerUser
    )

router.route('/login').post(loginUser)

// secure routes
router.route('/logout').post(
    verifyJWT, // ensure user is logged in
    logoutUser
)

router.route("/refresh-token").post(
    refreshAccessToken
)

router.route('/change-password').post(
    verifyJWT, // ensure user is logged in
    changeCurrentPassword
)

router.route('/update-profile').patch(
    verifyJWT,
    updateAccountDetails
)

router.route('/get-current-user').get(
    verifyJWT, 
    getCurrentUser
)

export default router