/**@package showController, multer, path, fs */
import showController from '../controllers/show.controller';
import { verifyToken } from '../middlewares/auth'; // part
import { router, upload } from '../helpers';





/** 
    * @routers starts here N/B upload function defined where the file is stored directory etc 
* */
router
  /**
     * @desc routes 
     * @name SHOWS  
   * */
  /**
     * @desc  add shows record
  **/
  .post('/show', verifyToken, upload.fields([{ name: 'show_url', maxCount: 5 },]), showController.addShow)
  .get('/show', verifyToken, showController.getShowTable)
  .put('/show', verifyToken, showController.updateShow)
  .get('/budget_list', showController.getBudget)
  .get('/crowd_list', showController.getCrowd)
  .delete('/show/:id', verifyToken, showController.deleteShow)
  .post('/show_image', verifyToken, upload.fields([{ name: 'show_url', maxCount: 5 },]), showController.updateShowImage)
  .put('/show_status', verifyToken, showController.updateShowStatus)

export default router;
