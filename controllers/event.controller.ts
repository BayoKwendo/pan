import { showModal, userModel, showEventModal, eventNameSchema, quotationModal, scheduleModal, subSubTagModal, subTagModal, tagModal, eventTypeModal } from "./../helpers/schema";
import { eventModal, table } from "../helpers/schema"; /**  eventModal, table */
import dotenv from "dotenv";
import logger from "../middlewares/logger";
import { eventStatus, eventStatusFirst, getNextSequenceValue, mHttpRequestTag } from "../helpers"; // generate primary

dotenv.config(); // iniatilized configs here

export default {

  addEventType: async (req: any, res: any) => {
    logger.info(`/POST category`);
    try {
      const body = await req.body;
      let insertData: any;
      const mid = await getNextSequenceValue(`${table.event_type}`)

      if (req.locals.role == "admin") {
        insertData = {
          id: mid,
          type: `${body.type}`,
          name: `${body.name}`
        };
        const vqueue = new eventTypeModal(insertData);
        await vqueue.save().then(async (result: any) => {
          /**
              * * @desc insert ok
          * */
          if (result) {
            res.status(200).send({
              Status: true,
              StatusCode: 0,
              StatusMessage: "הצלחת!"
            });
          } else {
            res.status(400).send({
              Status: false,
              SsatusCode: 2,
              StatusMessage: "Error inserting bidding log"
            });
          }
        }).catch((error) => {
          /**
             * @return
          * */
          res.status(400).send({
            Status: false,
            StatusCode: 2,
            StatusMessage: `${error}`,
          });
        });
      } else {
        res.status(400).send({
          Status: false,
          StatusCode: 2,
          StatusMessage: "Only admin can add category"
        });
      }
    } catch (error) {
      /**
      * @return 
      * catch error is send out here 
      * */
      res.status(400).send({
        Status: false,
        StatusCode: 2,
        StatusMessage: `${error}`
      })
    }
  },
  /**
    * @name GET
    * @name event_type controller
    */
  getEventType: async (req: any, res: any) => {
    logger.info(`/ GET event_type`); ``
    try {
      /** 
          * @desc sql query get all the
          * @name getEventType 
          * @desc fech by either 
          * @name role                  
      * */
      let mrole = req.locals.role;

      let event_type
      if (mrole == "private_customer") {
        event_type = await eventTypeModal.find({ type: "private" })
      }
      else if (mrole == "business_customer") {
        event_type = await eventTypeModal.find({ type: "business" })
      }
      else if (mrole == "institutional_customer") {
        event_type = await eventTypeModal.find({ type: "institution" })
      } else {
        event_type = await eventTypeModal.find({})
      }

      res.status(200).send({
        Status: true,
        StatusCode: 0,
        Name: 'EventType',
        Data: event_type,
        StatusMessage: "הצלחת!"
      });

    } catch (error) {
      /**
          * @return 
          * catch error is send out here 
      * */
      res.status(400).send({
        Status: false,
        StatusCode: 2,
        StatusMessage: `${error}`
      })
    }
  },

  /**
  * @name POST
  * @desc control                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           ler to add   user values in the
  * @name addEvent config table
  * * */
  addEvent: async (req: any, res: any) => {
    logger.info(`/POST event`);
    try {
      const body = await req.body;
      /**
      * @desc variable declaration
      * @name insertEvent
      * @name errorCheck
      * @desc query to insert event values to @name event table
      * @const insertEvent table values
      * */
      let mrole = req.locals.role;
      let mrole_id = req.locals.id;

      let budget = 0
      if (mrole != "admin" || mrole != "artist") {

        let mlebel = body.event_type

        // if (mrole == "business_customer") {
        //   mlebel = "business"
        // }                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
        // if (mrole == "institutional_customer") {
        //   mlebel = "institution"
        // } 

        // let mtag
        if (body.tags) {
          console.log(body.tags)
          // mtag = JSON.parse(body.tags.toString().replaceAll("'", "").replaceAll('"', ''))
        }

        const mid = await getNextSequenceValue(`${table.events}`);
        let mcount = 1
        let eventlebal = await eventNameSchema.find({});
        if (eventlebal && eventlebal.length > 0) {
          mcount = eventlebal[0].event_label + 1
          const insertEvent = {
            id: `${mid}`,
            date: `${body.start_date}`,
            name: `האירוע שלי ${mcount}`,
            profile_id: `${mrole_id}`,
            location: `${body.location}`,
            crowd_amount: `${body.crowd_amount}`,
            budget: `${body.budget}`,
            event_type: `${mlebel}`,
            active_status: 'active',
            tags: body.tags,
            artist_type: `${body.artist_type}`,
          };

          const vqueue = new eventModal(insertEvent);
          await eventNameSchema.updateOne({ event_label: `${eventlebal[0].event_label}` }, { event_label: mcount }, { new: true });
          await vqueue
            .save()
            .then(async (result: any) => {
              res.status(200).send({
                Status: true,
                StatusCode: 0,
                StatusMessage: "הצלחת!",
                Data: insertEvent,
              });
            }).catch((error) => {
              res.status(403).send({
                Status: false,
                StatusCode: 2,
                StatusMessage: `${error}`,
              });
            });
        } else {
          const insertData = { event_label: `${mcount}` };
          const mqueue = new eventNameSchema(insertData);

          const insertEvent = {
            id: `${mid}`,
            date: `${body.start_date}`,
            name: `האירוע שלי ${mcount}`,
            profile_id: `${mrole_id}`,
            location: `${body.location}`,
            crowd_amount: `${body.crowd_amount}`,
            budget: `${body.budget}`,
            artist_type: `${body.artist_type}`,
          };
          const vqueue = new eventModal(insertEvent);
          await mqueue.save().then(async (result: any) => {
            await vqueue
              .save()
              .then(async (result: any) => {
                res.status(200).send({
                  Status: true,
                  StatusCode: 0,
                  StatusMessage: "הצלחת!",
                  Data: insertEvent,
                });
              })
              .catch((error) => {
                res.status(403).send({
                  Status: false,
                  StatusCode: 2,
                  StatusMessage: `${error}`,
                });
              });
          })
        }
      } else {
        res.status(400).send({
          Status: false,
          StatusCode: 1,
          StatusMessage: "Unauthorized",
        });
      }
    } catch (error) {
      /**
      * @return
      * catch error is send out here
      * */
      res.status(400).send({
        Status: false,
        StatusCode: 2,
        StatusMessage: `${error}`,
      });
    }
  },

  /**
  * @name POST
  * @desc controller to add   user values in the
  * @name addEvent config table
  * * */
  addEventAttachShow: async (req: any, res: any) => {
    logger.info(`/POST event`);

    try {
      const body = await req.body;
      /**
      * @desc variable declaration
      * @name insertEvent
      * @name errorCheck
      * @desc query to insert event values to @name event table
      * @const insertEvent table values
      * */
      let mrole = req.locals.role;

      let mrole_id = req.locals.id;
      let mshowsLength;
      let event_id = body.event_id;
      let show_id = body.show_id;

      await showEventModal
        .find({ show_id: show_id, event_id: event_id })
        .then(async (result: any) => {
          if (result.length == 0) {
            await eventModal
              .find({ id: event_id })
              .then(async (result: any) => {
                if (result.length > 0) {
                  await showModal.find({ id: show_id })
                    .then(async (result: any) => {
                      if (result.length > 0) {
                        const insertEventIDs = {
                          show_id: `${show_id}`,
                          event_id: `${event_id}`
                        };
                        const vqueue = new showEventModal(insertEventIDs);
                        await vqueue.save().then(async (result: any) => {
                          res.status(200).send({
                            Status: true,
                            StatusCode: 0,
                            StatusMessage: "הצלחת!"
                          });
                        }).catch((error) => {
                          res.status(403).send({
                            Status: false,
                            StatusCode: 2,
                            StatusMessage: `${error}`,
                          });
                        });; 8
                      }
                      else {
                        res.status(400).send({
                          Status: false,
                          StatusCode: 1,
                          StatusMessage: "Show not found",
                        });
                      }
                    })
                } else {
                  res.status(400).send({
                    Status: false,
                    StatusCode: 1,
                    StatusMessage: "Event not found",
                  });
                }
              });
          }
          else {
            res.status(400).send({
              Status: false,
              StatusCode: 1,
              StatusMessage: "record exist",
            });
          }
        })
    } catch (error) {
      /**
      * @return
      * catch error is send out here
      * */
      res.status(400).send({
        Status: false,
        StatusCode: 2,
        StatusMessage: `${error}`,
      });
    }
  },
  /**
  * @name POST
  * @desc controller to add   user values in the
  * @name addEvent config table
  * * */
  addEventDettachShow: async (req: any, res: any) => {
    logger.info(`/POST de attach show`);

    try {
      const body = await req.body;
      /**
      * @desc variable declaration
      * @name insertEvent
      * @name errorCheck
      * @desc query to insert event values to @name event table
      * @const insertEvent table values
      * */
      let mrole = req.locals.role;

      let event_id = body.event_id;
      let show_id = body.show_id;

      await showEventModal
        .find({ show_id: show_id, event_id: event_id })
        .then(async (result: any) => {
          if (result.length == 1) {
            await quotationModal
              .find({ event_id: event_id })
              .then(async (result: any) => {
                if (result.length == 0) {

                  await showEventModal.deleteOne({ show_id: show_id, event_id: event_id })
                    .then(async (result: any) => {
                      res.status(200).send({
                        Status: true,
                        StatusCode: 0,
                        StatusMessage: "הצלחת!"
                      });
                    }).catch((error) => {
                      res.status(403).send({
                        Status: false,
                        StatusCode: 2,
                        StatusMessage: `${error}`,
                      });
                    })
                } else {
                  res.status(400).send({
                    Status: false,
                    StatusCode: 1,
                    StatusMessage: "This event has a quotation",
                  });
                }
              });
          }
          else {
            res.status(400).send({
              Status: false,
              StatusCode: 1,
              StatusMessage: "Record not existing",
            });
          }
        })
    } catch (error) {
      /**
      * @return
      * catch error is send out here
      * */
      res.status(400).send({
        Status: false,
        StatusCode: 2,
        StatusMessage: `${error}`,
      });
    }
  },
  /**
  * @desc get Event
  * @function getEventTable
  * */

  getEventTable: async (req: any, res: any) => {
    logger.info(`/GET event`);
    try {
      const body = await req.body;
      /**
      * @desc sql query get all the @name getEventTable
      * @desc fech by either @name status,active_status and @name id
      * */
      let id = req.query.id;

      let status = await eventStatusFirst(req.query.status)

      // let role = req.query.role;

      let mdate = req.query.date;

      let active_status = req.query.active_status;
      let getEventTable;
      // let budget = req.query.budget;
      let budget = req.query.budget;
      // let max_budget = req.query.max_budget;

      let location = req.query.location;
      let start_date = req.query.start_date;
      let end_date = req.query.end_date;
      let crowd_amount = req.query.crowd_amount;

      // let max_crowd_amount = req.query.max_crowd_amount;

      let artist_category = req.query.artist_category;
      let gender = req.query.gender;
      const filters = {
        created_on: {
          $gte: `${start_date}`,
          $lte: `${end_date}`,
        },
      };
      const columns = {
        id: 1,
        profile_id: 1,
        date: 1,
        time: 1,
        location: 1,
        crowd_amount: 1,
        min_crowd_amount: 1,
        max_crowd_amount: 1,
        budget: 1,
        min_budget: 1,
        tags: 1,
        max_budget: 1,
        name: 1,
        artist_type: 1,
        event_type: 1,
        age_restriction: 1,
        note: 1,
        shows: 1,
        status: 1,
        active_status: 1,
        created_on: 1,
        last_updated_on: 1,
      };
      if (req.locals.role == "artist") {

        let profile_id = req.locals.id;

        const mdcolumns = {
          _id: 0,
          id: 1,
        };
        const mcolumns = {
          _id: 0,
          event_id: 1,
        };

        let getShowTable = await showModal.find(
          { profile_id: `${profile_id}` },
          mdcolumns
        ).distinct("id");


        let showTable = await showEventModal.find({ show_id: { $in: getShowTable } }, mcolumns).distinct("event_id");

        // showTable = await showModal.find({ id: { $in: mshowsevents } });

        if (id) {
          getEventTable = await eventModal.find(
            { id: `${id}` },
            columns
          );
        }
        else if (status &&
          !active_status &&
          !budget &&
          !location &&
          !crowd_amount &&
          !start_date &&
          !end_date) {
          getEventTable = await eventModal.find(
            { id: { $in: showTable }, status: `${status}` },
            columns
          );
        }
        // fitler by budget
        else if (
          !active_status &&
          !status &&
          budget &&
          !location &&
          !crowd_amount &&
          !start_date &&
          !end_date
        ) {
          getEventTable = await eventModal.find(
            { id: { $in: showTable }, budget: budget },
            columns
          );
        }
        // fitler location
        else if (
          !active_status &&
          !status &&
          !budget &&
          location &&
          !crowd_amount &&
          !start_date &&
          !end_date) {
          getEventTable = await eventModal.find(
            { id: { $in: showTable }, location: `${location}` },
            columns
          );
        }
        //filter crowd amount
        else if (
          !active_status &&
          !status &&
          !budget &&
          !location &&
          crowd_amount &&
          !start_date &&
          !end_date) {
          getEventTable = await eventModal.find(
            {
              id: { $in: showTable },
              crowd_amount: `${crowd_amount}`,
            },
            columns
          );
        }
        // filter budget and location
        else if (
          !active_status &&
          !status &&
          budget &&
          location &&
          !crowd_amount &&
          !start_date &&
          !end_date
        ) {
          getEventTable = await eventModal.find(
            {
              id: { $in: showTable },
              budget: `${budget}`,
              location: `${location}`,
            },
            columns
          );
        }
        // filter budget and crowd amount
        else if (
          !active_status &&
          !status &&
          budget &&
          !location &&
          crowd_amount &&
          !start_date &&
          !end_date
        ) {
          getEventTable = await eventModal.find(
            {
              id: { $in: showTable },
              budget: `${budget}`,
              crowd_amount: `${crowd_amount}`,
            },
            columns
          );
        }
        // filter by location and crowd amount
        else if (
          !active_status &&
          !status &&
          !budget &&
          location &&
          crowd_amount &&
          !start_date &&
          !end_date
        ) {
          getEventTable = await eventModal.find(
            {
              id: { $in: showTable },
              location: `${location}`,
              crowd_amount: `${crowd_amount}`,
            },
            columns
          );
        }
        //filter by budget location and crowd amount
        else if (
          !active_status &&
          !status &&
          budget &&
          location &&
          crowd_amount &&
          !start_date &&
          !end_date
        ) {
          getEventTable = await eventModal.find(
            {
              id: { $in: showTable },
              budget: `${budget}`,
              location: `${location}`,
              crowd_amount: `${crowd_amount}`,
            },
            columns
          );
        } else if (
          /**@desc filter with date */
          !active_status &&
          !status &&
          !budget &&
          !location &&
          !crowd_amount &&
          start_date &&
          end_date
        ) {
          getEventTable = await eventModal
            .find({ id: { $in: showTable } }, columns)
            .where(filters);
        } else if (
          active_status &&
          status &&
          budget &&
          location &&
          crowd_amount &&
          start_date &&
          end_date
        ) {
          getEventTable = await eventModal
            .find(
              {
                id: { $in: showTable },
                active_status: `${active_status}`,
                status: `${status}`,
                budget: `${budget}`,
                location: `${location}`,
                crowd_amount: `${crowd_amount}`,

              },
              columns
            )
            .where(filters);
        } else if (
          !active_status &&
          !status &&
          !budget &&
          location &&
          crowd_amount &&
          start_date &&
          end_date
        ) {
          getEventTable = await eventModal
            .find(
              {
                id: { $in: showTable },
                location: `${location}`,
                crowd_amount: `${crowd_amount}`,

              },
              columns
            )
            .where(filters);
        } else if (
          !active_status &&
          !status &&
          budget &&
          !location &&
          crowd_amount &&
          start_date &&
          end_date
        ) {

          getEventTable = await eventModal
            .find(
              {
                id: { $in: showTable },
                budget: `${budget}`,
                crowd_amount: `${crowd_amount}`,
              },
              columns
            )
            .where(filters);
        } else if (
          !active_status &&
          !status &&
          budget &&
          location &&
          !crowd_amount &&
          start_date &&
          end_date
        ) {

          getEventTable = await eventModal
            .find(
              {
                id: { $in: showTable },
                budget: `${budget}`,
                location: `${location}`,
              },
              columns
            )
            .where(filters);
        } else if (
          active_status &&
          !status &&
          budget &&
          location &&
          crowd_amount &&
          start_date &&
          end_date
        ) {

          getEventTable = await eventModal
            .find(
              {
                id: { $in: showTable },
                active_status: `${active_status}`,
                budget: `${budget}`,
                location: `${location}`,
                crowd_amount: `${crowd_amount}`,

              }, columns).where(filters);
        } else if (
          !active_status &&
          status &&
          budget &&
          location &&
          crowd_amount &&
          start_date &&
          end_date
        ) {

          getEventTable = await eventModal
            .find(
              {
                id: { $in: showTable },
                status: `${status}`,
                budget: `${budget}`,
                location: `${location}`,
                crowd_amount: `${crowd_amount}`,

              },
              columns
            )
            .where(filters);
        } else if (
          active_status &&
          status &&
          budget &&
          location &&
          !crowd_amount &&
          start_date &&
          end_date
        ) {

          getEventTable = await eventModal
            .find(
              {
                id: { $in: showTable },
                active_status: `${active_status}`,
                status: `${status}`,
                budget: `${budget}`,
                location: `${location}`,
              },
              columns
            )
            .where(filters);
        } else if (
          active_status &&
          status &&
          budget &&
          !location &&
          !crowd_amount &&
          start_date &&
          end_date
        ) {
          getEventTable = await eventModal
            .find(
              {
                id: { $in: showTable },
                active_status: `${active_status}`,
                status: `${status}`,
                budget: `${budget}`,
              },
              columns
            )
            .where(filters);
        } else if (
          active_status &&
          status &&
          !budget &&
          location &&
          !crowd_amount &&
          start_date &&
          end_date
        ) {

          getEventTable = await eventModal
            .find(
              {
                id: { $in: showTable },
                active_status: `${active_status}`,
                status: `${status}`,
                location: `${location}`,
              },
              columns
            )
            .where(filters);
        }
        /**@desc end for filter date */
        //filter by active status
        else if (
          active_status &&
          !status &&
          !budget &&
          !location &&
          !crowd_amount &&
          !start_date &&
          !end_date
        ) {
          getEventTable = await eventModal.find(
            { id: { $in: showTable }, active_status: `${active_status}` },
            columns
          );
        }
        //filter active_status and status
        else if (
          active_status &&
          status &&
          !budget &&
          !location &&
          !crowd_amount &&
          !start_date &&
          !end_date
        ) {
          getEventTable = await eventModal.find(
            {
              id: { $in: showTable },
              active_status: `${active_status}`,
              status: `${status}`,
            },
            columns
          );
        } else {
          getEventTable = await eventModal.find(
            { id: { $in: showTable } },
            columns
          );
        }
      }
      else if (req.locals.role != "admin") {
        let profile_id = req.locals.id;

        if (profile_id && id) {

          getEventTable = await eventModal.find(
            { profile_id: `${profile_id}`, id: `${id}` },
            columns
          );
        }
        // filter event status
        else if (
          status &&
          !active_status &&
          !budget &&
          !location &&
          !crowd_amount &&
          !start_date &&
          !end_date
        ) {


          getEventTable = await eventModal.find(
            { profile_id: `${profile_id}`, status: `${status}` },
            columns
          );
        }
        // fitler by budget
        else if (
          !active_status &&
          !status &&
          budget &&
          !location &&
          !crowd_amount &&
          !start_date &&
          !end_date
        ) {
          getEventTable = await eventModal.find(
            { profile_id: `${profile_id}`, budget: `${budget}`, },
            columns
          );
        }
        // fitler location
        else if (
          !active_status &&
          !status &&
          !budget &&
          location &&
          !crowd_amount &&
          !start_date &&
          !end_date) {
          getEventTable = await eventModal.find(
            { profile_id: `${profile_id}`, location: `${location}` },
            columns
          );
        }
        //filter crowd amount
        else if (
          !active_status &&
          !status &&
          !budget &&
          !location &&
          crowd_amount &&
          !start_date &&
          !end_date
        ) {

          getEventTable = await eventModal.find(
            {
              profile_id: `${profile_id}`,
              crowd_amount: `${crowd_amount}`
            },
            columns
          );
        }
        // filter budget and location
        else if (
          !active_status &&
          !status &&
          budget &&
          location &&
          !crowd_amount &&
          !start_date &&
          !end_date
        ) {
          getEventTable = await eventModal.find(
            {
              profile_id: `${profile_id}`,
              budget: `${budget}`,
              location: `${location}`,
            },
            columns
          );
        }
        // filter budget and crowd amount
        else if (
          !active_status &&
          !status &&
          budget &&
          !location &&
          crowd_amount &&
          !start_date &&
          !end_date
        ) {
          getEventTable = await eventModal.find(
            {
              profile_id: `${profile_id}`,
              budget: `${budget}`,
              crowd_amount: `${crowd_amount}`,
            },
            columns
          );
        }
        // filter by location and crowd amount
        else if (
          !active_status &&
          !status &&
          !budget &&
          location &&
          crowd_amount &&
          !start_date &&
          !end_date
        ) {
          getEventTable = await eventModal.find(
            {
              profile_id: `${profile_id}`,
              location: `${location}`,
              crowd_amount: `${crowd_amount}`,
            },
            columns
          );
        }
        //filter by budget location and crowd amount
        else if (
          !active_status &&
          !status &&
          budget &&
          location &&
          crowd_amount &&
          !start_date &&
          !end_date
        ) {

          getEventTable = await eventModal.find(
            {
              profile_id: `${profile_id}`,
              budget: `${budget}`,
              location: `${location}`,
              crowd_amount: `${crowd_amount}`,
            },
            columns
          );
        } else if (
          /**@desc filter with date */
          !active_status &&
          !status &&
          !budget &&
          !location &&
          !crowd_amount &&
          start_date &&
          end_date
        ) {

          getEventTable = await eventModal
            .find({ profile_id: `${profile_id}` }, columns)
            .where(filters);
        }
        else if (
          active_status &&
          status &&
          budget &&
          location &&
          crowd_amount &&
          start_date &&
          end_date) {
          getEventTable = await eventModal
            .find(
              {
                profile_id: `${profile_id}`,
                active_status: `${active_status}`,
                status: `${status}`,
                budget: `${budget}`,
                location: `${location}`,
                crowd_amount: `${crowd_amount}`,

              },
              columns
            )
            .where(filters);
        } else if (
          !active_status &&
          !status &&
          !budget &&
          location &&
          crowd_amount &&
          start_date &&
          end_date
        ) {
          getEventTable = await eventModal
            .find(
              {
                profile_id: `${profile_id}`,
                location: `${location}`,
                crowd_amount: `${crowd_amount}`,

              },
              columns
            )
            .where(filters);
        } else if (
          !active_status &&
          !status &&
          budget &&
          !location &&
          crowd_amount &&
          start_date &&
          end_date
        ) {

          getEventTable = await eventModal
            .find(
              {
                profile_id: `${profile_id}`,
                budget: `${budget}`,
                crowd_amount: `${crowd_amount}`
              },
              columns
            )
            .where(filters);
        } else if (
          !active_status &&
          !status &&
          budget &&
          location &&
          !crowd_amount &&
          start_date &&
          end_date
        ) {

          getEventTable = await eventModal
            .find(
              {
                profile_id: `${profile_id}`,
                budget: `${budget}`,
                location: `${location}`,
              },
              columns
            )
            .where(filters);
        } else if (
          active_status &&
          !status &&
          budget &&
          location &&
          crowd_amount &&
          start_date &&
          end_date
        ) {

          getEventTable = await eventModal
            .find(
              {
                profile_id: `${profile_id}`,
                active_status: `${active_status}`,
                budget: `${budget}`,
                location: `${location}`,
                crowd_amount: `${crowd_amount}`,

              }, columns).where(filters);
        } else if (
          !active_status &&
          status &&
          budget &&
          location &&
          crowd_amount &&
          start_date &&
          end_date
        ) {

          getEventTable = await eventModal
            .find(
              {
                profile_id: `${profile_id}`,
                status: `${status}`,
                budget: `${budget}`,
                location: `${location}`,
                crowd_amount: `${crowd_amount}`,

              },
              columns
            )
            .where(filters);
        } else if (
          active_status &&
          status &&
          budget
          && location &&
          !crowd_amount &&
          start_date &&
          end_date
        ) {
          getEventTable = await eventModal
            .find(
              {
                profile_id: `${profile_id}`,
                active_status: `${active_status}`,
                status: `${status}`,
                budget: `${budget}`,
                location: `${location}`,
              },
              columns
            )
            .where(filters);
        } else if (
          active_status &&
          status &&
          budget &&
          !location &&
          !crowd_amount &&
          start_date &&
          end_date
        ) {

          getEventTable = await eventModal
            .find(
              {
                profile_id: `${profile_id}`,
                active_status: `${active_status}`,
                status: `${status}`,
                budget: `${budget}`,
              },
              columns
            )
            .where(filters);
        } else if (
          active_status &&
          status &&
          !budget &&
          location &&
          !crowd_amount &&
          start_date &&
          end_date
        ) {

          getEventTable = await eventModal
            .find(
              {
                profile_id: `${profile_id}`,
                active_status: `${active_status}`,
                status: `${status}`,
                location: `${location}`,
              },
              columns
            )
            .where(filters);
        }
        /**@desc end for filter date */
        //filter by active status
        else if (
          active_status &&
          !status &&
          !budget &&
          !location &&
          !crowd_amount &&
          !start_date &&
          !end_date
        ) {


          getEventTable = await eventModal.find(
            { profile_id: `${profile_id}`, active_status: `${active_status}` },
            columns
          );
        }
        //filter active_status and status
        else if (
          active_status &&
          status &&
          !budget &&
          !location &&
          !crowd_amount &&
          !start_date &&
          !end_date
        ) {
          getEventTable = await eventModal.find(
            {
              profile_id: `${profile_id}`,
              active_status: `${active_status}`,
              status: `${status}`,
            },
            columns
          );
        } else {


          getEventTable = await eventModal.find(
            { profile_id: `${profile_id}` },
            columns
          );
        }
      } else {
        let profile_id = req.query.profile_id;

        if (id) {
          getEventTable = await eventModal.find({ id: `${id}` }, columns);
        } else if (!profile_id) {
          // filter event status
          if (
            status &&
            !active_status &&
            !budget &&
            !location &&
            !crowd_amount &&
            !start_date &&
            !end_date
          ) {
            getEventTable = await eventModal.find(
              { status: `${status}` },
              columns
            );
          }
          // fitler by budget
          else if (
            !active_status &&
            !status &&
            budget &&
            !location &&
            !crowd_amount &&
            !start_date &&
            !end_date
          ) {
            getEventTable = await eventModal.find(
              {
                budget: `${budget}`
              },
              columns
            );
          }
          // fitler location
          else if (
            !active_status &&
            !status &&
            !budget &&
            location &&
            !crowd_amount &&
            !start_date &&
            !end_date
          ) {
            getEventTable = await eventModal.find(
              { location: `${location}` },
              columns
            );
          }
          //filter crowd amount
          else if (
            !active_status &&
            !status &&
            !budget &&
            !location &&
            crowd_amount &&
            !start_date &&
            !end_date
          ) {
            getEventTable = await eventModal.find(
              {
                crowd_amount: `${crowd_amount}`,

              },
              columns
            );
          }
          // filter budget and location
          else if (
            !active_status &&
            !status &&
            budget &&

            location &&
            !crowd_amount &&
            !start_date &&
            !end_date
          ) {
            getEventTable = await eventModal.find(
              {
                budget: `${budget}`,
                location: `${location}`
              },
              columns
            );
          }
          // filter budget and crowd amount
          else if (
            !active_status &&
            !status &&
            budget &&
            !location &&
            crowd_amount &&
            !start_date &&
            !end_date
          ) {
            getEventTable = await eventModal.find(
              {
                budget: `${budget}`, crowd_amount: `${crowd_amount}`
              },
              columns
            );
          }
          // filter by location and crowd amount
          else if (
            !active_status &&
            !status &&
            !budget &&
            location &&
            crowd_amount &&
            !start_date &&
            !end_date
          ) {
            getEventTable = await eventModal.find(
              {
                location: `${location}`, crowd_amount: `${crowd_amount}`
              },
              columns
            );
          }
          //filter by budget location and crowd amount
          else if (
            !active_status &&
            !status &&
            budget &&
            location &&
            crowd_amount &&
            !start_date &&
            !end_date
          ) {

            getEventTable = await eventModal.find(
              {
                budget: `${budget}`,
                location: `${location}`,
                crowd_amount: `${crowd_amount}`,

              },
              columns
            );
          } else if (
            /**@desc filter with date */
            !active_status &&
            !status &&
            !budget &&
            !location &&
            !crowd_amount &&
            start_date &&
            end_date
          ) {

            getEventTable = await eventModal.find({}, columns).where(filters);
          } else if (
            active_status &&
            status &&
            budget &&
            location &&
            crowd_amount &&
            start_date &&
            end_date
          ) {

            getEventTable = await eventModal
              .find(
                {
                  active_status: `${active_status}`,
                  status: `${status}`,
                  budget: `${budget}`,
                  location: `${location}`,
                  crowd_amount: `${crowd_amount}`,

                },
                columns
              )
              .where(filters);
          } else if (
            !active_status &&
            !status &&
            !budget &&
            location &&
            crowd_amount &&
            start_date &&
            end_date
          ) {
            getEventTable = await eventModal
              .find(
                {
                  location: `${location}`, crowd_amount: `${crowd_amount}`
                },
                columns
              )
              .where(filters);
          } else if (
            !active_status &&
            !status &&
            budget &&
            !location &&
            crowd_amount &&
            start_date &&
            end_date
          ) {
            getEventTable = await eventModal
              .find(
                {
                  budget: `${budget}`, crowd_amount: `${crowd_amount}`
                },
                columns
              )
              .where(filters);
          } else if (
            !active_status &&
            !status &&
            budget &&
            location &&
            !crowd_amount &&
            start_date &&
            end_date
          ) {

            getEventTable = await eventModal
              .find({
                budget: `${budget}`, location: `${location}`
              }, columns)
              .where(filters);
          } else if (
            active_status &&
            !status &&
            budget &&
            location &&
            crowd_amount &&
            start_date &&
            end_date
          ) {

            getEventTable = await eventModal
              .find(
                {
                  active_status: `${active_status}`,
                  budget: `${budget}`,
                  location: `${location}`,
                  crowd_amount: `${crowd_amount}`,

                },
                columns
              )
              .where(filters);
          } else if (
            !active_status &&
            status &&
            budget &&
            location &&
            crowd_amount &&
            start_date &&
            end_date
          ) {
            getEventTable = await eventModal
              .find(
                {
                  status: `${status}`,
                  budget: `${budget}`,
                  location: `${location}`,
                  crowd_amount: `${crowd_amount}`,

                },
                columns
              )
              .where(filters);
          } else if (
            active_status &&
            status &&
            budget &&
            location &&
            !crowd_amount &&
            start_date &&
            end_date
          ) {

            getEventTable = await eventModal
              .find(
                {
                  active_status: `${active_status}`,
                  status: `${status}`,
                  budget: `${budget}`,
                  location: `${location}`,
                },
                columns
              )
              .where(filters);
          } else if (
            active_status &&
            status &&
            budget &&
            !location &&
            !crowd_amount &&
            start_date &&
            end_date
          ) {
            // 
            getEventTable = await eventModal
              .find(
                {
                  active_status: `${active_status}`,
                  status: `${status}`,
                  budget: `${budget}`,
                },
                columns
              )
              .where(filters);
          } else if (
            active_status &&
            status &&
            !budget && location &&
            !crowd_amount &&
            start_date &&
            end_date
          ) {

            getEventTable = await eventModal
              .find(
                {
                  active_status: `${active_status}`,
                  status: `${status}`,

                  location: `${location}`,
                },
                columns
              )
              .where(filters);
          }

          /**@desc end for filter date */
          //filter by active status
          else if (
            active_status &&
            !status &&
            !budget && !location &&
            !crowd_amount &&
            !start_date &&
            !end_date
          ) {
            getEventTable = await eventModal.find(
              { active_status: `${active_status}` },
              columns
            );
          }
          //filter active_status and status
          else if (
            active_status &&
            status &&
            !budget && !location &&
            !crowd_amount &&
            !start_date &&
            !end_date
          ) {
            getEventTable = await eventModal.find(
              { active_status: `${active_status}`, status: `${status}` },
              columns
            );
          } else {
            // filter all
            getEventTable = await eventModal.find({}, columns);
          }
        } else {
          // filter event status
          if (
            status &&
            !active_status &&
            !budget && !location &&
            !crowd_amount &&
            !start_date &&
            !end_date
          ) {
            getEventTable = await eventModal.find(
              { profile_id: `${profile_id}`, status: `${status}` },
              columns
            );
          }
          // fitler by budget
          else if (
            !active_status &&
            !status &&
            budget &&
            !location &&
            !crowd_amount &&
            !start_date &&
            !end_date
          ) {
            getEventTable = await eventModal.find(
              {
                profile_id: `${profile_id}`,
                budget: `${budget}`
              },
              columns
            );
          }
          // fitler location
          else if (
            !active_status &&
            !status &&
            !budget &&
            location &&
            !crowd_amount &&
            !start_date &&
            !end_date
          ) {
            getEventTable = await eventModal.find(
              { profile_id: `${profile_id}`, location: `${location}` },
              columns
            );
          }
          //filter crowd amount
          else if (
            !active_status &&
            !status &&
            !budget &&
            !location &&
            crowd_amount &&
            !start_date &&
            !end_date
          ) {
            getEventTable = await eventModal.find(
              {
                profile_id: `${profile_id}`, crowd_amount: `${crowd_amount}`
              },
              columns
            );
          }
          // filter budget and location
          else if (
            !active_status &&
            !status &&
            budget &&
            location &&
            !crowd_amount &&
            !start_date &&
            !end_date
          ) {
            getEventTable = await eventModal.find(
              {
                profile_id: `${profile_id}`,
                budget: `${budget}`,
                location: `${location}`,
              },
              columns
            );
          }
          // filter budget and crowd amount
          else if (
            !active_status &&
            !status &&
            budget &&
            !location &&
            crowd_amount &&
            !start_date &&
            !end_date
          ) {
            getEventTable = await eventModal.find(
              {
                profile_id: `${profile_id}`,
                budget: `${budget}`,
                crowd_amount: `${crowd_amount}`,

              },
              columns
            );
          }
          // filter by location and crowd amount
          else if (
            !active_status &&
            !status &&
            !budget &&
            location &&
            crowd_amount &&
            !start_date &&
            !end_date
          ) {
            getEventTable = await eventModal.find(
              {
                profile_id: `${profile_id}`,
                location: `${location}`,
                crowd_amount: `${crowd_amount}`
              },
              columns
            );
          }
          //filter by budget location and crowd amount
          else if (
            !active_status &&
            !status &&
            budget &&
            location &&
            crowd_amount &&
            !start_date &&
            !end_date
          ) {
            getEventTable = await eventModal.find(
              {
                profile_id: `${profile_id}`,
                budget: `${budget}`,
                location: `${location}`,
                crowd_amount: `${crowd_amount}`,

              },
              columns
            );
          } else if (
            /**
            * @desc
            * filter with date
            *  */
            !active_status &&
            !status &&
            !budget &&
            !location &&
            !crowd_amount &&
            start_date &&
            end_date
          ) {

            getEventTable = await eventModal
              .find({ profile_id: `${profile_id}` }, columns)
              .where(filters);
          } else if (
            active_status &&
            status &&
            budget &&
            location &&
            crowd_amount &&
            start_date &&
            end_date
          ) {

            getEventTable = await eventModal
              .find(
                {
                  profile_id: `${profile_id}`,
                  active_status: `${active_status}`,
                  status: `${status}`,
                  budget: `${budget}`,
                  location: `${location}`,
                  crowd_amount: `${crowd_amount}`,

                },
                columns
              )
              .where(filters);
          } else if (
            !active_status &&
            !status &&
            !budget &&
            location &&
            crowd_amount &&
            start_date &&
            end_date
          ) {
            getEventTable = await eventModal
              .find(
                {
                  profile_id: `${profile_id}`,
                  location: `${location}`,
                  crowd_amount: `${crowd_amount}`,

                },
                columns
              )
              .where(filters);
          } else if (
            !active_status &&
            !status &&
            budget && !location &&
            crowd_amount &&
            start_date &&
            end_date
          ) {

            getEventTable = await eventModal
              .find(
                {
                  profile_id: `${profile_id}`,
                  budget: `${budget}`,
                  crowd_amount: `${crowd_amount}`,

                },
                columns
              )
              .where(filters);
          } else if (
            !active_status &&
            !status &&
            budget
            && location &&
            !crowd_amount &&
            start_date &&
            end_date
          ) {

            getEventTable = await eventModal
              .find(
                {
                  profile_id: `${profile_id}`,
                  budget: `${budget}`,
                  location: `${location}`,
                },
                columns
              )
              .where(filters);
          } else if (
            active_status &&
            !status &&
            budget &&
            location &&
            crowd_amount &&
            start_date &&
            end_date
          ) {
            getEventTable = await eventModal
              .find(
                {
                  profile_id: `${profile_id}`,
                  active_status: `${active_status}`,
                  budget: `${budget}`,
                  location: `${location}`,
                  crowd_amount: `${crowd_amount}`,

                },
                columns
              )
              .where(filters);
          } else if (
            !active_status &&
            status &&
            budget &&
            location &&
            crowd_amount &&
            start_date &&
            end_date
          ) {

            getEventTable = await eventModal
              .find(
                {
                  profile_id: `${profile_id}`,
                  status: `${status}`,
                  budget: `${budget}`,
                  location: `${location}`,
                  crowd_amount: `${crowd_amount}`,

                },
                columns
              )
              .where(filters);
          } else if (
            active_status &&
            status &&
            budget &&
            location &&
            !crowd_amount &&
            start_date &&
            end_date
          ) {
            getEventTable = await eventModal
              .find(
                {
                  profile_id: `${profile_id}`,
                  active_status: `${active_status}`,
                  status: `${status}`,
                  budget: `${budget}`,
                  location: `${location}`,
                },
                columns
              )
              .where(filters);
          } else if (
            active_status &&
            status &&
            budget &&
            !location &&
            !crowd_amount &&
            start_date &&
            end_date
          ) {
            getEventTable = await eventModal
              .find(
                {
                  profile_id: `${profile_id}`,
                  active_status: `${active_status}`,
                  status: `${status}`,
                  budget: `${budget}`,
                },
                columns
              )
              .where(filters);
          } else if (
            active_status &&
            status &&
            !budget &&
            location &&
            !crowd_amount &&
            start_date &&
            end_date
          ) {
            getEventTable = await eventModal
              .find(
                {
                  profile_id: `${profile_id}`,
                  active_status: `${active_status}`,
                  status: `${status}`,
                  location: `${location}`,
                },
                columns
              )
              .where(filters);
          }
          /**
          * @desc end for filter date
          * */
          //filter by active status
          else if (
            active_status &&
            !status &&
            !budget &&
            !location &&
            !crowd_amount &&
            !start_date &&
            !end_date
          ) {
            getEventTable = await eventModal.find(
              {
                profile_id: `${profile_id}`,
                active_status: `${active_status}`,
              },
              columns
            );
          }
          //filter active_status and status
          else if (
            active_status &&
            status &&
            !budget &&
            !location &&
            !crowd_amount &&
            !start_date &&
            !end_date
          ) {
            getEventTable = await eventModal.find(
              {
                profile_id: `${profile_id}`,
                active_status: `${active_status}`,
                status: `${status}`,
              },
              columns
            );
          } else {
            getEventTable = await eventModal.find(
              { profile_id: `${profile_id}` },
              columns
            );
          }
        }
      }
      let check = false;
      let finalData = Array();
      for (let i = 0; i < getEventTable.length; i++) {

        const b = await mHttpRequests(getEventTable[i]);

        let mEventObject = { object_id: getEventTable[i]._id };
        let mEventID = { id: getEventTable[i].id };
        let mprofile_id = { profile_id: getEventTable[i].profile_id };
        let mname = { name: getEventTable[i].name };
        let mdate = { date: getEventTable[i].date };
        let mtime = { time: getEventTable[i].time };
        let mlocation = { location: getEventTable[i].location };
        let mincrowd_amount = { min_crowd_amount: getEventTable[i].min_crowd_amount };
        let maxcrowd_amount = { max_crowd_amount: getEventTable[i].max_crowd_amount };
        let mcrowd_amount = { crowd_amount: getEventTable[i].crowd_amount };

        let mbudget = { budget: getEventTable[i].budget };
        let martist_type = { artist_type: getEventTable[i].artist_type };
        let mevent_type = { event_type: getEventTable[i].event_type };

        let mmax_budget = { max_budget: getEventTable[i].max_budget };
        let mmin_budget = { min_budget: getEventTable[i].min_budget };

        let mage_restriction = {
          age_restriction: getEventTable[i].age_restriction,
        };
        let mnote = { note: getEventTable[i].note };
        let m_tags, m_tag_temp
        console.log(getEventTable[i].tags)
        if (getEventTable[i].tags) {
          let tempTag = getEventTable[i].tags
          console.log(tempTag)

          m_tag_temp = { tag_temp: tempTag };

          try {
            let mtag = JSON.parse(tempTag.replaceAll("'", "").replaceAll('"', ''))

            if (mtag) {
              // let mtagFind = await subSubTagModal.find({ id: { $in: mtag } });

              const mcolumnssub = {
                _id: 0,
                sub_tag_id: 1,
              };


              await subSubTagModal.find({ id: { $in: mtag } }, mcolumnssub).distinct("sub_tag_id").then(async (subSubResp) => {

                await subTagModal.find({ id: { $in: subSubResp } }, mcolumnssub).distinct("tag_id").then(async (subResp) => {

                  await tagModal.find({ id: { $in: subResp } }).then(async (tegCategory) => {
                    let results_temp = Array();
                    for (let k = 0; k < tegCategory.length; k++) {
                      const results = await mHttpRequestTag(tegCategory[k].id, subSubResp, mtag)

                      let mtagname = { "tag_name": tegCategory[k].tag_name }
                      let mtagid = { "id": tegCategory[k].id }
                      let mtagstatus = { "active_status": tegCategory[k].active_status }
                      let msubcategory = { "sub_category": results }

                      results_temp.push(Object.assign(mtagid, mtagname, mtagstatus, msubcategory))
                    }
                    m_tags = { tags: results_temp };
                  })
                })
              });
            } else {

              m_tags = { tags: tempTag };

            }
          }
          catch {
            m_tags = { tags: tempTag };

          }
        }
        const mstatus_event = await eventStatus(getEventTable[i].status);

        let mstatus = { status: mstatus_event };
        let mactive_status = { active_status: getEventTable[i].active_status };
        let mcreated_on = { created_on: getEventTable[i].created_on };
        let mlast_updated_on = { last_updated_on: getEventTable[i].last_updated_on };

        let mShowID;
        // if (getEventTable[i].shows) { }
        finalData.push(
          Object.assign(
            mEventObject,
            mEventID,
            b,
            mprofile_id,
            mname,
            mdate,
            mtime,
            m_tag_temp,
            m_tags,
            mlocation,
            mcrowd_amount,
            mincrowd_amount,
            maxcrowd_amount,
            mbudget,
            mmin_budget,
            mmax_budget,
            martist_type,
            mevent_type,
            mage_restriction,
            mnote,
            mstatus,
            mactive_status,
            mcreated_on,
            mlast_updated_on,
            mShowID
          )
        );
      }
      // deno-lintss-ignore no-explicit-any
      // deno-lint-ignore no-inner-declarations
      async function mHttpRequests(events: any) {
        // deno-lint-ignore no-async-promise-executor
        return new Promise(async (resolve, reject) => {

          let mshow = Array();

          const mcolumns = {
            _id: 0,
            show_id: 1,
          };
          let showTable
          let mshowsevents = await showEventModal
            .find({ event_id: events.id }, mcolumns)
            .distinct("show_id");



          showTable = await showModal.find({ id: { $in: mshowsevents } });


          if (showTable.length > 0) {
            for (let i = 0; i < showTable.length; i++) {

              const mschedule = await mHttpRequestSchedule(showTable[i].profile_id);


              console.log("test test ", mschedule)
              console.log("test test ", mschedule)

              if (req.locals.role == "artist" || req.locals.role == "admin" || (mschedule === undefined || mschedule === null)) {

                let muser = await mHttpRequestProfile(showTable[i]);

                let mevent = { artist: muser };

                let m_id,
                  mid,
                  m_profile_id,
                  m_event_id,
                  m_title,
                  m_description,
                  m_includes,
                  m_duration,
                  m_tags,
                  m_show_type,
                  m_age_restriction,
                  m_url,
                  mmax_price,
                  m_crowd_amount,
                  m_price,
                  mmin_price,
                  m_active_status,
                  m_created_on,
                  m_last_updated_on: any;

                if (muser) {
                  if (showTable[i] && showTable[i]._id) {
                    m_id = { _id: showTable[i]._id };
                  }
                  if (showTable[i] && showTable[i].id) {
                    mid = { id: showTable[i].id };
                  }
                  if (showTable[i] && showTable[i].max_price) {
                    mmax_price = { max_price: showTable[i].max_price };
                  }
                  if (showTable[i] && showTable[i].crowd_amount) {
                    m_crowd_amount = { crowd_amount: showTable[i].crowd_amount };
                  }
                  if (showTable[i] && showTable[i].min_price) {
                    mmin_price = { min_price: showTable[i].min_price };
                  }
                  if (showTable[i] && showTable[i].profile_id) {
                    m_profile_id = { profile_id: showTable[i].profile_id };
                  }
                  if (showTable[i] && showTable[i].event_id) {
                    m_event_id = { event_id: showTable[i].event_id };
                  }
                  if (showTable[i] && showTable[i].title) {
                    m_title = { title: showTable[i].title };
                  }
                  if (showTable[i] && showTable[i].description) {
                    m_description = { description: showTable[i].description };
                  }
                  if (showTable[i] && showTable[i].includes) {
                    m_includes = { includes: showTable[i].includes };
                  }
                  if (showTable[i] && showTable[i].show_type) {
                    m_show_type = { show_type: showTable[i].show_type };
                  }
                  if (showTable[i] && showTable[i].age_restriction) {
                    m_age_restriction = {
                      age_restriction: showTable[i].age_restriction,
                    };
                  }
                  if (showTable[i] && showTable[i].duration) {
                    m_duration = { duration: showTable[i].duration };
                  }
                  if (showTable[i] && showTable[i].url) {
                    m_url = { url: showTable[i].url };
                  }
                  if (showTable[i] && showTable[i].price) {
                    m_price = { price: showTable[i].price };
                  }
                  if (showTable[i] && showTable[i].tags) {
                    m_tags = { tags: showTable[i].tags };
                  }
                  if (showTable[i] && showTable[i].active_status) {
                    m_active_status = {
                      active_status: showTable[i].active_status,
                    };
                  }
                  if (showTable[i] && showTable[i].last_updated_on) {
                    m_last_updated_on = {
                      last_updated_on: showTable[i].last_updated_on,
                    };
                  }
                  if (showTable[i] && showTable[i].created_on) {
                    m_created_on = { created_on: showTable[i].created_on };
                  }

                  mshow.push(
                    Object.assign(
                      m_id,
                      mid,
                      m_profile_id,
                      mevent,
                      m_event_id,
                      m_title,
                      m_description,
                      m_includes,
                      m_duration,
                      m_tags,
                      m_show_type,
                      m_age_restriction,
                      m_url,
                      m_price,
                      m_crowd_amount,
                      mmin_price,
                      mmax_price,
                      m_active_status,
                      m_created_on,
                      m_last_updated_on
                    )
                  );
                }
              }

              if (i == showTable.length - 1) {
                let mshows = { shows: mshow };
                resolve(mshows);
              }
            }

          } else {
            let mshows = { shows: [] };

            resolve(mshows);
          }
        });


        // deno-lint-ignore no-inner-declarations
        async function mHttpRequestSchedule(artist_id: any) {
          // deno-lint-ignore no-async-promise-executor
          return new Promise(async (resolve, reject) => {
            let artistSchedule;

            const moment = require('moment');
            const datetime = moment(mdate).format('YYYY-MM-DD');
            const mtime = moment(mdate).format('HH:mm');
            const filters = {
              $and: [
                {
                  start_date: { $lte: `${datetime}` },
                  start_time: { $lte: `${mtime}` }
                },
                {
                  end_date: { $gte: `${datetime}` },
                  end_time: { $gte: `${mtime}` }
                }
              ]
            };
            artistSchedule = await scheduleModal.findOne({ artist_id: artist_id, active_status: 'unavailable' }).where(filters);
            resolve(artistSchedule);
          });
        }
        async function mHttpRequestProfile(profile: any) {
          // deno-lint-ignore no-async-promise-executor
          return new Promise(async (resolve, reject) => {
            let artist_category = req.query.artist_category;

            let gender = req.query.gender;

            const columns = {
              id: 1,
              email: 1,
              msisdn: 1,
              last_name: 1,
              first_name: 1,
              gender: 1,
              category: 1,
            };
            let userTable;

            if (!artist_category && !gender) {
              userTable = await userModel.findOne(
                { id: profile.profile_id },
                columns
              );
            }

            if (artist_category && !gender) {
              userTable = await userModel.findOne(
                { id: profile.profile_id, category: artist_category },
                columns
              );
            }

            if (!artist_category && gender) {
              userTable = await userModel.findOne(
                { id: profile.profile_id, gender: gender },
                columns
              );
            }

            if (artist_category && gender) {
              userTable = await userModel.findOne(
                {
                  id: profile.profile_id,
                  category: artist_category,
                  gender: gender,
                },
                columns
              );
            }

            resolve(userTable);
          });
        }
      }

      // if (check == true) {

      res.status(200).send({
        Status: true,
        StatusCode: 0,
        Name: "Events",
        Data: finalData /**@desc User data display here */,
        StatusMessage: "הצלחת!",
      });
      // }
    } catch (error) {
      /**
      * @return
      * catch error is send out here
      * */
      res.status(400).send({
        Status: false,
        StatusCode: 2,
        StatusMessage: `${error}`,
      });
    }
  },

  /**
  * @name PUT
  * @desc controller to edit event values in the
  * @name editEvent config table
  *
  * * */
  editEvent: async (req: any, res: any) => {
    logger.info(`/POST event`);
    try {
      const body = await req.body;

      let updateEvent;
      let check = false;
      /**
      * @desc variable declaration
      * @name editEvent
      * @name errorCheck
      * @desc query to insert event values to @name event table
      * @const editEvent table values
      * */

      let updateUserTableFinal: any;

      if (req.locals.role == "admin") {
        updateEvent = {
          date: `${body.date}`,
          time: `${body.time}`,
          name: `${body.name}`,
          profile_id: `${body.profile_id}`,
          location: `${body.location}`,
          crowd_amount: `${body.crowd_amount}`,
          min_crowd_amount: `${body.min_crowd_amount}`,
          max_crowd_amount: `${body.max_crowd_amount}`,
          budget: `${body.budget}`,
          min_budget: `${body.min_budget}`,
          max_budget: `${body.max_budget}`,
          tags: `${body.tags}`,
          artist_type: `${body.artist_type}`,
          event_type: `${body.event_type}`,
          age_restriction: `${body.age_restriction}`,
          note: `${body.note}`,
          shows: `${body.shows}`,
          status: `${body.status}`,
        };
        updateUserTableFinal = await eventModal.updateOne(
          { id: `${body.id}` },
          updateEvent,
          { new: true }
        );
        // WHERE id:`${body.id}`;
      } else {
        if (req.locals.id == body.profile_id) {
          let mlebel = "private"
          if (req.locals.role == "business_customer") {
            mlebel = "business"
          }
          let status = await eventStatusFirst(body.status)
          updateEvent = {
            date: `${body.date}`,
            time: `${body.time}`,
            name: `${body.name}`,
            profile_id: `${body.profile_id}`,
            location: `${body.location}`,
            crowd_amount: `${body.crowd_amount}`,
            min_crowd_amount: `${body.min_crowd_amount}`,
            max_crowd_amount: `${body.max_crowd_amount}`,
            budget: `${body.budget}`,
            min_budget: `${body.min_budget}`,
            max_budget: `${body.max_budget}`,
            tags: `${body.tags}`,
            artist_type: `${body.artist_type}`,
            event_type: `${mlebel}`,
            age_restriction: `${body.age_restriction !== undefined ? body.age_restriction : 0}`,
            note: `${body.note}`,
            shows: `${body.shows}`,
            status: `${status ? status : "draft"}`,
          };
          updateUserTableFinal = await eventModal.updateOne(
            { id: `${body.id}`, profile_id: `${req.locals.id}` },
            updateEvent, { new: true }
          );
        } else {
          check = true;
        }
      }

      if (!check) {
        if (updateUserTableFinal.modifiedCount > 0) {
          /**
          * @desc updated ok
          * */
          res.status(200).send({
            Status: true,
            StatusCode: 0,
            StatusMessage: "הצלחת!",
          });
        } else {
          /**@desc nothing is updated */
          res.status(400).send({
            Status: false,
            StatusCode: 1,
            StatusMessage: "אין שינוי בערך של השדה",
          });
        }
      } else {
        res.status(400).send({
          Status: false,
          StatusCode: 1,
          StatusMessage: "User dont match profile",
        });
      }
    } catch (error) {
      /**
      * @return
      * catch error is send out here
      * */
      res.status(400).send({
        Status: false,
        StatusCode: 2,
        StastusMessage: `${error}`,
      });
    }
  },

  /**
  * @desc active/deactivate event profile
  * @name PUT
  * @desc controller to edit @name updateEventStatus values
  * @function updateEventStatus
  * */
  updateEventStatus: async (req: any, res: any) => {
    logger.info(`/PUT event`);
    try {
      const body = await req.body;

      let role = req.locals.role;

      // if (role =:'admin') {

      logger.info(body);
      /**
      * @const updateEventStatus query defined
      * @desc active_status is either @name inactive or @name active
      * */

      await eventModal
        .updateOne(
          { id: `${body.id}` },
          { active_status: `${body.active_status}` },
          { new: true }
        )
        .then(async (resp: any) => {
          if (resp.modifiedCount > 0) {
            /**
            * @desc updated ok
            * */
            res.status(200).send({
              Status: true,
              StatusCode: 0,
              StatusMessage: "הצלחת!",
            });
          } else {
            /**
            * @desc nothing is updated
            * */
            res.status(200).send({
              Status: false,
              StatusCode: 1,
              StatusMessage: "אין שינוי בערך של השדה",
            });
          }
        });
    } catch (error) {
      /**
      * @return
      * catch error is send out here
      * */
      res.status(400).send({
        Status: false,
        StatusCode: 2,
        StatusMessage: `${error}`,
      });
    }
  },

  /**
  * @desc update event status
  * */
  /**
  * @name PUT
  * @desc controller to edit @name eventStatus values
  * @function eventStatus
  * */
  eventStatus: async (req: any, res: any) => {
    logger.info(`/PUT event`);
    try {
      const body = await req.body;
      let role = req.locals.role;
      // only admin can approve reject profile
      // if (role =:'admin') {
      logger.info(body);
      /**
      * @const approveProfile query defined
      * @desc status is either @name approved or @name declined
      * */
      await eventModal
        .updateOne(
          { id: `${body.id}` },
          { status: `${body.status}` },
          { new: true }
        )
        .then(async (resp: any) => {
          if (resp.modifiedCount > 0) {
            /**
            * @desc updated ok
            * */
            res.status(200).send({
              Status: true,
              StatusCode: 0,
              StatusMessage: "הצלחת!",
            });
          } else {
            /**
            * @desc nothing is updated
            * */
            res.status(400).send({
              Status: false,
              StatusCode: 1,
              StatusMessage: "אין שינוי בערך של השדה",
            });
          }
        });
    } catch (error) {
      /**
      * @return
      * catch error is send out here
      * */
      res.status(400).send({
        Status: false,
        StatusCode: 2,
        StatusMessage: `${error}`,
      });
    }
  },
};
