/**@package eventController, multer, path, fs */
import eventController from '../controllers/event.controller';
import { router } from '../helpers';
import { verifyToken } from '../middlewares/auth'; // part

/** 
* @routers starts here N/B upload function defined where the file is stored directory etc 
* */

router
    /**
    * @desc routes 
    * @name EVENTS 
    * */
    /**
    * @desc  add envet record
    **/
    .post('/event', verifyToken, eventController.addEvent)
    .get('/event', verifyToken, eventController.getEventTable)
    .put('/attach_show', verifyToken, eventController.addEventAttachShow)
    .put('/deattach_show', verifyToken, eventController.addEventDettachShow)
    .post('/event_type', verifyToken, eventController.addEventType)
    .get('/event_type', verifyToken, eventController.getEventType)


    .put('/event', verifyToken, eventController.editEvent)
    .put('/event_status', verifyToken, eventController.updateEventStatus)

    .put('/change_status', verifyToken, eventController.eventStatus)

export default router;
