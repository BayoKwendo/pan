import { arrayCrowd, arrayListBudget, eventStatus, getNextSequenceValue, mHttpRequestTag, project_folder } from "./../helpers/index";
import {
  eventModal,
  messageModal,
  scheduleModal,
  showEventModal,
  showModal,
  subSubTagModal,
  subTagModal,
  table,
  tagModal,
  userModel,
} from "../helpers/schema";
import mongoose from 'mongoose';
import dotenv from "dotenv";
import logger from "../middlewares/logger";
import fs from "fs";
import AWS from "aws-sdk";

dotenv.config(); // iniatilized configs here

export default {
  /**
  * consume the CSVs post request
  * @function postUpload */
  getCrowd: async (req: any, res: any) => {
    logger.info(`/POST upload`);

    try {


      res.status(200).send({
        Status: true,
        StatusCode: 0,
        Crowd: arrayCrowd,
        StatusMessage: `Success`
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
  * consume the CSVs post request
  * @function getBudgetList */
  getBudget: async (req: any, res: any) => {
    logger.info(`/POST upload`);

    try {

      res.status(200).send({
        Status: true,
        StatusCode: 0,
        Budget: arrayListBudget,
        StatusMessage: `Success`
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
  * @name addShow config table
  *
  * * */
  addShow: async (req: any, res: any) => {
    logger.info(`/POST show`);

    try {
      const body = await req.body;

      let mrole_id = req.locals.id;

      let mrole = req.locals.role;

      /**
      * @desc variable declaration
      * @name insertShow
      * @name errorCheck
      * @desc query to insert event values to @name show table
      * @const insertShow table values
      * */

      // let mrole = req.locals.role;
      let show_path = project_folder + "/" + req.files.show_url[0].filename;

      // const applicant_photo = Date.now() + data.files[0].originalName;
      if (mrole == "artist") {
        if (body.tags) {
          let mtag = JSON.parse(body.tags.replaceAll("'", "").replaceAll('"', ''))
          let mtagFind = await subSubTagModal.find({ id: { $in: mtag } });
          if (mtagFind.length > 0) {
            // await eventModal.find({ id: `${body.event_id}` }).then(async (result: any) => {
            //     if (result && result.length > 0) { // event is found
            const accessKeyId = `${process.env.AWS_ACCESS_KEY_ID}`;
            const secretAccessKey = `${process.env.AWS_SECRET_ACCESS_KEY}`;
            const s3 = new AWS.S3({
              accessKeyId: accessKeyId,
              secretAccessKey: secretAccessKey,
            });

            const blob = fs.readFileSync(show_path);

            try {
              let mcrowd = JSON.parse(body.crowd_amount)

              const Bucket = `${process.env.S3_BUCKET}`;

              const uploadedImage = await s3
                .upload({
                  Bucket: Bucket,
                  Key: req.files.show_url[0].filename,
                  Body: blob,
                }).promise();
              fs.unlinkSync(show_path);
              const mid = await getNextSequenceValue(`${table.shows}`);
              let murl = uploadedImage.Location;
              let user = {
                id: mid,
                profile_id: mrole_id,
                title: `${body.title}`,
                event_id: `0`,
                description: `${body.description}`,
                includes: `${body.includes}`,
                show_type: `${body.show_type}`,
                age_restriction: `${body.age_restriction}`,
                duration: `${body.duration}`,
                url: `${murl}`,
                price: `${body.price}`,
                crowd_amount: `${body.crowd_amount}`,
                min_price: `${body.min_price}`,
                max_price: `${body.max_price}`,
                tags: `${body.tags}`,
              };
              const vqueue = new showModal(user);
              await vqueue
                .save()
                .then(async (result: any) => {
                  res.status(200).send({
                    Status: true,
                    StatusCode: 0,
                    StatusMessage: "הצלחת!",
                    Date: user,
                  });
                }).catch((error) => {
                  res.status(403).send({
                    Status: false,
                    StatusCode: 2,
                    StatusMessage: `${error}`,
                  });
                });
            } catch {
              res.status(400).send({
                Status: false,
                StatusCode: 1,
                StatusMessage: "Incorrect crowd amount inputs"
              })
            }
          } else {
            res.status(400).send({
              Status: false,
              StatusCode: 1,
              StatusMessage: "Tag not found"
            })
          }
        } else {
          res.status(400).send({
            Status: false,
            StatusCode: 1,
            StatusMessage: "Tag not found"
          })
        }

      } else {
        res.status(400).send({
          Status: false,
          StatusCode: 1,
          StatusMessage: "Unauthorized to add show",
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
  * @function getShowTable
  * */
  getShowTable: async (req: any, res: any) => {
    logger.info(`/GET show`);
    try {
      const body = await req.body;
      /**
      * @desc sql query get all the @name getShowTable
      * @desc fech by either @name status,active_status and @name id
      * */
      let id = req.query.id;
      let mdate = req.query.date;

      let active_status = req.query.active_status;
      let start_date = req.query.start_date;
      let end_date = req.query.end_date;
      // let budget = req.query.budget;
      let budget = req.query.budget;
      let mtagsearch = req.query.tags;
      let crowd_amount = req.query.crowd_amount;
      let mrole = req.locals.role;

      let show_type = ""
      if (mrole == "private_customer") {
        show_type = "private"
      }
      if (mrole == "business_customer") {
        show_type = "business"
      }
      if (mrole == "institutional_customer") {
        show_type = "institution"
      }

      // console.log("show tryp ", show_type)
      const filters = {
        created_on: {
          $gte: `${start_date}`,
          $lt: `${end_date}`,
        }
      };

      let getShowTable;
      const columns = {
        id: 1,
        profile_id: 1,
        event_id: 1,
        title: 1,
        description: 1,
        includes: 1,
        show_type: 1,
        age_restriction: 1,
        duration: 1,
        url: 1,
        price: 1,
        crowd_amount: 1,
        min_price: 1,
        max_price: 1,
        tags: 1,
        active_status: 1,
        created_on: 1,
        last_updated_on: 1,
      };
      if (req.locals.role == "artist") {
        let profile_id = req.locals.id;
        if (id) {
          getShowTable = await showModal.find(
            { profile_id: `${profile_id}`, id: `${id}` },
            columns
          );
        } else if (active_status && budget && start_date && end_date) {
          getShowTable = await showModal
            .find(
              {
                profile_id: `${profile_id}`,
                active_status: `${active_status}`,
                price: budget
              },
              columns
            ).where(filters);
        } else if (!active_status && budget && start_date && end_date) {
          getShowTable = await showModal
            .find({
              profile_id: `${profile_id}`, price: budget,
            }, columns).where(filters);
        } else if (!active_status && budget && !start_date && !end_date) {
          // console.log("test data here ", finalData)
          getShowTable = await showModal.find(
            {
              profile_id: `${profile_id}`, price: budget,
            },
            columns);
        } else if (active_status && !budget && !start_date && !end_date) {
          getShowTable = await showModal.find(
            { profile_id: `${profile_id}`, active_status: `${active_status}` },
            columns
          );
        } else if (active_status && !budget && start_date && end_date) {
          getShowTable = await showModal
            .find(
              {
                profile_id: `${profile_id}`,
                active_status: `${active_status}`,
              },
              columns
            ).where(filters);
        } else if (!active_status && !budget && start_date && end_date) {
          getShowTable = await showModal
            .find({ profile_id: `${profile_id}` }, columns)
            .where(filters);
        } else {
          getShowTable = await showModal.find(
            { profile_id: `${profile_id}` },
            columns
          );
        }
      } else if (req.locals.role == "admin") {
        if (id) {
          getShowTable = await showModal.find({ id: `${id}` }, columns);
        } else if (active_status && budget && start_date && end_date) {
          getShowTable = await showModal
            .find({
              active_status: `${active_status}`, price: budget,
            }, columns)
            .where(filters);
        } else if (!active_status && budget && start_date && end_date) {
          getShowTable = await showModal
            .find({
              price: budget,
            }, columns)
            .where(filters);
        } else if (!active_status && budget && !start_date && !end_date) {
          getShowTable = await showModal.find({
            price: budget
          }, columns);
        } else if (active_status && !budget && !start_date && !end_date) {
          getShowTable = await showModal.find(
            { active_status: `${active_status}` },
            columns
          );
        } else if (active_status && !budget && start_date && end_date) {
          getShowTable = await showModal
            .find({ active_status: `${active_status}` }, columns)
            .where(filters);
        } else if (!active_status && !budget && start_date && end_date) {
          getShowTable = await showModal.find({}, columns).where(filters);
        } else if (!active_status && !budget && !start_date && !end_date) {
          getShowTable = await showModal.find({}, columns);
        } else {
          getShowTable = await showModal.find({}, columns);
        }
      }
      else {

        if (id) {
          getShowTable = await showModal.find({ id: `${id}`, show_type: `${show_type}` }, columns);
        } else if (active_status && budget && start_date && end_date) {
          getShowTable = await showModal
            .find({
              active_status: `${active_status}`, price: budget, show_type: `${show_type}`
            }, columns)
            .where(filters);
        } else if (!active_status && budget && start_date && end_date) {
          getShowTable = await showModal
            .find({
              price: budget, show_type: `${show_type}`
            }, columns)
            .where(filters);
        } else if (!active_status && budget && !start_date && !end_date) {
          getShowTable = await showModal.find({
            price: budget, show_type: `${show_type}`
          }, columns);
        } else if (active_status && !budget && !start_date && !end_date) {
          getShowTable = await showModal.find(
            { active_status: `${active_status}`, show_type: `${show_type}` },
            columns
          );
        } else if (active_status && !budget && start_date && end_date) {
          getShowTable = await showModal
            .find({ active_status: `${active_status}`, show_type: `${show_type}` }, columns)
            .where(filters);
        } else if (!active_status && !budget && start_date && end_date) {
          getShowTable = await showModal.find({ show_type: `${show_type}` }, columns).where(filters);
        } else if (!active_status && !budget && !start_date && !end_date) {
          getShowTable = await showModal.find({ show_type: `${show_type}` }, columns);
        } else {
          getShowTable = await showModal.find({ show_type: `${show_type}` }, columns);
        }
      }


      let intersection = Array()

      let finalData = Array();
      let m_tag_temp, m_tag_temp_2
      if (getShowTable.length > 0) {
        for (let i = 0; i < getShowTable.length; i++) {
          const mschedule = await mHttpRequestSchedule(getShowTable[i].profile_id);

          console.log("test test ", mschedule)

          if (req.locals.role == "artist" || req.locals.role == "admin" || (mschedule === undefined || mschedule === null)) {
            console.log("inside test ", mschedule)
            const b = await mHttpRequestProfile(getShowTable[i]);
            const shows = await mHttpRequests(getShowTable[i]);
            let mevent = { artist: b };
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
              mtag_diff,
              mmax_price,
              m_crowd_amount,
              m_price,
              mmin_price,
              m_active_status,
              m_created_on,
              m_last_updated_on;
            if (b) {
              if (getShowTable[i] && getShowTable[i].id) {
                m_id = { _id: getShowTable[i]._id };
              }
              if (getShowTable[i] && getShowTable[i].id) {
                mid = { id: getShowTable[i].id };
              }
              if (getShowTable[i] && getShowTable[i].profile_id) {
                m_profile_id = { profile_id: getShowTable[i].profile_id };
              }
              if (getShowTable[i] && getShowTable[i].event_id) {
                m_event_id = { event_id: getShowTable[i].event_id };
              }
              if (getShowTable[i] && getShowTable[i].title) {
                m_title = { title: getShowTable[i].title };
              }
              if (getShowTable[i] && getShowTable[i].description) {
                m_description = { description: getShowTable[i].description };
              }
              if (getShowTable[i] && getShowTable[i].includes) {
                m_includes = { includes: getShowTable[i].includes };
              }
              if (getShowTable[i] && getShowTable[i].show_type) {
                m_show_type = { show_type: getShowTable[i].show_type };
              }
              if (getShowTable[i] && getShowTable[i].age_restriction) {
                m_age_restriction = {
                  age_restriction: getShowTable[i].age_restriction,
                };
              }
              if (getShowTable[i] && getShowTable[i].duration) {
                m_duration = { duration: getShowTable[i].duration };
              }
              if (getShowTable[i] && getShowTable[i].url) {
                m_url = { url: getShowTable[i].url };
              }
              if (getShowTable[i] && getShowTable[i].price) {
                m_price = { price: getShowTable[i].price };
              }
              if (getShowTable[i] && getShowTable[i].max_price) {
                mmax_price = { max_price: getShowTable[i].max_price };
              }
              if (getShowTable[i] && getShowTable[i].min_price) {
                mmin_price = { min_price: getShowTable[i].min_price };
              }
              if (getShowTable[i] && getShowTable[i].tags) {

                let tempTag = getShowTable[i].tags

                mtag_diff = { mtag_diff: intersection }
                tempTag = tempTag.toString().replaceAll("'", "").replaceAll('"', '').trim()
                m_tag_temp = { tag_temp: tempTag };
                try {

                  let mtag_for_search = tempTag

                  let mtag = JSON.parse(tempTag.toString())

                  if (mtagsearch) {

                    m_tag_temp_2 = mtag.sort((a: number, b: number) => {
                      return a - b;
                    })
                    mtag_for_search = mtag
                    let array1 = mtag_for_search
                    let array2 = JSON.parse(mtagsearch)
                    intersection = array1.filter((element: any) => array2.includes(element));  // filter out the two array to find the common element between them
                    mtag = intersection
                    mtag_diff = { mtag_diff: intersection }
                    let tempTags = mtagsearch
                    tempTags = tempTags.toString().replaceAll("'", "").replaceAll('"', '').trim()
                    mtagsearch = JSON.stringify(JSON.parse(tempTags.toString()).sort((a: number, b: number) => {
                      return a - b;
                    }))
                    mtag = intersection
                  }
                  if (mtag) {
                    const mcolumnssub = {
                      _id: 0,
                      sub_tag_id: 1
                    };
                    await subSubTagModal.find({ id: { $in: mtag } }, mcolumnssub).distinct("sub_tag_id").then(async (subSubResp) => {
                      // console.log("sub response ", subSubResp)
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
                } catch (error) {
                  console.log("error ", error)
                  m_tags = { tags: tempTag };
                }
              }
              if (getShowTable[i] && getShowTable[i].active_status) {
                m_active_status = { active_status: getShowTable[i].active_status };
              }
              if (getShowTable[i] && getShowTable[i].last_updated_on) {
                m_last_updated_on = {
                  last_updated_on: getShowTable[i].last_updated_on,
                };
              }
              if (getShowTable[i] && getShowTable[i].created_on) {
                m_created_on = { created_on: getShowTable[i].created_on };
              }

              if (getShowTable[i] && getShowTable[i].crowd_amount) {
                try {
                  m_crowd_amount = { crowd_amount: JSON.parse(getShowTable[i].crowd_amount) };
                } catch {
                  m_crowd_amount = { crowd_amount: getShowTable[i].crowd_amount };

                }
              }
              //filter crowd_amount array
              if (crowd_amount) {
                try {
                  let mcrowd = JSON.parse(getShowTable[i].crowd_amount)
                  let search = mcrowd.includes(crowd_amount)
                  if (search) {
                    finalData.push(
                      Object.assign(
                        m_id,
                        mid,
                        m_profile_id,
                        m_event_id,
                        m_title,
                        m_description,
                        m_includes,
                        m_duration,
                        m_tag_temp,
                        m_tags,
                        mtag_diff,
                        m_show_type,
                        m_age_restriction,
                        m_url,
                        m_crowd_amount,
                        m_price,
                        mmax_price,
                        mmin_price,
                        m_active_status,
                        mevent,
                        shows,
                        m_created_on,
                        m_last_updated_on
                      )
                    );
                  }
                } catch {
                  if (getShowTable[i].crowd_amount == crowd_amount) {
                    finalData.push(
                      Object.assign(
                        m_id,
                        mid,
                        m_profile_id,
                        m_event_id,
                        m_title,
                        m_description,
                        m_includes,
                        m_duration,
                        m_tag_temp,
                        m_tags,
                        mtag_diff,
                        m_show_type,
                        m_age_restriction,
                        m_url,
                        m_crowd_amount,
                        m_price,
                        mmax_price,
                        mmin_price,
                        m_active_status,
                        mevent,
                        shows,
                        m_created_on,
                        m_last_updated_on
                      )
                    );
                  }
                  //   m_crowd_amount = { crowd_amount: getShowTable[i].crowd_amount };
                }
              } else {
                finalData.push(
                  Object.assign(
                    m_id,
                    mid,
                    m_profile_id,
                    m_event_id,
                    m_title,
                    m_description,
                    m_includes,
                    m_duration,
                    m_tag_temp,
                    m_tags,
                    mtag_diff,
                    m_show_type,
                    m_age_restriction,
                    m_url,
                    m_crowd_amount,
                    m_price,
                    mmax_price,
                    mmin_price,
                    m_active_status,
                    mevent,
                    shows,
                    m_created_on,
                    m_last_updated_on
                  )
                );
              }
            }
          }
        }
      }

      // deno-lintss-ignore no-explicit-any
      // deno-lint-ignore no-inner-declarations
      async function mHttpRequests(shows: any) {
        // deno-lint-ignore no-async-promise-executor
        // for return of events
        return new Promise(async (resolve, reject) => {
          let getEventTable;
          let muser;
          const mcolumns = {
            _id: 0,
            event_id: 1,
          };
          let mshowsevents = await showEventModal
            .find({ show_id: shows.id }, mcolumns)
            .distinct("event_id");
          getEventTable = await eventModal.find({ id: { $in: mshowsevents } });
          let finalData = Array();
          if (getEventTable && getEventTable.length > 0) {
            for (let i = 0; i < getEventTable.length; i++) {
              let mEventObject = { object_id: getEventTable[i]._id };
              let mEventID = { id: getEventTable[i].id };
              let mprofile_id = { profile_id: getEventTable[i].profile_id };
              let mname = { name: getEventTable[i].name };
              let mdate = { date: getEventTable[i].date };
              let mtime = { time: getEventTable[i].time };
              let mlocation = { location: getEventTable[i].location };

              let mcrowd_amount = { crowd_amount: getEventTable[i].crowd_amount };

              let mincrowd_amount = { min_crowd_amount: getEventTable[i].min_crowd_amount };

              let maxcrowd_amount = { max_crowd_amount: getEventTable[i].max_crowd_amount };

              let mbudget = { budget: getEventTable[i].budget };
              let martist_type = { artist_type: getEventTable[i].artist_type };
              let mevent_type = { event_type: getEventTable[i].event_type };

              let mmax_budget = { max_budget: getEventTable[i].max_budget };
              let mmin_budget = { min_budget: getEventTable[i].min_budget };

              let mage_restriction = {
                age_restriction: getEventTable[i].age_restriction,
              };
              let mnote = { note: getEventTable[i].note };
              const mstatus_event = await eventStatus(getEventTable[i].status)
              let mstatus = { status: mstatus_event };
              let mactive_status = { active_status: getEventTable[i].active_status };
              let mcreated_on = { created_on: getEventTable[i].created_on };
              let mlast_updated_on = {
                last_updated_on: getEventTable[i].last_updated_on,
              };
              let mShowID;
              // if (getEventTable[i].shows) { }
              finalData.push(
                Object.assign(
                  mEventObject,
                  mEventID,
                  mprofile_id,
                  mname,
                  mdate,
                  mtime,
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
          }
          let mshows = { events: finalData };
          resolve(mshows);
        });
      }
      // deno-lint-ignore no-inner-declarations
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
                gender: gender
              }, columns);
          }
          resolve(userTable);
        });
      }
      // deno-lint-ignore no-inner-declarations
      async function mHttpRequestSchedule(artist_id: any) {
        // deno-lint-ignore no-async-promise-execustor
        return new Promise(async (resolve, reject) => {
          let artistSchedule;
          var moment = require('moment');
          var datetime = moment(mdate).format('YYYY-MM-DD');
          var mtime = moment(mdate).format('HH:mm');
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
          // console.log(JSON.stringify(filters))
          artistSchedule = await scheduleModal.findOne({ artist_id: artist_id, active_status: 'unavailable' }).where(filters);
          resolve(artistSchedule);
        });
      }
      res.status(200).send({
        Status: true,
        StatusCode: 0,
        Name: "Shows",
        Data: mtagsearch ? finalData && finalData.length > 0 ? finalData.filter(x => x.mtag_diff.length > 0) : [] : finalData,
        /**
        *  @de(property) StatusCode: number
        sc User data display here 
        * */
        StatusMessage: "הצלחת!"
      });
    } catch (error) {
      /**
      * @returZn
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
  * @desc controller to add show values in the
  * @name updateShow config table
  * * */

  updateShow: async (req: any, res: any) => {
    logger.info(`/PUT show`);
    try {
      const body = await req.body;
      let mrole_id = req.locals.id;

      try {
        let mcrowd = JSON.parse(JSON.stringify(body.crowd_amount))
        console.log(mcrowd)
        let mmcrowd = JSON.stringify(body.crowd_amount)
        let mcrowgd = JSON.parse(mmcrowd)
        console.log()
        if (Array.isArray(mcrowgd)) {
          // let mrole = req.locals.role;
          let user = {
            profile_id: mrole_id,
            title: `${body.title}`,
            event_id: `0`,
            description: `${body.description}`,
            includes: `${body.includes}`,
            show_type: `${body.show_type}`,
            age_restriction: `${body.age_restriction}`,
            duration: `${body.duration}`,
            price: `${body.price}`,
            crowd_amount: `${mmcrowd}`,
            tags: `${body.tags}`,
          };
          await showModal
            .updateOne({ id: `${body.id}`, profile_id: `${mrole_id}` }, user, { new: true })
            .then(async (resp: any) => {
              if (resp.modifiedCount > 0) {
                /**
                * @desc updated ok
                * */
                res.status(200).send({
                  Status: true,
                  StatusCode: 0,
                  StatusMessage: "הצלחת!",
                })
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
            }).catch((error) => {
              res.status(403).send({
                Status: false,
                StatusCode: 2,
                StatusMessage: `${error}`,
              });
            });
        } else {
          res.status(400).send({
            Status: false,
            StatusCode: 1,
            StatusMessage: "Incorrect crowd amount inputs"
          })
        }
      } catch {
        res.status(400).send({
          Status: false,
          StatusCode: 1,
          StatusMessage: "Incorrect crowd amount inputs"
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
        StatusMessage: `${error}`,
      });
    }
  },

  updateShowImage: async (req: any, res: any) => {
    logger.info(`/PUT show`);
    try {
      const body = await req.body;
      let mrole_id = req.locals.id;
      /**
      * @desc variable declaration
      * @name insertShow
      * @name errorCheck
      * @desc query to update show values to @name show table
      * @const updateShow table values
      * */

      let show_path = project_folder + "/" + req.files.show_url[0].filename;

      // await eventModal.find({ id: `${body.event_id}` }).then(async (result: any) => {
      //     if (result && result.length > 0) { // event is found
      const accessKeyId = `${process.env.AWS_ACCESS_KEY_ID}`;
      const secretAccessKey = `${process.env.AWS_SECRET_ACCESS_KEY}`;
      const s3 = new AWS.S3({
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      });

      const blob = fs.readFileSync(show_path);

      const Bucket = `${process.env.S3_BUCKET}`;

      const uploadedImage = await s3
        .upload({
          Bucket: Bucket,
          Key: req.files.show_url[0].filename,
          Body: blob,
        }).promise();

      fs.unlinkSync(show_path);

      const mid = await getNextSequenceValue(`${table.shows}`);

      let murl = uploadedImage.Location;
      // let mrole = req.locals.role;      
      let user = {
        url: `${murl}`
      };
      console.log("hello ", user)
      await showModal
        .updateOne({ id: `${body.id}`, profile_id: `${mrole_id}` }, user, { new: true })
        .then(async (resp: any) => {
          console.log(resp)
          if (resp.modifiedCount > 0) {
            /**
            * @desc updated ok
            * */
            res.status(200).send({
              Status: true,
              StatusCode: 0,
              StatusMessage: "הצלחת!",
            })
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
        }).catch((error) => {
          res.status(403).send({
            Status: false,
            StatusCode: 2,
            StatusMessage: `${error}`,
          });
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
  * @desc active/ deactivate show profile
  * */
  /**
  * @name PUT
  * @desc controller to edit @name 4 values
  * @function updateShowStatus
  * */
  updateShowStatus: async (req: any, res: any) => {
    logger.info(`/PUT show`);
    try {
          const body = await req.body;

          let role = req.locals.role;

          // if (role =:'admin') {

          logger.info(body);
          /**
          * @const updateShowStatus query defined
          * @desc active_status is either @name inactive or @name active                                                                                                                                                                                                                                                                                         
          * */
          await showModal
            .updateOne(
              { id: `${body.id}` },
              { active_status: `${body.active_status}` },
              { new: true })
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
      * catch error is send oust here
      * */
      res.status(400).send({
        Status: false,
        StatusCode: 2,
        StatusMessage: `${error}`,
      });
    }
  },



  /**
  * @desc active/ deactivate show profile
  * */
  /**
  * @name PUT
  * @desc controller to edit @name updateShowStatus values
  * @function deleteShow
  * */
  deleteShow: async (req: any, res: any) => {
    logger.info(`/DELETE show`);
    try {
      const show_id = req.params.id

      let role = req.locals.role;

      let profile_id = req.locals.id;
      if (role == 'artist') {
        /**
        * @const updateShowStatus query defined
        * @desc active_status is either @name inactive or @name active
        * */
        await showModal.find(
          { profile_id: `${profile_id}`, id: `${show_id}` }).then(async (resp) => {
            if (resp.length > 0) {
              await showEventModal.deleteMany({ show_id: show_id })
                .then(async (result: any) => {
                  await showModal
                    .deleteOne({ id: `${show_id}` }, { new: true })
                    .then(async (resp: any) => {
                      if (resp.deletedCount > 0) {
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
                          StatusMessage: "אין שינוי בערך של השדה"
                        });
                      }
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
                StatusMessage: "Show not found",
              });
            }
          })
      } else {
        res.status(400).send({
          Status: false,
          StatusCode: 1,
          StatusMessage: "Unathorized",
        });
      }
    } catch (error) {
      /**
      * @return
      * catch error is send oust here
      * */
      res.status(400).send({
        Status: false,
        StatusCode: 2,
        StatusMessage: `${error}`,
      });
    }
  },
};