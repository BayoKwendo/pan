/**@package userController, multer, path, fs */
import userController from '../controllers/user.controller';
import { router, upload } from '../helpers';
import { verifyToken } from '../middlewares/auth'; // part

/** 
* @routers starts here N/B upload function defined where the file is stored directory etc 
* */

router
  /**
     * @desc routes 
     * @name PROFILE 
   * */
  /**
     * @desc  add user record
  **/
  .post('/user', userController.sendUserSignUPOtp)
  .post('/verify_otp_user', userController.addUser)

  .post('/check_user', userController.checkUserExist)

  .post('/resent_otp_user', userController.resentSendUser)
  // /**
  //   * @desc get user data 
  // * */
  .get('/user', verifyToken, userController.getUserTable)

  .post('/user_photo', verifyToken, upload.fields([
    { name: 'profile_url', maxCount: 5 },
    { name: 'cover_url', maxCount: 5 }
  ]), userController.addProfilePhoto)

  // /**
  //   * @desc verify login otp user
  // **/
  .post('/verify_otp', userController.login)
  // /**
  //   * @desc activate deactivate profile
  // **/
  .put('/activate_profile', verifyToken, userController.updateUserStatus)
  /**
    * @desc approve decline profile
  **/
  .put('/update_description', verifyToken, userController.updateProfileDescription)
  /**
     * @desc update tag profile
   **/
  .put('/update_profile_tags', verifyToken, userController.updateProfileTags)
  /**
     * @desc approve decline profile
 **/
  .put('/approve_profile', verifyToken, userController.approveProfile)
  /**
   * @desc verify the otp 
  **/
  .post('/login', userController.otpSend)
  /**
      * @desc update user
  * */
  .put('/user', verifyToken, userController.updateUserTable)

  /**
     * @desc verify the otp 
  * */
  .post('/resent_otp', userController.resentSend)
  /**
    * @desc reset password controller
   */
  .post('/reset_password', userController.passwordReset)

  /**
     * @desc forgot password table
   * */
  .post('/forgot_password', userController.forgotPassword)

  /**
      *  @desc change password table
  * */
  .post('/change_password', verifyToken, userController.changePassword)
  /**
      *  @desc change password table
  * */
  .post('/refresh-token', userController.refreshToken)

export default router;
