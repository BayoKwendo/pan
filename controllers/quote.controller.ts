import { dbQueueModel, quotationLogModal, quotationModal, scheduleModal, showEventModal, showModal } from "./../helpers/schema";
import { emailSent, eventStatus, getUserList, quoteStatusCHeck, quoteStatusUnCHeck } from "./../helpers/index";
import { getNextSequenceValue, project_folder } from "../helpers/index";
import { eventModal, table, userModel } from "../helpers/schema";
import dotenv from "dotenv";
import logger from "../middlewares/logger";
import moment from "moment"
import util from "util";
import { offerMadeMessage } from "../helpers/config";

dotenv.config(); // iniatilized configs here

export default {
  /**
  * @name POST
  * @desc controller to add show values in the
  * @name addQuote config table
  *
  * * */
  addQuote: async (req: any, res: any) => {
    logger.info(`/POST quote`);
    try {
      const body = await req.body;
      let event_id = body.event_id;
      let user_id = req.locals.id;

      let mrole = req.locals.role;
      /**
      * @desc variable declaration
      * @name insertQuote
      * @name errorCheck
      * @desc query to insert event values to @name show table
      * @const insertShow table values
      * */

      // const applicant_photo = Da te.now() + data.files[0].originalName;
      //admin cant add quotation
      if (mrole != "admin") {
        // user should not be an artist
        if (mrole != "artist") {
          // check if event id passed is valid

          await eventModal
            .find({ id: `${event_id}` })
            .then(async (result: any) => {
              if (result && result.length > 0) {
                // event is found
                if (result[0].active_status == "active") {
                  const mglobal = await getNextSequenceValue(`${table.global_id}`);

                  // is event active
                  /**
                  * @desc find artist details for notifications
                  * */
                  await userModel
                    .find({ id: `${result[0].profile_id}` })
                    .then(async (resultUser: any) => {
                      /**
                      * @desc search user profile
                      * */
                      if (resultUser && resultUser.length > 0) {

                        await quotationModal
                          .find({
                            event_id: `${body.event_id}`,
                            profile_id: `${user_id}`,
                            quote_status: 'waiting for the supplier response'
                          })
                          .then(async (mresp) => {
                            if (mresp.length == 0) {
                              // get shows
                              const mcolumns = {
                                _id: 0,
                                show_id: 1,
                              };
                              let mshowsevents = await showEventModal
                                .find({ event_id: `${body.event_id}` }, mcolumns)
                                .distinct("show_id");

                              let showTable = await showModal.find({ id: { $in: mshowsevents } });

                              if (showTable && showTable.length > 0) { // fetch all show for artists to get artist ids
                                await eventModal
                                  .updateOne(
                                    { id: `${body.event_id}` },
                                    {
                                      status: `waiting for suppliers confirmation`
                                    },
                                    { new: true }  //update event status
                                  ).then(async (resp: any) => {
                                    let mcount = 0
                                    for (let i = 0; i < showTable.length; i++) {

                                      const midd = await getNextSequenceValue(`${table.quotations}`);

                                      await addScheduler(`${Number(body.event_id)}`, `${midd}`, showTable[i], "not_closed_quote") // add new schedule when quote is created;

                                      let quotes = {
                                        id: midd,
                                        profile_id: `${user_id}`,
                                        events: `${result[0]._id}`,
                                        event_id: `${body.event_id}`,
                                        global_id: `${mglobal}`,
                                        show_id: `${showTable[i].id}`,
                                        artist_id: `${showTable[i].profile_id}`,
                                      };
                                      const vqueue = new quotationModal(quotes);

                                      await vqueue
                                        .save()
                                        .then(async (result: any) => {

                                          mcount = mcount + 1
                                          await userModel
                                            .find({ id: `${showTable[i].profile_id}` })
                                            .then(async (resultEventUser: any) => {
                                              /**
                                             * @desc search user profile
                                             * */
                                              if (resultEventUser && resultEventUser.length > 0) {
                                                // notifications
                                                let message = util.format(
                                                  offerMadeMessage,
                                                  resultEventUser[0].first_name,
                                                  resultEventUser[0].first_name ? resultEventUser[0].first_name : ""
                                                );

                                                let subject = "Offer Message";
                                                await emailSent(message, subject, resultEventUser[0].email);
                                                // let message = format(text, val)
                                                const mid = await getNextSequenceValue(`${table.db_queue}`);

                                                const queue = new dbQueueModel({
                                                  id: mid,
                                                  msisdn: `${resultEventUser[0].msisdn}`,
                                                  message: `${message}`,
                                                });
                                                await queue
                                                  .save()
                                                  .then(async (data) => {

                                                    // insert into logs 
                                                    const midlogs = await getNextSequenceValue(`${table.quotation_logs}`);
                                                    let quotes_logs = {
                                                      id: midlogs,
                                                      quote_id: `${midd}`,
                                                      quote_status: `waiting for the supplier response`,
                                                      role: mrole,
                                                      artist_id: `${showTable[i].profile_id}`,
                                                      profile_id: `${user_id}`,
                                                      response_status: `waiting for suppliers confirmation`,
                                                      description: `${body.notes}`,
                                                    };

                                                    const vqueue = new quotationLogModal(quotes_logs);
                                                    await vqueue
                                                      .save()
                                                      .then(async (result: any) => {
                                                        /**
                                                        * @desc insert ok
                                                        * */
                                                        if (result) {

                                                          if (mcount == (showTable.length)) {
                                                            res.status(200).send({
                                                              Status: true,
                                                              StatusCode: 0,
                                                              QuoteID: midd,
                                                              StatusMessage: "הצלחת!",
                                                            });
                                                          }
                                                        } else {

                                                          res.status(400).send({
                                                            Status: false,
                                                            StatusCode: 2,
                                                            StatusMessage: "Erro inputing the logs"
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
                                                    //END//
                                                  })
                                              }
                                            })
                                          // catch error on event update
                                        }).catch((error) => {
                                          /**
                                          * @return
                                          * catch error is send out here
                                          * */
                                          res.status(400).send({
                                            Status: false,
                                            StatusCode: 2,
                                            StatusMessage: `${error}`,
                                          });
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
                                  StatusCode: 1,
                                  StatusMessage: "No shows attached to the event",
                                });
                              }
                            } else {
                              res.status(400).send({
                                Status: false,
                                StatusCode: 1,
                                StatusMessage: "Quotation is still open",
                              });
                            }
                          })
                      } else {
                        res.status(400).send({
                          Status: false,
                          StatusCode: 1,
                          StatusMessage: "Artist not found",
                        });
                      }
                    })
                    .catch((error) => {
                      /**
                      * @return
                      * catch error is send out here
                      * */
                      res.status(400).send({
                        Status: false,
                        StatusCode: 2,
                        StatusMessage: `${error}`,
                      });
                    });
                } else {
                  res.status(406).send({
                    Status: false,
                    StatusCode: 1,
                    StatusMessage: "Event record not active",
                  });
                }
              } else {
                res.status(400).send({
                  Status: false,
                  StatusCode: 1,
                  StatusMessage: "Event record not found",
                });
              }
            });
        } else {
          res.status(400).send({
            Status: false,
            StatusCode: 1,
            StatusMessage: "Artists can not add quotation",
          });
        }
      } else {
        res.status(400).send({
          Status: false,
          StatusCode: 1,
          StatusMessage: "Admin can not add quotation",
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
  * @desc get Shows
  * @function getQuotesTable
  * */

  getQuoteTable: async (req: any, res: any) => {
    logger.info(`/ GET quote`);
    try {
      let profile_id = req.locals.id;
      /**
      * @desc sql query get all the @name getShowTable
      * @desc fech by either @name status,active_status and @name id
      * */
      // let id = req.query.role
      let id = req.query.id
      let event_id = req.query.event_id
      // let active_status = req.query.active_status
      let getQuoteTable;
      if (req.locals.role == "admin") {
        if (id) {
          getQuoteTable = await quotationModal.find({ id: `${id}` }).populate("events").exec();
        }
        else if (event_id) {
          getQuoteTable = await quotationModal
            .find({ event_id: `${event_id}` })
            .populate("events")
            .exec();
        }
        else {
          getQuoteTable = await quotationModal.find({}).populate("events").exec();
        }
      }
      else if (req.locals.role == "artist") {
        // getQuoteTable = await quotationModal.find({})
        const mcolumns = {
          _id: 0,
          id: 1
        };
        let eventTable = await showModal
          .find({ profile_id: `${profile_id}` }, mcolumns).distinct('id')

        // // getQuoteTable = await eventModal
        // //   .find({ profile_id: `${ profile_id }` })
        // const mcolumnevent = {
        //   _id: 0,
        //   event_id: 1
        // };
        // let showTable = await showEventModal
        //   .find({ show_id: { $in: eventTable } }, mcolumnevent).distinct('event_id')

        // if (showTable && showTable.length > 0) {
        if (id) {

          getQuoteTable = await quotationModal
            .find({ id: `${id}`, artist_id: req.locals.id })
            .populate("events")
            .exec();

        }
        else if (event_id) {

          getQuoteTable = await quotationModal
            .find({ event_id: `${event_id}`, artist_id: req.locals.id })
            .populate("events")
            .exec();
        }
        else {

          getQuoteTable = await quotationModal
            .find({ artist_id: req.locals.id })
            .populate("events")
            .exec();
        }

      } else {

        if (id) {
          getQuoteTable = await quotationModal
            .find({ profile_id: `${profile_id}`, id: `${id}` })
            .populate("events")
            .exec();
        }
        else if (event_id) {

          getQuoteTable = await quotationModal
            .find({ event_id: `${event_id}` })
            .populate("events")
            .exec();
        }
        else {
          getQuoteTable = await quotationModal
            .find({ profile_id: `${profile_id}` })
            .populate("events")
            .exec();
        }
      }



      let finalData = Array();

      for (let i = 0; i < getQuoteTable.length; i++) {
        const b = await mHttpRequests(getQuoteTable[i].events, getQuoteTable[i].show_id);

        const mquote = await mHttpRequestQuoteLogs(getQuoteTable[i]);


        const mstatus_event = await eventStatus(getQuoteTable[i].events.status)


        let mEvent = {
          events: {
            object_id: getQuoteTable[i].events._id,
            id: getQuoteTable[i].events.id,
            profile_id: getQuoteTable[i].events.profile_id,
            name: getQuoteTable[i].events.name,
            date: getQuoteTable[i].events.date,
            time: getQuoteTable[i].events.time,
            location: getQuoteTable[i].events.location,
            crowd_amount: getQuoteTable[i].events.crowd_amount,
            min_crowd_amount: getQuoteTable[i].events.min_crowd_amount,
            max_crowd_amount: getQuoteTable[i].events.max_crowd_amount,
            budget: getQuoteTable[i].events.budget,
            artist_type: getQuoteTable[i].events.artist_type,
            event_type: getQuoteTable[i].events.event_type,
            max_budget: getQuoteTable[i].events.max_budget,
            min_budget: getQuoteTable[i].events.min_budget,
            age_restriction: getQuoteTable[i].events.age_restriction,
            note: getQuoteTable[i].events.note,
            status: mstatus_event,
            active_status: getQuoteTable[i].events.active_status,
            created_on: getQuoteTable[i].events.created_on,
            last_updated_on: getQuoteTable[i].events.last_updated_on

          }
        };


        let muser = await mHttpRequestProfile(getQuoteTable[i].profile_id);

        let muser_artist = await mHttpRequestProfile(getQuoteTable[i].artist_id);


        let mEventObject = { object_id: getQuoteTable[i]._id };
        let mEventID = { id: getQuoteTable[i].id };
        let mprofile_id = { profile_id: getQuoteTable[i].profile_id };

        let mprofile_url = { client_profile: muser };
        let martist_url = { artist_profile: muser_artist };

        let martist_id = { artist_id: getQuoteTable[i].artist_id };
        let mnotes = { notes: getQuoteTable[i].notes };

        let mamount = { amount: getQuoteTable[i].amount };

        const mstatus_quote = await quoteStatusUnCHeck(getQuoteTable[i].quote_status)

        let mquote_status = { quote_status: mstatus_quote };
        let mactive_status = { active_status: getQuoteTable[i].active_status };
        let mcreated_on = { created_on: getQuoteTable[i].created_on };
        let mlast_updated_on = {
          last_updated_on: getQuoteTable[i].last_updated_on,
        };

        let mShowID;
        // if (getQuoteTable[i].shows) { }
        finalData.push(
          Object.assign(
            mEventObject,
            mEventID,
            mprofile_id,
            mprofile_url,
            martist_id,
            martist_url,
            mquote_status,
            mamount,
            mnotes,
            mactive_status,
            mcreated_on,
            mlast_updated_on,
            mEvent,
            mShowID,
            mquote,
            b

          ));
      }
      // deno-lintss-ignore no-explicit-any
      // deno-lint-ignore no-inner-declarations
      async function mHttpRequests(events: any, show_id: any) {
        // deno-lint-ignore no-async-promise-executor
        return new Promise(async (resolve, reject) => {

          let mshow = Array();

          const mcolumns = {
            _id: 0,
            show_id: 1,
          };
          let showTable

          if (req.locals.role == "artist") {
            showTable = await showModal.find({ profile_id: req.locals.id, id: show_id });
          } else {
            showTable = await showModal.find({ id: show_id });
          }

          if (showTable.length > 0) {
            for (let i = 0; i < showTable.length; i++) {
              let muser = await mHttpRequestProfile(showTable[i].profile_id);


              let mevent = { artist: muser };

              let
                m_id,
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
                    mmin_price,
                    mmax_price,
                    m_active_status,
                    m_created_on,
                  )
                );
              }
              if (i == showTable.length - 1) {
                let mshows = { shows: mshow[0] };
                resolve(mshows);
              }
            }
          } else {
            let mshows = { shows: [] };
            resolve(mshows);
          }
        });


      }
      async function mHttpRequestQuoteLogs(quote: any) {
        // deno-lint-ignore no-async-promise-executor
        return new Promise(async (resolve, reject) => {

          let quoteTable
          if (req.locals.role == "artist") {
            quoteTable = await quotationLogModal.find(
              { artist_id: req.locals.id, quote_id: quote.id },
            );
          } else {

            quoteTable = await quotationLogModal.find(
              { quote_id: quote.id },
            );
          }


          let finalQuote = Array()
          if (quoteTable && quoteTable.length) {

            for (let k = 0; k < quoteTable.length; k++) {
              let m_id = { _id: quoteTable[k]._id };
              let mid = { id: quoteTable[k].id };
              let martist_id = { artist_id: quoteTable[k].artist_id };
              let mprofile_id = { profile_id: quoteTable[k].profile_id };
              let mquote_id = { quote_id: quoteTable[k].quote_id };
              let mrole = { role: quoteTable[k].role };

              const mstatus_quote = await quoteStatusUnCHeck(quoteTable[k].quote_status)

              let mquote_status = { quote_status: mstatus_quote };
              let mresponse_status = { response_status: quoteTable[k].response_status };
              let mdescription = { description: quoteTable[k].description };
              let mlast_updated_on = { last_updated_on: quoteTable[k].last_updated_on };
              let mcreated_on = { created_on: quoteTable[k].created_on };
              let muser = await mArtist(quoteTable[k].artist_id);
              let mevent = { artist: muser };
              finalQuote.push(
                Object.assign(
                  m_id,
                  mid,
                  martist_id,
                  mevent,
                  mprofile_id,
                  mquote_id,
                  mrole,
                  mquote_status,
                  mresponse_status,
                  mdescription,
                  mcreated_on,
                  mlast_updated_on
                )
              )
            }
          }
          let mquote = { quote_logs: finalQuote };
          resolve(mquote);
        });
      }
      async function mArtist(artist_id: any) {
        // deno-lint-ignore no-async-promise-executor
        return new Promise(async (resolve, reject) => {

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

          userTable = await userModel.findOne(
            { id: artist_id },
            columns
          );
          resolve(userTable);
        });
      }

      res.status(200).send({
        Status: true,
        StatusCode: 0,
        Name: "Quotes",
        Data: finalData /**@desc User data display here */,
        StatusMessage: "הצלחת!",
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
  * @desc get quotes
  * @function getQuoteLogsTable
  * */

  getQuoteLogsTable: async (req: any, res: any) => {
    logger.info(`/ GET event`);
    try {
      let profile_id = req.locals.id;
      /**
      * @desc sql query get all the @name getQuoteLogTable
      * @desc fech by either @name status,active_status and @name id
      * */
      // let id = req.query.role
      let id = req.query.id
      let quote_id = req.query.quote_id
      let quoteTable
      if (id) {
        quoteTable = await quotationLogModal.find(
          { id: id },
        );
      }
      else if (req.locals.role == "artist") {
        quoteTable = await quotationLogModal.find(
          { artist_id: req.locals.id, quote_id: quote_id },
        );
      } else {
        quoteTable = await quotationLogModal.find(
          { quote_id: quote_id },
        );
      }
      let finalQuote = Array()
      if (quoteTable && quoteTable.length) {
        for (let k = 0; k < quoteTable.length; k++) {
          let m_id = { _id: quoteTable[k]._id };
          let mid = { id: quoteTable[k].id };
          let martist_id = { artist_id: quoteTable[k].artist_id };
          let mprofile_id = { profile_id: quoteTable[k].profile_id };
          let mquote_id = { quote_id: quoteTable[k].quote_id };
          let mrole = { role: quoteTable[k].role };
          let mquote_status = { quote_status: quoteTable[k].quote_status };
          let mresponse_status = { response_status: quoteTable[k].response_status };
          let mdescription = { description: quoteTable[k].description };
          let mlast_updated_on = { last_updated_on: quoteTable[k].last_updated_on };
          let mcreated_on = { created_on: quoteTable[k].created_on };
          let muser = await mArtist(quoteTable[k].artist_id);
          let mevent = { artist: muser };
          finalQuote.push(
            Object.assign(
              m_id,
              mid,
              martist_id,
              mevent,
              mprofile_id,
              mquote_id,
              mrole,
              mquote_status,
              mresponse_status,
              mdescription,
              mcreated_on,
              mlast_updated_on
            ))
        }
      }
      async function mArtist(artist_id: any) {
        // deno-lint-ignore no-async-promise-executor
        return new Promise(async (resolve, reject) => {
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
          userTable = await userModel.findOne({ id: artist_id }, columns);
          resolve(userTable);
        });
      }
      res.status(200).send(
        {
          Status: true,
          StatusCode: 0,
          Name: "QuoteLogs",
          QuoteID: quote_id,
          Data: finalQuote /** @desc quote data @name display here */,
          StatusMessage: "הצלחת!",
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
  getConversationTable: async (req: any, res: any) => {

    logger.info(`/ GET your conversation`);
    try {
      /**
         * @desc sql query get all the @name getConversationTable 
      * */
      let id = req.locals._id


      const mdata = await getUserList(id)
      /**
      * @desc everthing went well result is sent out 
      * */
      res.status(200).send({
        Status: true,
        StatusCode: 0,
        Name: "ConversationLists",
        Data: mdata, /**@desc User data display here */
        StatusMessage: "הצלחת!"
      })
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
  * @desc controller to add show values in the
  * @name updateShow config table
  *
  * * */
  updateQuote: async (req: any, res: any) => {
    logger.info(`/ PUT show`);

    try {

      const body = await req.body;

      let profile_id = req.locals.id;

      let quote_id = body.quote_id

      let mstatus_event = ''

      /**
        * @desc variable declaration
        * @name insertShow
        * @name errorCheck
        * @desc query to update show values to @name show table
        * @const updateShow table values
      * */

      let getQuote = await quotationModal
        .find({ id: `${quote_id}` })

      const mbody = await quoteStatusCHeck(body.status)


      if (mbody == 'waiting for the supplier response' || mbody == 'waiting for the client response' ||
        mbody == 'declined by supplier' || mbody == 'declined by client' || mbody == 'approved') {
        if (getQuote.length > 0) {
          const original_profile = getQuote[0].profile_id  // profile id for the client who created the quote
          const global_id = getQuote[0].global_id
          if (getQuote[0].quote_status == 'approved') {
            res.status(400).send({
              Status: false,
              StatusCode: 1,
              StatusMessage: "Quote already approved"
            })
          }
          else if (getQuote[0].quote_status == 'declined by client') {
            res.status(400).send({
              Status: false,
              StatusCode: 1,
              StatusMessage: "Quote already declined by client"
            })
          }
          else if (getQuote[0].quote_status == 'declined by supplier') {
            res.status(400).send({
              Status: false,
              StatusCode: 1,
              StatusMessage: "Quote already declined by supplier"
            })
          }
          else {

            let tempgetQuotes = await quotationModal
              .find({ profile_id: `${original_profile}`, global_id: `${global_id}` }); //total quotes


            let getQuotes = await quotationModal
              .find({ profile_id: `${original_profile}`, global_id: `${global_id}`, quote_status: ['declined by supplier', 'declined by client', 'approved'] }); // declined/approved quotes

            console.log(req.locals.role)
            if (req.locals.role == "artist") {

              let getQuoteLogs = await quotationLogModal
                .find({ artist_id: `${req.locals.id}`, quote_id: `${quote_id}` });

              if (getQuoteLogs.length > 0) {


                if (getQuoteLogs[getQuoteLogs.length - 1].quote_status == 'waiting for the supplier response') {

                  let getQuoteLogCheck = await quotationLogModal
                    .find({ quote_id: `${quote_id}`, artist_id: `${profile_id}`, quote_status: { $in: ['declined by supplier', 'declined by client', 'approved'] } }); // check if you closed this quote

                  if (getQuoteLogCheck.length > 0) { // quote log is greater than zero
                    res.status(400).send({
                      Status: false,
                      StatusCode: 1,
                      StatusMessage: "This quote is already processed"
                    })
                  }
                  else {
                    // check if you closed this quote
                    // your quote is still open
                    const midlogs = await getNextSequenceValue(`${table.quotation_logs}`);
                    let mstatus = 'waiting for the client response'
                    let mdiscription = 'waiting for customer response'
                    let mmamount = 0
                    if (body.amount > 0) {
                      mmamount = body.amount
                    }
                    await quotationModal.updateOne(
                      { id: `${body.quote_id}` },
                      {
                        notes: `${body.description}`,
                        amount: `${mmamount}`
                      },
                      { new: true });
                    if (mbody == 'approved') {
                      mstatus = mbody
                      mdiscription = mbody
                      await quotationModal.updateOne(
                        { id: `${body.quote_id}` },
                        { quote_status: mbody, notes: `${body.description}` },
                        { new: true })

                      let quotes_logs = {
                        id: midlogs,
                        quote_id: `${quote_id}`,
                        quote_status: mstatus,
                        role: req.locals.role,
                        profile_id: `${getQuoteLogs[getQuoteLogs.length - 1].profile_id}`,
                        artist_id: `${profile_id}`,
                        response_status: mdiscription,
                        description: body.description,
                      };

                      const vqueue = new quotationLogModal(quotes_logs);

                      await vqueue
                        .save()
                        .then(async (result: any) => {
                          /**
                          * @desc insert ok
                          * */
                          if (result) {


                            let tempLength = tempgetQuotes.length //total quotes closed
                            let dataLength = getQuotes.length //total quotes closed


                            if (tempLength > 0 && (tempLength - dataLength) - 1) {
                              mstatus_event = mbody
                            } else {
                              mstatus_event = 'waiting for suppliers confirmation'
                            }
                            await eventModal
                              .updateOne(
                                { id: `${getQuote[0].event_id}` },
                                {
                                  status: mstatus_event,
                                },
                                { new: true }
                              ).then(async (resp: any) => {
                                await updateScheduler(`${quote_id}`, "closed_quote")
                                res.status(200).send({
                                  Status: true,
                                  StatusCode: 0,
                                  QuoteID: quote_id,
                                  QuoteLogID: midlogs,
                                  QuationDescription: mdiscription,
                                  StatusMessage: "הצלחת!"
                                });
                              })
                          } else {
                            res.status(400).send({
                              Status: false,
                              StatusCode: 2,
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
                      // })
                    }
                    else if (mbody == 'declined by supplier' || mbody == 'declined by client') {
                      mstatus = mbody
                      mdiscription = mbody
                      await quotationModal.updateOne(
                        { id: `${body.quote_id}` },
                        { quote_status: mbody, notes: `${body.description}` },
                        { new: true })

                      let quotes_logs = {
                        id: midlogs,
                        quote_id: `${quote_id}`,
                        quote_status: mstatus,
                        role: req.locals.role,
                        profile_id: `${getQuoteLogs[getQuoteLogs.length - 1].profile_id}`,
                        artist_id: `${profile_id}`,
                        response_status: mdiscription,
                        description: body.description,
                      };

                      const vqueue = new quotationLogModal(quotes_logs);

                      await vqueue
                        .save()
                        .then(async (result: any) => {
                          /**
                          * @desc insert ok
                          * */
                          if (result) {


                            await updateScheduler(`${quote_id}`, "blocked")

                            mstatus_event = 'some of the suppliers didnt confirm quotation'

                            await eventModal
                              .updateOne(
                                { id: `${getQuote[0].event_id}` },
                                {
                                  status: mstatus_event,
                                },
                                { new: true }
                              ).then(async (resp: any) => {
                                res.status(200).send({
                                  Status: true,
                                  StatusCode: 0,
                                  QuoteID: quote_id,
                                  QuoteLogID: midlogs,
                                  QuationDescription: mdiscription,
                                  StatusMessage: "הצלחת!"
                                });
                              })
                          } else {
                            res.status(400).send({
                              Status: false,
                              StatusCode: 2,
                              StatusMessage: "Error inserting bidding log"
                            });
                          }
                        }).catch((error) => {
                          /**`
                          * @return
                          * */
                          res.status(400).send({
                            Status: false,
                            StatusCode: 2,
                            StatusMessage: `${error}`,
                          });
                        });
                    }
                    else {

                      console.log(getQuoteLogs[getQuoteLogs.length - 1].quote_status)
                      if (mbody == 'waiting for the client response') {

                        let mstatus = mbody
                        mstatus_event = 'waiting for customer response'
                        await eventModal
                          .updateOne(
                            { id: `${getQuote[0].event_id}` },
                            {
                              status: mstatus_event,
                            },
                            { new: true }
                          ).then(async (resp: any) => {
                            await quotationModal.updateOne(
                              { id: `${body.quote_id}` },
                              { quote_status: mbody, notes: `${body.description}` },
                              { new: true })

                            let quotes_logs = {
                              id: midlogs,
                              quote_id: `${quote_id}`,
                              quote_status: mstatus,
                              role: req.locals.role,
                              profile_id: `${getQuoteLogs[getQuoteLogs.length - 1].profile_id}`,
                              artist_id: `${profile_id}`,
                              response_status: mstatus_event,
                              description: body.description,
                            };
                            const vqueue = new quotationLogModal(quotes_logs);
                            await vqueue
                              .save()
                              .then(async (result: any) => {
                                /**
                                * @desc insert ok
                                * */
                                if (result) {
                                  res.status(200).send({
                                    Status: true,
                                    StatusCode: 0,
                                    QuoteID: quote_id,
                                    QuoteLogID: midlogs,
                                    QuationDescription: mstatus_event,
                                    StatusMessage: "הצלחת!"
                                  });
                                } else {
                                  res.status(400).send({
                                    Status: false,
                                    StatusCode: 2,
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
                          })
                      } else {
                        res.status(400).send({
                          Status: false,
                          StatusCode: 1,
                          StatusMessage: "Quote await client response"
                        })
                      }
                    }
                  }
                }
                else {
                  res.status(400).send({
                    Status: false,
                    StatusCode: 1,
                    StatusMessage: "Quote await client response"
                  })
                }
              }
              else {
                res.status(400).send({
                  Status: false,
                  StatusCode: 1,
                  StatusMessage: "Quote not found"
                })
              }
            }
            else if (req.locals.role == "private_customer" || req.locals.role == "institutional_customer" || req.locals.role == "business_customer") {


              let getQuoteLogs = await quotationLogModal
                .find({ quote_id: `${quote_id}`, quote_status: 'waiting for the client response' });

              if (getQuoteLogs.length > 0) {
                const midlogs = await getNextSequenceValue(`${table.quotation_logs}`);
                let mstatus = 'open'
                let mdiscription = 'waiting for the client response'
                let getQuoteLogCheck = await quotationLogModal
                  .find({ quote_id: `${quote_id}`, artist_id: `${getQuoteLogs[getQuoteLogs.length - 1].artist_id}`, quote_status: { $in: ['declined by supplier', 'declined by client', 'approved'] } }); // check if you closed this quote


                if (getQuoteLogCheck.length > 0) { // quote log is greater than zero
                  res.status(400).send({
                    Status: false,
                    StatusCode: 1,
                    StatusMessage: "You have already close this quote"
                  })
                }
                else {

                  if (mbody == 'approved') {

                    mstatus = mbody

                    mdiscription = mbody

                    await quotationModal
                      .updateOne(
                        { id: `${body.quote_id}` }, { quote_status: mbody }, { new: true })

                    let quotes_logs = {
                      id: midlogs,
                      quote_id: `${quote_id}`,
                      quote_status: mstatus,
                      role: req.locals.role,
                      profile_id: `${profile_id}`,
                      artist_id: `${getQuoteLogs[getQuoteLogs.length - 1].artist_id}`,
                      status: mdiscription,
                      response_status: mdiscription,
                      description: body.description,
                    };
                    const vqueue = new quotationLogModal(quotes_logs);
                    await vqueue
                      .save()
                      .then(async (result: any) => {
                        /**
                        * @desc insert ok
                        * */
                        if (result) {
                          await updateScheduler(`${quote_id}`, "closed_quote")
                          // await addScheduler(`${getQuote[0].event_id}`,)
                          let tempLength = tempgetQuotes.length //total quotes closed
                          let dataLength = getQuotes.length //total quotes closed

                          if (tempLength > 0 && (tempLength - dataLength) - 1) {
                            mstatus_event = mbody
                          } else {
                            mstatus_event = "waiting for suppliers confirmation"
                          }
                          await eventModal
                            .updateOne(
                              { id: `${getQuote[0].event_id}` },
                              {
                                status: mstatus_event,
                              },
                              { new: true }
                            ).then(async (resp: any) => {

                              res.status(200).send({
                                Status: true,
                                StatusCode: 0,
                                QuoteID: quote_id,
                                QuoteLogID: midlogs,
                                QuationDescription: mdiscription,
                                StatusMessage: "הצלחת!"
                              });
                            })

                        } else {

                          res.status(400).send({
                            Status: false,
                            StatusCode: 2,
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
                  }
                  else if (mbody == 'declined by supplier' || mbody == 'declined by client') {

                    mstatus = mbody;
                    mdiscription = mbody;
                    await quotationModal
                      .updateOne(
                        { id: `${body.quote_id}` }, { quote_status: mbody }, { new: true })

                    mstatus_event = "some of the suppliers didnt confirm quotation"

                    await eventModal
                      .updateOne(
                        { id: `${getQuote[0].event_id}` },
                        {
                          status: mstatus_event,
                        },
                        { new: true }
                      ).then(async (resp: any) => {
                        let quotes_logs = {
                          id: midlogs,
                          quote_id: `${quote_id}`,
                          quote_status: mstatus,
                          role: req.locals.role,
                          profile_id: `${profile_id}`,
                          artist_id: `${getQuoteLogs[getQuoteLogs.length - 1].artist_id}`,
                          status: mdiscription,
                          response_status: mdiscription,
                          description: body.description,
                        };
                        const vqueue = new quotationLogModal(quotes_logs);
                        await vqueue
                          .save()
                          .then(async (result: any) => {
                            /**
                            * @desc insert ok
                            * */
                            if (result) {
                              await updateScheduler(`${quote_id}`, 'blocked')
                              res.status(200).send({
                                Status: true,
                                StatusCode: 0,
                                QuoteID: quote_id,
                                QuoteLogID: midlogs,
                                QuationDescription: mdiscription,
                                StatusMessage: "הצלחת!"
                              });

                            } else {

                              res.status(400).send({
                                Status: false,
                                StatusCode: 2,
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

                            });
                          });
                      })
                  }
                  else {


                    let getQuoteLogs = await quotationLogModal
                      .find({ quote_id: `${quote_id}` });


                    if (getQuoteLogs[getQuoteLogs.length - 1].quote_status !== 'waiting for the supplier response' &&
                      mbody == "waiting for the supplier response") {

                      let mstatus = mbody

                      let mdiscription = 'waiting for suppliers confirmation'
                      mstatus_event = mdiscription

                      await eventModal
                        .updateOne(
                          { id: `${getQuote[0].event_id}` },
                          {
                            status: mstatus_event
                          },
                          { new: true }
                        ).then(async (resp: any) => {
                          let quotes_logs = {
                            id: midlogs,
                            quote_id: `${quote_id}`,
                            quote_status: mstatus,
                            role: req.locals.role,
                            profile_id: `${profile_id}`,
                            artist_id: `${getQuoteLogs[getQuoteLogs.length - 1].artist_id}`,
                            status: mstatus,
                            response_status: mdiscription,
                            description: body.description,
                          };
                          const vqueue = new quotationLogModal(quotes_logs);
                          await vqueue
                            .save()
                            .then(async (result: any) => {
                              /**
                                  * @desc insert ok
                              * */
                              if (result) {
                                await quotationModal
                                  .updateOne(
                                    { id: `${body.quote_id}` }, { quote_status: mbody }, { new: true })
                                res.status(200).send({
                                  Status: true,
                                  StatusCode: 0,
                                  QuoteID: quote_id,
                                  QuoteLogID: midlogs,
                                  QuationDescription: mdiscription,
                                  StatusMessage: "הצלחת!"
                                });
                              } else {
                                res.status(400).send({
                                  Status: false,
                                  StatusCode: 2,
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
                        })
                    } else {
                      res.status(400).send({
                        Status: false,
                        StatusCode: 1,
                        StatusMessage: "Quote await response from the supplier"
                      })
                    }
                  }
                }
              }
              else {
                res.status(400).send({
                  Status: false,
                  StatusCode: 1,
                  StatusMessage: "Quote await response from the supplier"
                })
              }

            } else {
              res.status(400).send({
                Status: false,
                StatusCode: 1,
                StatusMessage: "Not authorized to Bid"
              })
            }
          }
        }
        else {
          res.status(400).send({
            Status: false,
            StatusCode: 1,
            StatusMessage: "Quote record not found"
          })
        }
      } else {
        res.status(400).send({
          Status: false,
          StatusCode: 1,
          StatusMessage: "Invalid quote status"
        })
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



  //Schedular
  addSchedule: async (req: any, res: any) => {
    logger.info(`/ POST quote`);
    try {
      const body = await req.body;
      let event_id = body.event_id;
      let user_id = req.locals.id;

      let mrole = req.locals.role;
      /**
      * @desc variable declaration
      * @name insertQuote
      * @name errorCheck
      * @desc query to insert event values to @name show table
      * @const insertShow table values
      * */

      // const applicant_photo = Da te.now() + data.files[0].originalName;
      //admin cant add quotation
      if (mrole != "admin") {
        // user should not be an artist
        if (mrole == "artist") {
          // check if event id passed is valid

          const midsch = await getNextSequenceValue(`${table.scheduler}`);

          let mschedular = {
            id: midsch,
            end_date: `${body.end_date}`,
            start_date: `${body.start_date}`,
            start_time: `${body.start_time}`,
            end_time: `${body.end_time}`,
            status: "closed_quote",
            artist_id: user_id,
            description: `${body.notes}`
          }

          const vqueue = new scheduleModal(mschedular);
          await vqueue
            .save()
            .then(async (result: any) => {
              /**
              * @desc insert ok
              * */
              res.status(200).send({
                Status: true,
                StatusCode: 0,
                PayLoad: mschedular,
                StatusMessage: "הצלחת!"
              });
            })

        } else {
          res.status(400).send({
            Status: false,
            StatusCode: 1,
            StatusMessage: "You are not authorized",
          });
        }
      } else {
        res.status(400).send({
          Status: false,
          StatusCode: 1,
          StatusMessage: "You are not authorized",
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

  getScheduleTable: async (req: any, res: any) => {
    logger.info(`/ GET schedule`);
    try {
      let profile_id = req.locals.id;
      /**
          * @desc sql query get all the 
          * @name getShowTable
          * @desc fech by either 
          * @name status,active_status and 
          * @name id
      * */
      // let id = req.query.role
      let id = req.query.id
      let status = req.query.status
      let start_date = req.query.start_date
      let end_date = req.query.end_date


      const filters = {
        start_date: {
          $gte: `${start_date}`
        },
        end_date: {
          $lte: `${end_date}`
        },
      };

      // let active_status = req.query.active_status
      let getScheduleTable;
      if (req.locals.role == "admin") {
        if (id) {
          getScheduleTable = await scheduleModal.find({ id: `${id}` });
        }
        else if (status && !start_date && !end_date) {
          getScheduleTable = await scheduleModal.find({ 'active_status': `${status}` });
        }
        else if (status && start_date && end_date) {
          getScheduleTable = await scheduleModal.find({ 'active_status': `${status}` }).where(filters);;
        }
        else if (!status && start_date && end_date) {
          getScheduleTable = await scheduleModal.find({}).where(filters);;
        }
        else {
          getScheduleTable = await scheduleModal.find({});
        }
      }
      else if (req.locals.role == "artist") {
        if (id) {
          getScheduleTable = await scheduleModal
            .find({ id: `${id}`, artist_id: `${profile_id}` });
        }
        else if (status && !start_date && !end_date) {
          getScheduleTable = await scheduleModal.find({ artist_id: `${profile_id}`, 'active_status': `${status}` });
        }
        else if (status && start_date && end_date) {
          getScheduleTable = await scheduleModal.find({ artist_id: `${profile_id}`, 'active_status': `${status}` }).where(filters);;
        }
        else if (!status && start_date && end_date) {
          getScheduleTable = await scheduleModal.find({ artist_id: `${profile_id}` }).where(filters);;
        }
        else {
          getScheduleTable = await scheduleModal
            .find({ artist_id: `${profile_id}` });
        }
      } else {
        let artist_id = req.query.artist_id
        if (id) {
          getScheduleTable = await scheduleModal
            .find({ id: `${id}`, artist_id: `${artist_id}` });
        }
        else if (status && !start_date && !end_date) {
          getScheduleTable = await scheduleModal.find({ artist_id: `${artist_id}`, 'active_status': `${status}` });
        }
        else if (status && start_date && end_date) {
          getScheduleTable = await scheduleModal.find({ artist_id: `${artist_id}`, 'active_status': `${status}` }).where(filters);
        }
        else if (!status && start_date && end_date) {
          getScheduleTable = await scheduleModal.find({ artist_id: `${artist_id}` }).where(filters);;
        }
        else {
          getScheduleTable = await scheduleModal
            .find({ artist_id: `${artist_id}` });

        }
      }

      res.status(200).send({
        Status: true,
        StatusCode: 0,
        Name: "Scheduler",
        Data: getScheduleTable /**@desc User data display here */,
        StatusMessage: "הצלחת!",
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





  getScheduleTableSample: async (req: any, res: any) => {
    logger.info(`/ GET schedule`);
    try {
      let profile_id = req.locals.id;
      /**
      * @desc sql query get all the @name getShowTable
      * @desc fech by either @name status,active_status and @name id
      * */
      // let id = req.query.role
      let id = req.query.id
      let status = req.query.status
      let start_date = req.query.start_date
      let end_date = req.query.end_date
      // const filters = {
      //   start_date: {
      //     $gte: `${start_date}`
      //   },
      //   end_date: {
      //     $lte: `${end_date}`
      //   },
      // };
      let scheduleGroup;

      if (req.locals.role != "admin") {

        let artist_id = req.query.artist_id

        if (req.locals.role == "artist") {
          artist_id = profile_id
        }

        scheduleGroup = await scheduleModal.aggregate([
          {
            $match: {
              $expr: {
                $eq: [
                  "$artist_id", artist_id
                ]
              },
            }
          },
          {
            $group:
            {
              _id: "$start_date",
            }
          },
          { $sort: { _id: 1 } }
        ]);
      }



      else if (req.locals.role == "admin") {

        scheduleGroup = await scheduleModal.aggregate([
          {
            $group:
            {
              _id: "$start_date"
            }
          },
          { $sort: { _id: 1 } }
        ]);

      }

      if (start_date && end_date) {
        start_date = start_date
        end_date = end_date
      }
      else if (scheduleGroup.length > 0) {
        start_date = scheduleGroup[0]._id
        end_date = scheduleGroup[scheduleGroup.length - 1]._id
      }




      const startsDate = moment(`${start_date}`, "YYYY-MM-DD");
      const endDate = moment(`${end_date}`, "YYYY-MM-DD");


      let mdiff = endDate.diff(startsDate, 'days');



      let scheduleArray = Array()
      if ((mdiff + 1) > 0) {
        for (let r = 0; r < mdiff + 1; r++) {
          const mdates = moment(`${startsDate}`).add(r, "day").format("YYYY-MM-DD");
          const results: any = await mHttpRequestAcclimate(mdates)
          let mstart_date = { "start_date": mdates }
          let mproject = { "items": results }
          scheduleArray.push(Object.assign(mstart_date, mproject))
        }
      }

      // else {
      //   for (let r = 0; r < scheduleGroup.length; r++) {
      //     const results: any = await mHttpRequestAcclimate(scheduleGroup[r]._id)
      //     let mstart_date = { "start_date": scheduleGroup[r]._id }
      //     let mproject = { "items": results }
      //     scheduleArray.push(Object.assign(mstart_date, mproject))
      //   }
      // }


      async function mHttpRequestAcclimate(startDate: any) {

        return new Promise(async (resolve, reject) => {


          // let active_status = req.query.active_status
          let getScheduleTable;
          if (req.locals.role == "admin") {


            if (id) {
              getScheduleTable = await scheduleModal.find({ id: `${id}`, start_date: `${startDate}` });
            }
            else if (status && !start_date && !end_date) {

              getScheduleTable = await scheduleModal.find({ 'active_status': `${status}`, start_date: `${startDate}` });
            }
            else if (status && start_date && end_date) {

              getScheduleTable = await scheduleModal.find({ 'active_status': `${status}`, start_date: `${startDate}` });
            }

            else if (!status && start_date && end_date) {

              getScheduleTable = await scheduleModal.find({ start_date: `${startDate}` });
            }
            else {


              getScheduleTable = await scheduleModal.find({});
            }



            resolve(getScheduleTable)
          }
          else if (req.locals.role == "artist") {
            if (id) {
              getScheduleTable = await scheduleModal
                .find({ id: `${id}`, artist_id: `${profile_id}`, start_date: `${startDate}` });
            }
            else if (status && !start_date && !end_date) {
              getScheduleTable = await scheduleModal.find({ artist_id: `${profile_id}`, 'active_status': `${status}`, start_date: `${startDate}` });
            }
            else if (status && start_date && end_date) {

              getScheduleTable = await scheduleModal.find({ artist_id: `${profile_id}`, 'active_status': `${status}`, start_date: `${startDate}` });
            }
            else if (!status && start_date && end_date) {
              getScheduleTable = await scheduleModal.find({ artist_id: `${profile_id}`, start_date: `${startDate}` });
            }
            else {
              getScheduleTable = await scheduleModal
                .find({ artist_id: `${profile_id}` });
            }
            resolve(getScheduleTable)
          } else {
            let artist_id = req.query.artist_id
            if (id) {
              getScheduleTable = await scheduleModal
                .find({ id: `${id}`, artist_id: `${artist_id}`, start_date: `${startDate}` });
            }
            else if (status && !start_date && !end_date) {
              getScheduleTable = await scheduleModal.find({ artist_id: `${artist_id}`, 'active_status': `${status}`, start_date: `${startDate}` });
            }
            else if (status && start_date && end_date) {

              getScheduleTable = await scheduleModal.find({ artist_id: `${artist_id}`, 'active_status': `${status}`, start_date: `${startDate}` })
            }

            else if (!status && start_date && end_date) {
              getScheduleTable = await scheduleModal.find({ artist_id: `${artist_id}`, start_date: `${startDate}` });
            }
            else {

              getScheduleTable = await scheduleModal
                .find({ artist_id: `${artist_id}` });
            }
            resolve(getScheduleTable)
          }
        })
      }
      res.status(200).send({
        Status: true,
        StatusCode: 0,
        Name: "Scheduler",
        Data: scheduleArray /**@desc User data display here */,
        CalenderDate: scheduleGroup,
        StatusMessage: "הצלחת!",
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

  updateSchedulerStatus: async (req: any, res: any) => {
    logger.info(`/ PUT show`);
    try {
      const body = await req.body;

      /**
       * @const updateSchedulerStatus query defined
       * @desc active_status is either @name inactive or @name active
       * */
      await scheduleModal
        .updateOne(
          { id: `${body.id}` },
          { active_status: `${body.active_status}` },
          { new: true }
        ).then(async (resp: any) => {
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
            res.status().send({
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
     * @name DELETE
     * @name quote controller
 */
  deleteScheduleTable: async (req: any, res: any) => {
    logger.info(`/DELETE schedule`);
    try {

      let user_id = req.locals.id;
      let id = req.params.id;
      /**
          * @desc sql query get all the @name getTagTable 
          * @name status,role,active_status and
          * @name id                    
      * */
      if (req.locals.role == "artist") {

        let scheduleData = await scheduleModal.deleteOne({ artist_id: user_id, id: id })

        if (scheduleData.deletedCount > 0) {
          res.status(200).send({
            Status: true,
            StatusCode: 0,
            Name: 'Schedule',
            Data: scheduleData,
            StatusMessage: "הצלחת!"
          });
        } else {
          res.status(400).send({
            Status: false,
            StatusCode: 1,
            Name: 'Schedule',
            StatusMessage: "schedule not found"
          });
        }
      } else {
        res.status(400).send({
          Status: false,
          StatusCode: 2,
          StatusMessage: "Only artist can delete their schedule"
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
  }
};



const updateScheduler = (quote_id: any, mstatus: any) => {
  return new Promise(async (resolve, reject) => {
    try {
      await scheduleModal
        .updateOne(
          { quote_id: `${quote_id}` },
          { status: `${mstatus}` },
          { new: true }
        ).then(async (resp: any) => {
          resolve(true);
        });
    }
    catch (error) {
      /** 
       * @return
      * */
      resolve(true)
    }
  })
}




const addScheduler = (event_id: any, quote_id: any, showTable: any, mstatus: any) => {

  return new Promise(async (resolve, reject) => {
    try {
      /**
        * @desc variable declaration
        * @name insertQuote
        * @name errorCheck
        * @desc query to insert event values to @name show table
        * @const insertShow table values
      * */
      // get shows
      const mcolumns = {
        _id: 0,
        show_id: 1,
      };
      let mshowsevents = await showEventModal
        .find({ event_id: `${event_id}` }, mcolumns)
        .distinct("show_id");
      let eventTable = await eventModal.find({ id: `${event_id}` });

      console.log("eventTable ", eventTable)
      // let finalData = Array();
      if (eventTable && eventTable.length > 0) { // fetch all show for artists to get artist ids

        // let showTable = await showModal.find({ id: { $in: mshowsevents } });
        // // let finalData = Array();
        // if (showTable && showTable.length > 0) { // fetch all show for artists to get artist ids
        let mcount = 0
        // for (let i = 0; i < showTable.length; i++) {
        mcount = mcount + 1
        let final = 0
        let lastfinal = 0

        if (showTable.duration) {
          console.log("showTable record ", showTable)

          let d = showTable.duration
          let mres_minutes = d.substring(d.indexOf("-"), d.length)
          let mlastres_hours = d.substring(0, d.indexOf("-"))
          if (mres_minutes && mlastres_hours) {
            final = Number(mlastres_hours.trim().toString().replaceAll("-", ""))
            lastfinal = Number(mres_minutes.trim().toString().replaceAll("-", ""))
          }
        }
        let mhours = '0'
        let mminutes = '0'
        let mdate = ''
        let temp_date = ''
        let mstarthr = '00:00'

        if (eventTable[0].date) {

          console.log("showTable record ", eventTable[0].date)

          mdate = moment.utc(eventTable[0].date).format('YYYY-MM-DD HH:mm')
          temp_date = moment.utc(eventTable[0].date).format('YYYY-MM-DD')
          mstarthr = moment(eventTable[0].date).format('HH:mm')
          mhours = moment(eventTable[0].date).format('HH')
          mminutes = moment(eventTable[0].date).format('mm')

        }

        console.log("mdate record ", mdate)
        console.log("temp_date record ", temp_date)
        console.log("mstarthr record ", mstarthr)
        console.log("mhours record ", mhours)
        console.log("mminutes record ", mminutes)



        let end_durations = (final) + ":" + (Number(lastfinal))
        let mstartdate = moment.utc(mdate).format('YYYY-MM-DD')
        let mfinalDate = moment.utc(mdate).add(final, "hours").format('YYYY-MM-DD')

        console.log("mstartdate record ", mstartdate)
        console.log("mfinalDate record ", mfinalDate)

        let finalhours = (Number(mhours) + final)
        if ((Number(mhours) + final) >= 24) {
          let mfinalhours = ((Number(mhours) + final) / 24)
          finalhours = (Number(mhours) + Number(final)) - (parseInt(mfinalhours.toString()) * 24)

          console.log("finalhours record ", finalhours)

        }

        let finalminutes = (Number(mminutes) + Number(lastfinal))
        if ((Number(mminutes) + Number(lastfinal)) >= 60) {

          let mfinalminutes = ((Number(mminutes) + Number(lastfinal)) / 60)
          finalminutes = (Number(mminutes) + Number(lastfinal)) - (parseInt(mfinalminutes.toString()) * 60)
          finalminutes = (Number(mminutes) + Number(lastfinal)) - (parseInt(mfinalminutes.toString()) * 60)


          console.log("finalminutes record ", finalminutes)

        }
        let mminuted = String(Number(finalminutes))
        if (mminuted.length == 1) {
          mminuted = "0" + mminuted
        }

        let mhr = String(Number(finalhours))
        if (mhr.length == 1) {
          mhr = "0" + mhr
        }
        let end_time = mhr + ":" + mminuted

        const midsch = await getNextSequenceValue(
          `${table.scheduler}`);

        let mschedular = {
          id: midsch,
          end_date: `${mfinalDate}`,
          start_date: `${mstartdate}`,
          start_time: mstarthr,
          end_time: end_time,
          quote_id: quote_id,
          status: mstatus,
          artist_id: showTable.profile_id,
          show_id: showTable.id,
          description: showTable.title ? `headed to a show for ` + showTable.title : ""
        };

        const vqueue = new scheduleModal(mschedular);
        await vqueue
          .save()
          .then(async (result: any) => {
            /**
            * @desc insert ok
            * */
            if (result) {
              // if (mcount == (showTable.length)) {
              resolve(true)
              // }
            } else {
              resolve(true)
            }
          }).catch((error) => {
            /**
            * @return
            * */
            resolve(true)
          });
        //END//
        // }
        // catch error on event update
        // } else {
        //   resolve(true)
        // }
      } else {
        resolve(true)
      }
    }
    catch (error) {
      /**
      * @return
      * catch error is send out here
      * */
      resolve(true)
    }
  })
}





async function mHttpRequestProfile(profile: any) {
  // deno-lint-ignore no-async-promise-executor
  return new Promise(async (resolve, reject) => {

    const columns = {
      id: 1,
      email: 1,
      msisdn: 1,
      last_name: 1,
      first_name: 1,
      profile_url: 1,
      gender: 1,
      category: 1,
    };
    let userTable;

    userTable = await userModel.findOne(
      { id: profile },
      columns
    );



    resolve(userTable);
  });
}


