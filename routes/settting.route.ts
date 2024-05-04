/**@package settingController, multer, path, fs */
import settingController from '../controllers/setting.controller';
import { router } from '../helpers';
import { verifyToken } from '../middlewares/auth'; // part

/** 
* @routers starts here N/B upload function defined where the file is stored directory etc 
* */

router
  /**
     * @desc routes 
     * @name SETTINGS 
   * */
  .post('/category', verifyToken, settingController.addCategory)
  .get('/category', settingController.getCategoryTable)
  .put('/category', verifyToken, settingController.updateCategory)
  .delete('/category/:id', verifyToken, settingController.deleteCategoryTable)

  .post('/tag', verifyToken, settingController.addTag)
  .get('/tag', verifyToken, settingController.getTagTable)
  .put('/tag', verifyToken, settingController.updateTag)

  .post('/tag_sub', verifyToken, settingController.addSubTag)
  .put('/tag_sub', verifyToken, settingController.updateSubTag)


  .post('/tag_sub_sub', verifyToken, settingController.addSubSubTag)
  .put('/tag_sub_sub', verifyToken, settingController.updateSubSubTag)
  .delete('/tag_sub_sub/:id', verifyToken, settingController.deleteSubTagTable)

export default router;

