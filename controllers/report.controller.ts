import { showModal, userModel, showEventModal, eventNameSchema } from "../helpers/schema";
import { eventModal, table } from "../helpers/schema"; /**  eventModal, table */
import dotenv from "dotenv";
import logger from "../middlewares/logger";

dotenv.config(); // iniatilized configs here

export default {
  /**
      * @desc get Event
      * @function getEventReport
  * */
  getReport: async (req: any, res: any) => {
    logger.info(`/GET report`);
    try {
      const body = await req.body; // from the request body
      /**
      * @desc sql query get all the @name getReport
      * @desc fech by either @name status,active_status and @name id
      * */
      let id = req.query.id;
      let status = req.query.status;
      let role = req.query.role;
      let active_status = req.query.active_status;
      let getReport;
      let start_date = req.query.start_date;
      let end_date = req.query.end_date;
      //Month array
      const monthsArray = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      if (req.locals.role == "artist") {
        let profile_id = req.locals.id;
        const filters = {
          profile_id: profile_id,
          created_on: {
            $gte: new Date(`${start_date}`),
            $lt: new Date(`${end_date}`),
          },
        };
        getReport = eventModal.aggregate([
          {
            $match: filters
          },
          {
            $group:
            {
              _id: { "year_month": { $substrCP: ["$created_on", 0, 7] } },
              count: { $sum: 1 },
            }
          },
          {
            $sort: { "_id.year_month": 1 }
          },
          {
            $project: {
              _id: 0,
              count: 1,
              mobnth: {
                $arrayElemAt: [monthsArray, { $subtract: [{ $toInt: { $substrCP: ["$_id.year_month", 5, 2] } }, 1] }]
              },
              month: { $substrCP: ["$_id.year_month", 5, 2] },
              year: {
                $substrCP: ["$_id.year_month", 0, 4]
              }
            }
          }
        ]).then(result => {

          // if (result.length > 0) {
          let mresult = result.filter((r) => {
            return r.year == result[0].year;
          });

          const df = new Date(`${end_date}`);
          let ycear = df.getFullYear()

          let mnew = Array()
          let msales = Array.from(Array(12).keys(), month =>
            mresult.find(sale => +sale.month === month + 1) || {
              count: 0, month: ("0" + (month + 1)).substr(-2),
              year: mresult && mresult.length > 0 ? mresult[0].year : ycear
            }
          );

          let year = msales[0].year
          const d = new Date();

          let month = 11;
          let yearhm = d.getFullYear();
          if (year == yearhm) {
            month = d.getMonth()
          }

          for (let i = 0; i < monthsArray.length; i++) {
            for (let j = 0; j < month + 1; j++) {
              if (j == i) {
                mnew.push(Object.assign({ NoEvents: msales[j].count, Month: monthsArray[i] }))
              }
            }
          }

          getReport = eventModal.aggregate([
            {
              $match: filters
            },
            /**@desc for inner join user table */
            {
              $group:
              {
                _id: "$event_type",
                count: { $sum: 1 },
              }
            },
            {
              $project: {
                _id: 0,
                count: 1,
                event_typ: ["$_id"]
              }
            }
          ]).then(result => {
            let mnewEvent = Array()
            let mtotal = 0
            let mAvailable = Array()

            if (result.length != 3) {
              let mstart_length = 3 - result.length
              if (mstart_length > 0) {
                mAvailable = result
              }
            }

            if (result.length > 0) {
              mtotal = result[0].count + (result.length > 1 ? result[1].count : 0)
            }
            if (result.length == 1) {
              mtotal = result[0].count
            }
            // if (result.length > 0) {
            for (let i = 0; i < 2; i++) {
              if (result.length == 1) {
                if (i == 0) {
                  mnewEvent.push(Object.assign({
                    count: result[i].count,
                    percentage: (result[i].count / mtotal * 100).toFixed(2),
                    event_category: result[i].event_typ[0]
                  }))
                } else {
                  mnewEvent.push(Object.assign({ count: 0, percentage: 0, event_category: result[0].event_typ[0] == 'private' ? 'business' : 'private' }))
                }
              } else {
                mnewEvent.push(Object.assign({
                  count: result.length > 0 ? result[i].count : 0, percentage: (result.length > 0 ? (result[i].count / mtotal * 100) : 0).toFixed(2),
                  event_category: result.length > 0 ? result[i].event_typ[0] : i == 0 ? 'business' : 'private'
                }))
              }
            }
            // }
            res.status(200).send({
              Status: true,
              StatusCode: 0,
              Name: "Report",
              EventPercentage: mnewEvent,
              Event: {
                Year: year,
                Data: mnew
              },
              /**
              * @desc User data display here 
              * */
              StatusMessage: "הצלחת!"
            });
            // }
          })
        }).catch(error => {
        })
      }
      // check if its admin role
      else if (req.locals.role == "admin") {
        const filters = {
          created_on: {
            $gte: new Date(`${start_date}`),
            $lt: new Date(`${end_date}`),
          },
        };
        getReport = eventModal.aggregate([
          {
            $match: filters
          },
          {
            $group:
            {
              _id: { "year_month": { $substrCP: ["$created_on", 0, 7] } },
              count: { $sum: 1 },
            }
          },
          {
            $sort: { "_id.year_month": 1 }
          },
          {
            $project: {
              _id: 0,
              count: 1,
              mobnth: {
                $arrayElemAt: [monthsArray, { $subtract: [{ $toInt: { $substrCP: ["$_id.year_month", 5, 2] } }, 1] }]
              },
              month: { $substrCP: ["$_id.year_month", 5, 2] },
              year: {
                $substrCP: ["$_id.year_month", 0, 4]
              }
            }
          },
        ]).then(result => {
          // if (result.length > 0) {
          let mresult = result.filter((r) => {
            return r.year == result[0].year;
          });

          const df = new Date(`${end_date}`);
          let ycear = df.getFullYear()

          let mnew = Array()
          let msales = Array.from(Array(12).keys(), month =>
            mresult.find(sale => +sale.month === month + 1) || {
              count: 0, month: ("0" + (month + 1)).substr(-2),
              year: mresult && mresult.length > 0 ? mresult[0].year : ycear
            }
          );

          let year = msales[0].year
          const d = new Date();
          let month = 11;
          let yearhm = d.getFullYear();
          if (year == yearhm) {
            month = d.getMonth()
          }
          for (let i = 0; i < monthsArray.length; i++) {
            for (let j = 0; j < month + 1; j++) {
              if (j == i) {
                mnew.push(
                  Object.assign({ NoEvents: msales[j].count, Month: monthsArray[i] }))
              }
            }
          }
          userModel.aggregate([
            {
              $match: {
                created_at: {
                  $gte: new Date(`${start_date}`),
                  $lt: new Date(`${end_date}`)
                }
              }
            },
            {
              $group:
              {
                _id: { "year_month": { $substrCP: ["$created_at", 0, 7] } },
                count: { $sum: 1 },
              }
            },
            {
              $sort: { "_id.year_month": 1 }
            },
            {
              $project: {
                _id: 0,
                count: 1,
                mobnth: {
                  $arrayElemAt: [monthsArray, { $subtract: [{ $toInt: { $substrCP: ["$_id.year_month", 5, 2] } }, 1] }]
                },
                month: { $substrCP: ["$_id.year_month", 5, 2] },
                year: {
                  $substrCP: ["$_id.year_month", 0, 4]
                }
              }
            }
          ]).then(mresultU => {
            // if (result.length > 0) {
            let mresultUser = mresultU.filter((r) => {
              return r.year == mresultU[0].year;
            });

            const df = new Date(`${end_date}`);
            let ycear = df.getFullYear()

            let mnewUser = Array()
            let msalesUser = Array.from(Array(12).keys(), month =>
              mresultUser.find(sale => +sale.month === month + 1) || {
                count: 0, month: ("0" + (month + 1)).substr(-2),
                year: mresultUser && mresultUser.length > 0 ? mresultUser[0].year : ycear
              });
            let user_year = msalesUser[0].year
            const d = new Date();
            let monthm = 11;
            let yearhm = d.getFullYear();

            // if(year == 202)
            if (user_year == yearhm) {
              monthm = d.getMonth()
            }

            for (let i = 0; i < monthsArray.length; i++) {
              for (let j = 0; j < monthm + 1; j++) {
                if (j == i) {
                  mnewUser.push(
                    Object.assign({
                      NoUsers: msalesUser[j].count,
                      Month: monthsArray[i]
                    }))
                }
              }
            }
            getReport = eventModal.aggregate([
              {
                $match: filters
              },
              /**@desc for inner join user table */
              {
                $group:
                {
                  _id: "$event_type",
                  count: { $sum: 1 },
                }
              },
              {
                $project: {
                  _id: 0,
                  count: 1,
                  event_typ: ["$_id"]
                }
              }
            ]).then(result => {
              let mnewEvent = Array()
              let mtotal = 0
              let mAvailable = Array()

              if (result.length != 3) {
                let mstart_length = 3 - result.length
                if (mstart_length > 0) {
                  mAvailable = result
                }
              }
              if (result.length > 0) {
                mtotal = result[0].count + (result.length > 1 ? result[1].count : 0)
              }
              if (result.length == 1) {
                mtotal = result[0].count
              }

              // if (result.length > 0) {
              for (let i = 0; i < 2; i++) {
                if (result.length == 1) {
                  if (i == 0) {
                    mnewEvent.push(Object.assign({
                      count: result[i].count,
                      percentage: (result[i].count / mtotal * 100).toFixed(2),
                      event_category: result[i].event_typ[0]
                    }))
                  } else {
                    mnewEvent.push(Object.assign({ count: 0, percentage: 0, event_category: result[0].event_typ[0] == 'private' ? 'business' : 'private' }))
                  }
                } else {
                  mnewEvent.push(Object.assign({
                    count: result.length > 0 ? result[i].count : 0, percentage: (result.length > 0 ? (result[i].count / mtotal * 100) : 0).toFixed(2),
                    event_category: result.length > 0 ? result[i].event_typ[0] : i == 0 ? 'business' : 'private'
                  }))
                }
              }
              // }
              res.status(200).send({
                Status: true,
                StatusCode: 0,
                Name: "Report",
                EventPercentage: mnewEvent,
                Event: {
                  Year: year,
                  Data: mnew
                },
                User: {
                  Year: user_year,
                  Data: mnewUser
                },
                /**
                * @desc User data display here 
                * */
                StatusMessage: "הצלחת!"
              });
            })
            // }
          })
        }).catch(error => { })
      } else {
        res.status(400).send({
          Status: false,
          StatusCode: 2,
          Name: "Report",
          StatusMessage: "Only admin can view report"
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
  }
};
