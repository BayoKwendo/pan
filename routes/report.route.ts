/**@package eventController, multer, path, fs */
import reportController from '../controllers/report.controller';
import { router } from '../helpers';
import { verifyToken } from '../middlewares/auth'; // part

/** 
* @routers starts here N/B upload function defined where the file is stored directory etc 
* */

router
    /**
        * @desc routes 
        * @name REPORTS 
    * */
    .get('/report', verifyToken, reportController.getReport)

export default router;
