/**@package quoteController, multer, path, fs */
import quoteController from '../controllers/quote.controller';
import { verifyToken } from '../middlewares/auth'; // part
import { router } from '../helpers';


router
  /**
     * @desc routes 
     * @name SETTINGS  
   * */
  /**
     * @desc  add category
  **/
  .post('/quote', verifyToken, quoteController.addQuote)
  .get('/quote', verifyToken, quoteController.getQuoteTable)
  .get('/quote_logs', verifyToken, quoteController.getQuoteLogsTable)
  .put('/quote', verifyToken, quoteController.updateQuote)

  .get('/conversation_list', verifyToken, quoteController.getConversationTable)
  

  .post('/scheduler', verifyToken, quoteController.addSchedule)
  .get('/scheduler', verifyToken, quoteController.getScheduleTable)

  .get('/scheduler_new', verifyToken, quoteController.getScheduleTableSample)

  .put('/schedule_status', verifyToken, quoteController.updateSchedulerStatus)
  .delete('/scheduler/:id', verifyToken, quoteController.deleteScheduleTable)

export default router;
