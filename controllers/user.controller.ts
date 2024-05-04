import { forgotPasswordMessage } from './../helpers/config';
import { dbQueueModel, tagModal } from '../helpers/schema';
import { otpMessage } from '../helpers/config';
import { table, userModel, verificationModel } from "../helpers/schema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
import logger from "../middlewares/logger";
import { emailSent, findCode, forgotPWD, getNextSequenceValue, project_folder } from "../helpers";
import util from 'util';
import client from '../db/redis';
import fs from "fs";
import AWS from "aws-sdk";
dotenv.config(); // iniatilized configs here


export default {

    /**
    * @name POST 
    * @desc controller to add   user values in the 
    * @name addUser config table
    * 
    * */
    addUser: async (req: any, res: any) => {
        logger.info(`/POST user`);

        try {
            const mbody = await req.body;

            /**
            * @desc variable declaration 
            * @name insertUser
            *  @name errorCheck
            */
            let errorCheck = true;


            const otp = mbody.otp

            logger.info("get user details", mbody)
            /**
            * 
            * @desc query to insert user values to @name user table
            * @const insertUser table values  
            *   
            * */
            // redis retrieve

            let msisdn_temp = String(parseInt(mbody.msisdn))
            const fuga = await client.hGetAll(msisdn_temp);

            const body = JSON.parse(fuga.signup_details)


            logger.info("body check ", body)

            let mfrequency_now = ((Date.now() / 1000))  // five minutes added to current time


            let insertUser: any;

            // await verificationModel.findOne({ code: `${otp}` }).then(async (result: any) => {
            //     /**
            //     * @desc  error login , empy Array is sent out
            //     * */

            //     if (result && result.code) {

            //         await verificationModel.find({ status: 0, msisdn: `${msisdn_temp}`, code: `${otp}`, expired: { $gt: `${mfrequency_now}` } })
            //             .then(async (resultVerified: any) => {

            //                 if (resultVerified.length == 0) {
            //                     res.status(400).send({
            //                         Status: false,
            //                         StatusCode: 2,
            //                         StatusMessage: "הקוד לא בתוקף"
            //                     })
            //                 } else {`

            //                     await verificationModel.updateOne({ id: `${result.id}` }, { status: 1 }, { new: true }).then(async (updated: any) => {

            const hash_password = await bcrypt.hash(body.password, 10)

            const mid = await getNextSequenceValue(`${table.users}`)

            if (body.role == 'artist') {
                /**
                    * @desc variable validation check of artists role 
                * */
                insertUser = {
                    id: mid,
                    first_name: `${body.first_name}`,
                    last_name: `${body.last_name}`,
                    email: `${body.email}`,
                    msisdn: `${msisdn_temp}`,
                    stage_name: `${body.stage_name}`,
                    presented_office: `${body.presented_office}`,
                    gender: `${body.gender}`,
                    occupation: `${body.occupation}`,
                    organization_number: `${body.organization_number}`,
                    business_address: `${body.business_address}`,
                    category: `${body.category}`,
                    role: `${body.role}`,
                    password: `${hash_password}`,
                    active_status: 'inactive',
                    status: 'pending'
                };
            }
            //for role private customer
            else if (body.role == 'private_customer') {
                insertUser = {
                    id: mid,
                    first_name: `${body.first_name}`,
                    last_name: `${body.last_name}`,
                    email: `${body.email}`,
                    msisdn: `${msisdn_temp}`,
                    occupation: `${body.occupation}`,
                    role: `${body.role}`,
                    password: `${hash_password}`,
                    active_status: 'active',
                    status: 'approved'
                };
            }
            // for business
            else if (body.role == 'business_customer' || body.role == 'institutional_customer') {
                insertUser = {
                    id: mid,
                    first_name: `${body.first_name}`,
                    last_name: `${body.last_name}`,
                    email: `${body.email}`,
                    msisdn: `${msisdn_temp}`,
                    occupation: `${body.occupation}`,
                    other_msisdn: `${body.other_msisdn}`,
                    organization_name: `${body.organization_name}`,
                    business_number: `${body.business_number}`,
                    business_address: `${body.business_address}`,
                    department: `${body.department}`,
                    role: `${body.role}`,
                    password: `${hash_password}`,
                    active_status: 'active',
                    status: 'approved'
                };
            }
            // admin add
            else if (body.role == 'admin') {
                insertUser = {
                    id: mid,
                    first_name: `${body.first_name}`,
                    last_name: `${body.last_name}`,
                    email: `${body.email}`,
                    msisdn: `${msisdn_temp}`,
                    role: `${body.role}`,
                    password: `${hash_password}`,
                    active_status: 'active',
                    status: 'approved'
                };
            }
            else {
                errorCheck = false
                let error = {
                    role: `Unknown role ${body.role}`
                }
                res.status(403).send({
                    Status: false,
                    StatusCode: 2,
                    errors: error,
                    StatusMessage: `Unknown role ${body.role}`
                })
            }

            if (errorCheck) {

                const vqueue = new userModel(insertUser);

                await userModel.find({ msisdn: `${msisdn_temp}` }).then(async (result: any) => {

                    if (result && result.length > 0) {

                        res.status(403).send({
                            Status: false,
                            StatusCode: 2,
                            StatusMessage: `טלפון קיים במערכת. השתמש בטלפון אחר`
                        })
                    }
                    else {
                        await userModel.find({ email: `${body.email}` }).then(async (result: any) => {


                            if (result && result.length > 0) {

                                res.status(403).send({
                                    Status: false,
                                    StatusCode: 2,
                                    StatusMessage: `Email exists`
                                })
                            }
                            else {

                                await vqueue.save().then(async (reSp: any) => {
                                    /**
                                    * @desc  error inserting user, empy Array is sent out
                                    * @desc inserted ok 
                                    * */


                                    await userModel.find({ msisdn: `${msisdn_temp}` }).then(async (result: any) => {



                                        if (result && result.length > 0) {
                                            // if (result[0].active_status == 'active') {
                                            //     if (result[0].status == 'approved') {
                                            const isPasswordValid = await bcrypt.compare(body.password, result[0].password);
                                            if (!isPasswordValid) {

                                                let error = {
                                                    password: "Invalid Password",
                                                }
                                                res.status(400).send({
                                                    Status: false,
                                                    StatusCode: 2,
                                                    errors: error,
                                                    StatusMessage: "Invalid Password"
                                                })

                                            } else {
                                                const val = await findCode();

                                                let mfrequency = ((Date.now() / 1000) + (1 * 1 * 2 * 60))  // two minutes added to current time

                                                let mfrequency_now = ((Date.now() / 1000))  // two minutes added to current time

                                                let message = util.format(otpMessage, val)
                                                let subject = "OTP verification"

                                                await emailSent(message, subject, result[0].email)
                                                // let message = format(text, val)

                                                const mid = await getNextSequenceValue(`${table.db_queue}`)
                                                const queue = new dbQueueModel({ id: mid, msisdn: `${msisdn_temp}`, message: `${message}` });
                                                // CounterSchema
                                                queue.markModified(`${table.db_queue}`);

                                                await queue.save()
                                                    .then(async (data) => {

                                                        const insertVerification = {
                                                            msisdn: `${msisdn_temp}`,
                                                            email: `${result[0].email}`,
                                                            code: `${val}`,
                                                            expired: `${mfrequency}`,
                                                            created: `${mfrequency_now}`
                                                        };


                                                        const vqueue = new verificationModel(insertVerification);

                                                        await vqueue.save().then(async (dbResult: any) => {


                                                            let mremember = "false"
                                                            if (body.remember_me) {
                                                                mremember = body.remember_me
                                                            }
                                                            let msisdn_temp = String(result[0].msisdn.toString())
                                                            await client.hSet(msisdn_temp, `remember_me_check`, mremember.toString());
                                                            await client.hSet(msisdn_temp, `login_detail_password`, body.password);
                                                            await client.hSet(msisdn_temp, `login_details`, JSON.stringify(result[0]));

                                                            let user = {
                                                                _id: result[0]._id,
                                                                id: result[0].id,
                                                                first_name: result[0].first_name,
                                                                last_name: result[0].last_name,
                                                                email: result[0].email,
                                                                msisdn: result[0].msisdn.toString(),
                                                                other_msisdn: result[0].other_msisdn,
                                                                organization_name: result[0].organization_name,
                                                                business_number: result[0].business_number,
                                                                organization_number: result[0].organization_name,
                                                                business_address: result[0].business_address,
                                                                department: result[0].department,
                                                                occupation: result[0].occupation,
                                                                stage_name: result[0].stage_name,
                                                                status: result[0].status,
                                                                presented_office: result[0].presented_office,
                                                                gender: result[0].gender,
                                                                category: result[0].category,
                                                                active_status: result[0].active_status,
                                                                role: result[0].role
                                                            }
                                                            let token_expiry = `${process.env.TOKEN_EXPIRY}`

                                                            let mremeber_me = fuga.remember_me_check

                                                            if (mremeber_me == 'true' || mremeber_me === "true") {
                                                                token_expiry = `${process.env.REFREST_TOKE_EXPIRY}`
                                                            }

                                                            // remember_me
                                                            /**
                                                            * @desc  create token 
                                                            * */
                                                            const token = jwt.sign(user,
                                                                `${process.env.JWT_SECRET}`, {
                                                                expiresIn: token_expiry
                                                            });

                                                            const refreshToken = jwt.sign(user, `${process.env.JWT_REFRESH}`, {
                                                                expiresIn: `${process.env.REFREST_TOKE_EXPIRY}`,
                                                            });


                                                            let msisdn_tem = String(result[0].msisdn.toString())

                                                            await client.hSet(msisdn_tem, `refresh_token_set`, refreshToken);

                                                            res.status(200).send({
                                                                Status: true,
                                                                StatusCode: 0,
                                                                Token: token,
                                                                RefreshToken: refreshToken,
                                                                PayLoad: user,
                                                                StatusMessage: "הצלחת!"
                                                            })
                                                        }).catch(error => {
                                                            /**
                                                               * @return 
                                                               * catch error is send out here 
                                                            * */
                                                            res.status(400).send({
                                                                Status: false,
                                                                StatusCode: 2,
                                                                StatusMessage: `${error}`
                                                            })
                                                            // })
                                                        })
                                                    }).catch(error => {
                                                        /**
                                                        * @return 
                                                        * catch error is send out here 
                                                        * */
                                                        res.status(400).send({
                                                            Status: false,
                                                            StatusCode: 2,
                                                            StatusMessage: `${error}`
                                                        })
                                                    })
                                            }
                                        } else {

                                            let error = {
                                                profile: "הפרופיל לא אושר",
                                            }
                                            res.status(400).send({
                                                Status: false,
                                                StatusCode: 2,
                                                errors: error,
                                                StatusMessage: "הפרופיל לא אושר"
                                            })
                                        }
                                    })
                                }).catch((error) => {
                                    /**
                                    * @return 
                                    * catch error is send out here 
                                    * */
                                    res.status(400).send({
                                        Status: false,
                                        StatusCode: 2,
                                        StatusMessage: `${error}`
                                    })
                                })
                            }

                        })
                    }
                })
            }
            //                     }).catch((error) => {
            //                         /**
            //                         * @return 
            //                         * catch error is send out here 
            //                         * */
            //                         res.status(400).send({
            //                             Status: false,
            //                             StatusCode: 2,
            //                             StatusMessage: `${error}`
            //                         })
            //                     })
            //                 }
            //             })
            //     }
            // }).catch((error) => {
            //     /**
            //     * @return 
            //     * catch error is send out here 
            //     * */
            //     res.status(400).send({
            //         Status: false,
            //         StatusCode: 2,
            //         StatusMessage: "הקוד לא תקין"
            //     })
            // })
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
    * @desc @name resentSendUser controller
    */
    resentSendUser: async (req: any, res: any) => {

        logger.info(`/POST otp user send`);
        try {
            const body = await req.body;

            let msisdn_temp = String(parseInt(body.msisdn))
            const fuga = await client.hGetAll(msisdn_temp);

            if (fuga.signup_details) {

                const mbody = JSON.parse(fuga.signup_details)

                const val = await findCode();

                let mfrequency = ((Date.now() / 1000) + (1 * 1 * 2 * 60))  // two minutes added to current time

                let mfrequency_now = ((Date.now() / 1000))  // two minutes added to current time

                let message = util.format(otpMessage, val)
                let subject = "OTP verification"

                await emailSent(message, subject, mbody.email)
                // let message = format(text, val)



                const mid = await getNextSequenceValue(`${table.db_queue}`)
                const queue = new dbQueueModel({ id: mid, msisdn: `${msisdn_temp}`, message: `${message}` });
                // CounterSchema
                queue.markModified(`${table.db_queue}`);

                await queue.save()
                    .then(async (data) => {
                        const insertVerification = {
                            msisdn: `${msisdn_temp}`,
                            email: `${mbody.email}`,
                            code: `${val}`,
                            expired: `${mfrequency}`,
                            created: `${mfrequency_now}`
                        };
                        const vqueue = new verificationModel(insertVerification);
                        await vqueue.save().then(async (dbResult: any) => {
                            res.status(200).send({
                                Status: true,
                                StatusCode: 0,
                                StatusMessage: `הקוד נשלח בהצלחה!`
                            })
                        }).catch(error => {
                            /**
                            * @return 
                            * catch error is send out here 
                            * */
                            res.status(400).send({
                                Status: false,
                                StatusCode: 2,
                                StatusMessage: `${error}`
                            })
                            // })
                        })
                    }).catch(error => {
                        /**
                        * @return 
                        * catch error is send out here 
                        * */
                        res.status(400).send({
                            Status: false,
                            StatusCode: 2,
                            StatusMessage: `${error}`
                        })
                    })
            } else {
                res.status(400).send({
                    Status: false,
                    StatusCode: 2,
                    StatusMessage: "Record not found"
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


    /**
    * @name POST 
    * @desc controller to  send user values in the 
    * @name signup OTP config table
    * 
    * */
    sendUserSignUPOtp: async (req: any, res: any) => {
        logger.info(`/POST ot sign up`);
        try {
            const body = await req.body;

            /**
            * @desc variable declaration 
            * @name insertUser
            *  @name errorCheck
            */


            let msisdn_temp = String(parseInt(body.msisdn))

            /**
            * @desc check if the user exists 
            * */
            await userModel.find({ msisdn: `${msisdn_temp}`, email: `${body.email}` }).then(async (result: any) => {

                if (result && result.length > 0) {
                    res.status(403).send({
                        Status: false,
                        StatusCode: 2,
                        StatusMessage: `פרטי האימייל והטלפון כבר קיימים במערכת`
                    })
                }
                else {
                    await userModel.find({ msisdn: `${msisdn_temp}` }).then(async (result: any) => {
                        if (result && result.length > 0) {

                            res.status(403).send({
                                Status: false,
                                StatusCode: 2,
                                StatusMessage: `טלפון קיים במערכת. השתמש בטלפון אחר`
                            })
                        }
                        else {
                            await userModel.find({ email: `${body.email}` }).then(async (result: any) => {

                                if (result && result.length > 0) {
                                    res.status(403).send({
                                        Status: false,
                                        StatusCode: 2,
                                        StatusMessage: `האימייל קיים במערכת, אנא בחר אימייל חדש`
                                    })
                                } else {
                                    /**
                                    * @desc query to insert user values to @name user table
                                    * @const insertUser table values  
                                    * */
                                    // const hash_password = await bcrypt.hash(body.password, 10)
                                    /**@desc variable validation check of artists role */


                                    if ((body.first_name == null || body.first_name == undefined)
                                        && (body.last_name == null || body.last_name == undefined) &&
                                        (msisdn_temp == null || msisdn_temp == undefined)) {
                                        res.status(403).send({
                                            Status: false,
                                            StatusCode: 2,
                                            StatusMessage: `כל השדות הם שדות חובה`
                                        })
                                    }
                                    else if (body.role == 'artist' && (body.stage_name == null || body.stage_name == undefined) &&
                                        body.stage_name.length == 0 &&
                                        (body.presented_office == undefined || body.presented_office == null) && body.presented_office.length == 0 &&
                                        (body.gender == null || body.gender == undefined) &&
                                        body.gender.length == 0 &&
                                        (body.category == null || body.category == undefined)
                                        && body.category.length == 0) {

                                        res.status(403).send({
                                            Status: false,
                                            StatusCode: 2,
                                            StatusMessage: `כל השדות הם שדות חובה`
                                        })
                                    }

                                    else if (body.role == 'business_customer' && (body.organizatison_name == null || body.organizatison_name == undefined)
                                        && body.organization_name.length == 0
                                        && (body.business_number == undefined || body.business_number == null)
                                        && body.business_number.length == 0 &&
                                        (body.department == null || body.department == undefined)
                                        && body.department.length == 0) {


                                        res.status(403).send({
                                            Status: false,
                                            StatusCode: 2,
                                            StatusMessage: `כל השדות הם שדות חובה`
                                        })
                                    }
                                    else {
                                        //send opt 

                                        const val = await findCode();

                                        let mfrequency = ((Date.now() / 1000) + (1 * 1 * 2 * 60))  // two minutes added to current time

                                        let mfrequency_now = ((Date.now() / 1000))  // two minutes added to current time

                                        let message = util.format(otpMessage, val)
                                        let subject = "OTP verification"
                                        // 
                                        // // let message = format(text, val)
                                        const mid = await getNextSequenceValue(`${table.db_queue}`)
                                        const queue = new dbQueueModel({ id: mid, msisdn: `${msisdn_temp}`, message: `${message}` });
                                        // CounterSchema
                                        queue.markModified(`${table.db_queue}`);

                                        await queue.save()
                                            .then(async (data) => {

                                                const miwd = await getNextSequenceValue(`${table.verification}`)

                                                const insertVerification = {
                                                    msisdn: `${msisdn_temp}`,
                                                    email: `${body.email}`,
                                                    code: `${val}`,
                                                    expired: `${mfrequency}`,
                                                    created: `${mfrequency_now}`
                                                };

                                                const vqueue = new verificationModel(insertVerification);

                                                await vqueue.save().then(async (dbResult: any) => {

                                                    let msisdn_temp = String(parseInt(body.msisdn))

                                                    await client.hSet(msisdn_temp, `signup_details`, JSON.stringify(body));

                                                    await emailSent(message, subject, body.email)

                                                    res.status(200).send({
                                                        Status: true,
                                                        StatusCode: 0,
                                                        StatusMessage: `הקוד נשלח בהצלחה!`
                                                    })
                                                }).catch(error => {
                                                    /**
                                                    * @return 
                                                    * catch error is send out here 
                                                    * */
                                                    res.status(400).send({
                                                        Status: false,
                                                        StatusCode: 2,
                                                        StatusMessage: `${error}`
                                                    })
                                                    // })
                                                })
                                            }).catch(error => {
                                                /**
                                                * @return 
                                                * catch error is send out here 
                                                * */
                                                res.status(400).send({
                                                    Status: false,
                                                    StatusCode: 2,
                                                    StatusMessage: `${error}`
                                                })
                                            })
                                    }
                                }
                            })
                        }
                    })
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
                StatusMessage: `${error}`
            })
        }
    },


    // /**
    //     * @name PUT 
    //     * @desc controller to edit @name updateUser values
    //     * @function updateUser 
    //     * */

    updateUserTable: async (req: any, res: any) => {

        logger.info(`/PUT user`);
        try {

            let check = false

            const body = await req.body;

            let msisdn_temp = String(parseInt(body.msisdn))


            let updateUserTable

            let updateUserTableFinal: any

            if (req.locals.role == 'admin') {
                /**
                * @const updateUserTable query defined 
                * */
                updateUserTable = {
                    first_name: `${body.first_name}`,
                    last_name: `${body.last_name}`,
                    email: `${body.email}`,
                    msisdn: `${msisdn_temp}`,
                    other_msisdn: `${body.other_msisdn}`,
                    organization_name: `${body.organization_name}`,
                    business_number: `${body.business_number}`,
                    occupation: `${body.occupation}`,
                    organization_number: `${body.organization_number}`,
                    business_address: `${body.business_address}`,
                    stage_name: `${body.stage_name}`,
                    presented_office: `${body.presented_office}`,
                    gender: `${body.gender}`,
                    category: `${body.category}`,
                    department: `${body.department}`
                };

                updateUserTableFinal = await userModel.updateOne({ id: `${body.id}` }, updateUserTable, { new: true })

            } else {

                if (req.locals.id == body.id) {

                    updateUserTable = {
                        first_name: `${body.first_name}`,
                        last_name: `${body.last_name}`,
                        email: `${body.email}`,
                        msisdn: `${msisdn_temp}`,
                        other_msisdn: `${body.other_msisdn}`,
                        organization_name: `${body.organization_name}`,
                        business_number: `${body.business_number}`,
                        occupation: `${body.occupation}`,
                        organization_number: `${body.organization_number}`,
                        business_address: `${body.business_address}`,
                        stage_name: `${body.stage_name}`,
                        presented_office: `${body.presented_office}`,
                        gender: `${body.gender}`,
                        category: `${body.category}`,
                        department: `${body.department}`
                    }

                    updateUserTableFinal = await userModel.updateOne({ id: `${req.locals.id}` }, updateUserTable, { new: true })

                } else {
                    check = true
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
                        StatusMessage: "הצלחת!"
                    })
                } else {
                    /**@desc nothing is updated */
                    res.status(400).send({
                        Status: false,
                        StatusCode: 1,
                        StatusMessage: "אין שינוי בערך של השדה"
                    })
                }

            } else {
                res.status(400).send({
                    Status: false,
                    StatusCode: 1,
                    StatusMessage: "User dont match profile"
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


    /**
        * @desc get Users
        * @function getUserTable
    * */
    getUserTable: async (req: any, res: any) => {

        logger.info(`/ GET user`);
        try {
            const body = await req.body;
            /**
            * @desc sql query get all the @name getUserTable 
            * @desc fech by either @name status,role,active_status and @name id                    
            * */
            let id = req.query.id

            // let email = req.locals.email;

            let status = req.query.status
            let role = req.query.role
            let active_status = req.query.active_status
            let getUserTable: any
            let start_date = req.query.start_date
            let end_date = req.query.end_date

            let userData: any;
            const filters = {
                created_at: {
                    $gte: `${start_date}`,
                    $lte: `${end_date}`,
                },
            };


            if (req.locals.role == 'admin') {
                if (id) {
                    userData = await userModel.find({ id: id }, {
                        'id': 1, "first_name": 1, "last_name": 1, "email": 1, "msisdn": 1,
                        "other_msisdn": 1,
                        "organization_name": 1,
                        "business_number": 1,
                        "organization_number": 1,
                        "business_address": 1,
                        "department": 1,
                        "occupation": 1,
                        "stage_name": 1,
                        "presented_office": 1,
                        "gender": 1,
                        "category": 1,
                        "active_status": 1,
                        "profile_url": 1,
                        "cover_url": 1,
                        "description": 1,
                        "tags": 1,
                        "status": 1,
                        "role": 1,
                        "created_at": 1
                    })
                }
                else if (status && !active_status && !role) {
                    userData = await userModel.find({ status: `${status}`, 'role': { $ne: "admin" } }, {
                        'id': 1, "first_name": 1, "last_name": 1, "email": 1, "msisdn": 1,
                        "other_msisdn": 1,
                        "organization_name": 1,
                        "business_number": 1,
                        "organization_number": 1,
                        "business_address": 1,
                        "department": 1,
                        "stage_name": 1,
                        "occupation": 1,
                        "presented_office": 1,
                        "gender": 1,
                        "category": 1,
                        "active_status": 1,
                        "profile_url": 1,
                        "cover_url": 1,
                        "status": 1,
                        "role": 1,
                        "description": 1,
                        "tags": 1,
                        "created_at": 1
                    })
                }
                else if (active_status && status && !role) {
                    userData = await userModel.find({ active_status: `${active_status}`, status: `${status}`, 'role': { $ne: "admin" } }, {
                        'id': 1, "first_name": 1, "last_name": 1, "email": 1, "msisdn": 1,
                        "other_msisdn": 1,
                        "organization_name": 1,
                        "business_number": 1,
                        "organization_number": 1,
                        "business_address": 1,
                        "department": 1,
                        "occupation": 1,
                        "profile_url": 1,
                        "cover_url": 1,
                        "stage_name": 1,
                        "presented_office": 1,
                        "gender": 1,
                        "category": 1,
                        "active_status": 1,
                        "status": 1,
                        "description": 1,
                        "tags": 1,
                        "role": 1,
                        "created_at": 1,
                        "last_updated_on": 1
                    })
                }
                else if (role && status && active_status) {
                    userData = await userModel.find({ role: `${role}`, active_status: `${active_status}`, status: `${status}` }, {
                        'id': 1, "first_name": 1, "last_name": 1, "email": 1, "msisdn": 1,
                        "other_msisdn": 1,
                        "organization_name": 1,
                        "business_number": 1,
                        "organization_number": 1,
                        "business_address": 1,
                        "department": 1,
                        "occupation": 1,
                        "profile_url": 1,
                        "cover_url": 1,
                        "stage_name": 1,
                        "presented_office": 1,
                        "gender": 1,
                        "category": 1,
                        "active_status": 1,
                        "status": 1,
                        "description": 1,
                        "tags": 1,
                        "role": 1,
                        "created_at": 1
                    })
                }
                else if (role && !active_status && status) {
                    userData = await userModel.find({ role: `${role}`, status: `${status}` }, {
                        'id': 1, "first_name": 1, "last_name": 1, "email": 1, "msisdn": 1,
                        "other_msisdn": 1,
                        "organization_name": 1,
                        "business_number": 1,
                        "organization_number": 1,
                        "business_address": 1,
                        "occupation": 1,
                        "department": 1,
                        "stage_name": 1,
                        "presented_office": 1,
                        "gender": 1,
                        "profile_url": 1,
                        "cover_url": 1,
                        "category": 1,
                        "active_status": 1,
                        "status": 1,
                        "role": 1,
                        "description": 1,
                        "tags": 1,
                        "created_at": 1
                    })
                }
                else if (role && !active_status && !status) {
                    userData = await userModel.find({ role: `${role}` }, {
                        'id': 1, "first_name": 1, "last_name": 1, "email": 1, "msisdn": 1,
                        "other_msisdn": 1,
                        "organization_name": 1,
                        "business_number": 1,
                        "organization_number": 1,
                        "occupation": 1,
                        "business_address": 1,
                        "department": 1,
                        "stage_name": 1,
                        "presented_office": 1,
                        "gender": 1,
                        "profile_url": 1,
                        "cover_url": 1,
                        "category": 1,
                        "active_status": 1,
                        "status": 1,
                        "role": 1,
                        "description": 1,
                        "tags": 1,
                        "created_at": 1
                    })
                }
                else if (role && active_status && !status) {
                    userData = await userModel.find({ active_status: `${active_status}`, 'role': { $ne: "admin" } }, {
                        'id': 1, "first_name": 1, "last_name": 1, "email": 1, "msisdn": 1,
                        "other_msisdn": 1,
                        "organization_name": 1,
                        "business_number": 1,
                        "occupation": 1,
                        "profile_url": 1,
                        "cover_url": 1,
                        "organization_number": 1,
                        "business_address": 1,
                        "department": 1,
                        "stage_name": 1,
                        "presented_office": 1,
                        "gender": 1,
                        "category": 1,
                        "active_status": 1,
                        "status": 1,
                        "role": 1,
                        "description": 1,
                        "tags": 1,
                        "created_at": 1
                    })
                }
                else {
                    userData = await userModel.find({ 'role': { $ne: "admin" } }, {
                        'id': 1, "first_name": 1, "last_name": 1, "email": 1, "msisdn": 1,
                        "other_msisdn": 1,
                        "organization_name": 1,
                        "business_number": 1,
                        "occupation": 1,
                        "profile_url": 1,
                        "cover_url": 1,
                        "organization_number": 1,
                        "business_address": 1,
                        "department": 1,
                        "stage_name": 1,
                        "presented_office": 1,
                        "gender": 1,
                        "category": 1,
                        "active_status": 1,
                        "status": 1,
                        "description": 1,
                        "tags": 1,
                        "role": 1,
                        "created_at": 1
                    })
                }
            } else {
                userData = await userModel.find({ id: `${req.locals.id}` }, {
                    'id': 1, "first_name": 1, "last_name": 1, "email": 1, "msisdn": 1,
                    "other_msisdn": 1,
                    "organization_name": 1,
                    "business_number": 1,
                    "occupation": 1,
                    "organization_number": 1,
                    "business_address": 1,
                    "department": 1,
                    "stage_name": 1,
                    "presented_office": 1,
                    "gender": 1,
                    "category": 1,
                    "profile_url": 1,
                    "cover_url": 1,
                    "active_status": 1,
                    "status": 1,
                    "role": 1,
                    "description": 1,
                    "tags": 1,
                    "created_at": 1,
                    "last_updated_on": 1
                })
            }
            /**
            * @desc everthing went well result is sent out 
            * */
            res.status(200).send({
                Status: true,
                StatusCode: 0,
                Name: "Users",
                Data: userData, /**@desc User data display here */
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
    * @desc controller to login user values in the 
    * @name login
    * @function login 
    * */
    login: async (req: any, res: any) => {

        logger.info(`/ POST login`);
        try {

            const body = await req.body;

            const otp = body.otp
            logger.info(body)


            /**
            * 
            * @desc query to insert user values to @name user table
            * @const insertUser table values  
            *   
            * */
            // redis retrieve
            let msisdn_temp = String(parseInt(body.msisdn))
            const fuga = await client.hGetAll(msisdn_temp);

            const metaData = JSON.parse(fuga.login_details)

            console.log("ddjfjj ", metaData)

            let mfrequency_now = ((Date.now() / 1000))  // five minutes added to current time

            // let insertUser: any;

            // await verificationModel.findOne({ code: `${otp}` }).then(async (result: any) => {
            //     /**
            //         * @desc  error login , empy Array is sent out
            //     * */

            //     if (result && result.code) {

            //         await verificationModel.find({ status: 0, msisdn: `${msisdn_temp}`, code: `${otp}`, expired: { $gt: `${mfrequency_now}` } })
            //             .then(async (resultVerified: any) => {

            //                 if (resultVerified.length == 0) {
            //                     res.status(400).send({
            //                         Status: false,
            //                         StatusCode: 2,
            //                         StatusMessage: "הקוד לא בתוקף"
            //                     })
            //                 } else {

            //                     await verificationModel.updateOne({ code: `${otp}` }, { status: 1 }, { new: true }).then(async (updated: any) => {


            let user = {
                _id: metaData._id,
                id: metaData.id,
                first_name: metaData.first_name,
                last_name: metaData.last_name,
                email: metaData.email,
                msisdn: metaData.msisdn.toString(),
                other_msisdn: metaData.other_msisdn,
                organization_name: metaData.organization_name,
                business_number: metaData.business_number,
                organization_number: metaData.organization_name,
                business_address: metaData.business_address,
                department: metaData.department,
                occupation: metaData.occupation,
                stage_name: metaData.stage_name,
                status: metaData.status,
                presented_office: metaData.presented_office,
                gender: metaData.gender,
                category: metaData.category,
                active_status: metaData.active_status,
                role: metaData.role
            }



            let token_expiry = `${process.env.TOKEN_EXPIRY}`

            let mremeber_me = fuga.remember_me_check

            if (mremeber_me == 'true' || mremeber_me === "true") {
                token_expiry = `${process.env.REFREST_TOKE_EXPIRY}`
            }


            // remember_me
            /**
            * @desc  create token 
            * */
            const token = jwt.sign(user,
                `${process.env.JWT_SECRET}`, {
                expiresIn: token_expiry
            });

            const refreshToken = jwt.sign(user, `${process.env.JWT_REFRESH}`, {
                expiresIn: `${process.env.REFREST_TOKE_EXPIRY}`,
            });


            let msisdn_tem = String(metaData.msisdn.toString())

            await client.hSet(msisdn_tem, `refresh_token_set`, refreshToken);

            res.status(200).send({
                Status: true,
                StatusCode: 0,
                Token: token,
                RefreshToken: refreshToken,
                PayLoad: user,
                StatusMessage: "הצלחת!"
            })


        } catch (error) {
            /**
            * @return WWS
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
    * @desc controller to add profile photo values in the
    * @name profilePhoto config table
    *
    * * */
    addProfilePhoto: async (req: any, res: any) => {
        logger.info(`/POST update profile`);
        try {
            const body = await req.body;


            let profile_id = req.locals.id;

            /**
            * @desc variable declaration
            * @name addPhotoProfile
            * @name errorCheck
            * @desc query to insert event values to @name users table
            * @const addPhotoProfile table values
            * */
            await userModel.find({ id: `${profile_id}` }).then(async (result: any) => {

                if (result && result.length > 0) {
                    const accessKeyId = `${process.env.AWS_ACCESS_KEY_ID}`;
                    const secretAccessKey = `${process.env.AWS_SECRET_ACCESS_KEY}`;
                    const s3 = new AWS.S3({
                        accessKeyId: accessKeyId,
                        secretAccessKey: secretAccessKey,
                    });

                    const region = `${process.env.S3_REGION}`;
                    const Bucket = `${process.env.S3_BUCKET}`;

                    if (body.type == 'profile') {
                        let profile_url_path = project_folder + "/" + req.files.profile_url[0].filename;

                        const blob = fs.readFileSync(profile_url_path);

                        const uploadedProfile = await s3
                            .upload({
                                Bucket: Bucket,
                                Key: req.files.profile_url[0].filename,
                                Body: blob,
                            }).promise();
                        let profile_url = uploadedProfile.Location;

                        fs.unlinkSync(profile_url_path);

                        await userModel.updateOne({ id: `${profile_id}` }, { profile_url: `${profile_url}` }, { new: true }).then(async (resp: any) => {
                            if (resp.modifiedCount > 0) {
                                /**
                                * @desc updated ok 
                                * */
                                res.status(200).send({
                                    Status: true,
                                    StatusCode: 0,
                                    StatusMessage: "הצלחת!"
                                })
                            } else {
                                res.status(400).send({
                                    Status: false,
                                    StatusCode: 2,
                                    StatusMessage: 'סיסמאחדשה תואמת את הישנה. נסה שוב',
                                })
                            }
                        })
                    }

                    else if (body.type == 'cover') {

                        let cover_url_path = project_folder + "/" + req.files.cover_url[0].filename;
                        const blob_cover = fs.readFileSync(cover_url_path);

                        const uploadedCover = await s3
                            .upload({
                                Bucket: Bucket,
                                Key: req.files.cover_url[0].filename,
                                Body: blob_cover,
                            }).promise();

                        fs.unlinkSync(cover_url_path);

                        let cover_url = uploadedCover.Location;

                        await userModel.updateOne({ id: `${profile_id}` }, { cover_url: `${cover_url}` }, { new: true }).then(async (resp: any) => {
                            if (resp.modifiedCount > 0) {
                                /**
                                * @desc updated ok 
                                * */
                                res.status(200).send({
                                    Status: true,
                                    StatusCode: 0,
                                    StatusMessage: "הצלחת!"
                                })
                            } else {
                                res.status(400).send({
                                    Status: false,
                                    StatusCode: 2,
                                    StatusMessage: 'סיסמאחדשה תואמת את הישנה. נסה שוב',
                                })
                            }
                        })
                    } else {
                        res.status(400).send({
                            Status: false,
                            StatusCode: 2,
                            StatusMessage: 'Unknown type',
                        })

                    }
                } else {
                    res.status(400).send({
                        Status: false,
                        StatusCode: 2,
                        StatusMessage: 'Profile not found',
                    })
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
    * @desc @name forgotpassword  controller
    */
    forgotPassword: async (req: any, res: any) => {

        logger.info(`/ POST forgot_password`);

        try {
            const body = await req.body;
            await userModel.find({ email: `${body.email}` }).then(async (result: any) => {
                if (result.length > 0) {
                    const forgotToken = jwt.sign({ email: body.email }, `${process.env.JWT_FORGOT}`, {
                        expiresIn: `${process.env.FORGOT_TOKEN_EXPIRY}`,
                    });
                    let forgot_link = `${forgotPWD}${forgotToken}`
                    let message = util.format(forgotPasswordMessage, result[0].first_name, forgot_link)
                    let subject = "Pantheon: Forgot Password"
                    await emailSent(message, subject, result[0].email)

                    res.status(200).send({
                        Status: true,
                        StatusCode: 0,
                        StatusMessage: `Success`
                    })
                }
                else {
                    res.status(400).send({
                        Status: false,
                        StatusCode: 2,
                        StatusMessage: "Account not found"
                    })
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
                StatusMessage: `${error}`
            })
        }
    },






    /**
    * @desc @name userexistcheck  controller
    */
    checkUserExist: async (req: any, res: any) => {

        logger.info(`/ POST userexistcheck`);

        try {
            const body = await req.body;

            let msisdn_temp = String(parseInt(body.msisdn))


            await userModel.find({ msisdn: `${msisdn_temp}` }).then(async (result: any) => {
                if (result.length > 0) {
                    let error = {
                        msisdn: "טלפון קיים במערכת. השתמש במספר אחר או התחבר"
                    }
                    res.status(400).send(
                        {
                            Status: false,
                            StatusCode: 1,
                            errors: error,
                            StatusMessage: `טלפון קיים במערכת. השתמש במספר אחר או התחבר`
                        })
                }
                else {
                    await userModel.find({ email: `${body.email}` }).then(async (result: any) => {
                        if (result.length > 0) {
                            let error = {
                                email: "טלפון קיים במערכת. השתמש במספר אחר או התחבר"
                            }
                            res.status(400).send(
                                {
                                    Status: false,
                                    StatusCode: 1,
                                    errors: error,
                                    StatusMessage: "טלפון קיים במערכת. השתמש במספר אחר או התחבר"
                                })
                        }
                        else {
                            res.status(200).send({
                                Status: true,
                                StatusCode: 0,
                                StatusMessage: "Success"
                            })
                        }
                    })
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
                StatusMessage: `${error}`
            })

        }
    },




        // password reset controller
        passwordReset: async (req: any, res: any) => {

            logger.info(`/POST password reset`);

            try {
                // values from the http request

                const body = await req.body;

                let pin = body.new_password
                let token = body.token

                let mfrequency_now = ((Date.now() / 1000))  // five minutes added to current time

                if (pin.length > 3) {


                    jwt.verify(token, `${process.env.JWT_REFRESH}`,
                        async (err, decoded) => {
                            if (err) {
                                // Wrong Refesh Token
                                res.status(400).send({
                                    Status: false,
                                    StatusCode: 1,
                                    StatusMessage: "Invalid Token"
                                })
                            }
                            else {

                                /**
                                * @desc retrieve data from refresh token 
                                * */
                                let metaData = JSON.parse(JSON.stringify(decoded))

                                const hash_password = await bcrypt.hash(body.new_password, 10);

                                await userModel.find({ email: `${metaData.email}` }).then(async (result: any) => {
                                    if (result.length > 0) {
                                        await userModel.updateOne({ email: `${metaData.email}` }, { password: `${hash_password}` }, { new: true }).then(async (resp: any) => {
                                            if (resp.modifiedCount > 0) {
                                                /**
                                                * @desc updated ok 
                                                * */
                                                res.status(200).send({
                                                    Status: true,
                                                    StatusCode: 0,
                                                    StatusMessage: "הצלחת!"
                                                })
                                            } else {

                                                res.status(400).send({
                                                    Status: false,
                                                    StatusCode: 2,
                                                    StatusMessage: 'סיסמא חדשה תואמת את הישנה. נסה שוב',
                                                })
                                            }
                                        })
                                    } else {
                                        let error = {
                                            msisdn: "טלפון קיים במערכת. השתמש במספר אחר או התחבר"
                                        }
                                        res.status(400).send({
                                            Status: false,
                                            StatusCode: 2,
                                            errors: error,
                                            StatusMessage: "טלפון לא נמצא"
                                        })
                                    }
                                })
                            }
                        })
                } else {
                    let error = {
                        pin: "PIN too short",
                    }
                    res.status(400).send({
                        Status: false,
                        StatusCode: 2,
                        errors: error,
                        StatusMessage: 'PIN too short',
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


    // change password controller
    changePassword: async (req: any, res: any) => {
        logger.info(`/POST change password`);
        try {
            // values from the http request
            const body = await req.body;
            let pin = body.new_password;
            let msisdn = req.locals.msisdn;

            const hash_password = await bcrypt.hash(body.new_password, 10);
            // check mingi 
            if (pin.length > 3) {
                await userModel.find({ msisdn: `${msisdn}` }).then(async (result: any) => {
                    if (result && result.length > 0) {
                        const isPasswordValid = await bcrypt.compare(body.old_password, result[0].password);
                        if (!isPasswordValid) {
                            res.status(400).send({
                                Status: false,
                                StatusCode: 2,
                                StatusMessage: "סיסמא ישנה לא תקינה"
                            })
                        } else {
                            await userModel.updateOne({ msisdn: `${msisdn}` }, { password: `${hash_password}` }, { new: true }).then(async (resp: any) => {
                                if (resp.modifiedCount > 0) {
                                    /** 
                                         * @desc updated ok
                                    * */
                                    res.status(200).send({
                                        Status: true,
                                        StatusCode: 0,
                                        StatusMessage: "הצלחת!"
                                    })
                                } else {
                                    res.status(400).send({
                                        Status: false,
                                        StatusCode: 2,
                                        StatusMessage: 'סיסמא חדשה תואמת את הישנה. נסה שוב',
                                    })
                                }
                            })
                        }
                    } else {
                        let error = {
                            pin: "PIN too short"
                        }
                        res.status(400).send({
                            Status: false,
                            StatusCode: 2,
                            errors: error,
                            StatusMessage: "טלפון לא נמצא"
                        })
                    }
                })
            } else {
                res.status(400).send({
                    Status: false,
                    StatusCode: 2,
                    StatusMessage: 'PIN too short',
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


    /**
     * @desc @name otpSend controller */
    otpSend: async (req: any, res: any) => {
        try {
            const body = await req.body;
            let msisdn_temp = String(parseInt(body.msisdn))
            await userModel.find({ msisdn: `${msisdn_temp}` }).then(async (result: any) => {
                if (result && result.length > 0) {
                    const isPasswordValid = await bcrypt.compare(body.password, result[0].password);
                    if (!isPasswordValid) {
                        let error = {
                            password: "Invalid Password",
                        }
                        res.status(400).send({
                            Status: false,
                            StatusCode: 2,
                            errors: error,
                            StatusMessage: "Invalid Password"
                        })
                    } else {

                        const val = await findCode()// find verification code
                        let mfrequency = ((Date.now() / 1000) + (1 * 1 * 2 * 60))  // two minutes added to current time

                        let mfrequency_now = ((Date.now() / 1000))  // two minutes added to current time

                        let message = util.format(otpMessage, val)
                        // let subject = "OTP verification"
                        const mid = await getNextSequenceValue(`${table.db_queue}`)
                        const queue = new dbQueueModel({ id: mid, msisdn: `${msisdn_temp}`, message: `${message}` });

                        // CounterSchema
                        queue.markModified(`${table.db_queue}`);
                        await queue.save()
                            .then(async (data) => {
                                const insertVerification = {
                                    msisdn: `${msisdn_temp}`,
                                    email: `${result[0].email}`,
                                    code: `${val}`,
                                    expired: `${mfrequency}`,
                                    created: `${mfrequency_now}`
                                };
                                const vqueue = new verificationModel(insertVerification);
                                await vqueue.save().then(async (dbResult: any) => {
                                    let mremember = "false"
                                    if (body.remember_me) {
                                        mremember = body.remember_me
                                    }

                                    let msisdn_temp = String(result[0].msisdn.toString())


                                    await client.hSet(msisdn_temp, `remember_me_check`, mremember.toString());


                                    await client.hSet(msisdn_temp, `login_detail_password`, body.password);

                                    await client.hSet(msisdn_temp, `login_details`, JSON.stringify(result[0]));


                                    res.status(200).send({
                                        Status: true,
                                        StatusCode: 0,
                                        StatusMessage: `הקוד נשלח בהצלחה!`
                                    })

                                }).catch(error => {


                                    /**
                                    * @return 
                                    * catch error is send out here 
                                    * */
                                    res.status(400).send({
                                        Status: false,
                                        StatusCode: 2,
                                        StatusMessage: `${error}`
                                    })
                                    // })
                                })
                            }).catch(error => {
                                /**
                                * @return 
                                * catch error is send out here 
                                * */
                                res.status(400).send({
                                    Status: false,
                                    StatusCode: 2,
                                    StatusMessage: `${error}`
                                })
                            })
                    }
                } else {
                    let error = {
                        profile: "הפרופיל לא אושר",
                    }
                    res.status(400).send({
                        Status: false,
                        StatusCode: 2,
                        errors: error,
                        StatusMessage: "הפרופיל לא אושר"
                    })
                }
                //     } else {
                //         let error = {
                //             account: "Account is Inactive",
                //         }
                //         res.status(400).send({
                //             Status: false,
                //             StatusCode: 2,
                //             errors: error,
                //             StatusMessage: "פרופיל לא זמין"
                //         })
                //     }
                // } else {

                //     let error = {
                //         msisdn: "טלפון לא נמצא",
                //     }
                //     res.status(400).send({
                //         Status: false,
                //         StatusCode: 2,
                //         errors: error,
                //         StatusMessage: "טלפון לא נמצא"
                //     })
                // }
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
    * @desc @name resentSend controller
    */
    resentSend: async (req: any, res: any) => {

        logger.info(`/POST otp send`);
        try {
            const body = await req.body;

            let msisdn_temp = String(parseInt(body.msisdn));
            const fuga = await client.hGetAll(msisdn_temp);
            if (fuga.login_detail_password) {
                await userModel.find({ msisdn: `${msisdn_temp}` }).then(async (result: any) => {
                    if (result && result.length > 0) {
                        const isPasswordValid = await bcrypt.compare(fuga.login_detail_password, result[0].password);
                        if (!isPasswordValid) {
                            res.status(400).send({
                                Status: false,
                                StatusCode: 2,
                                StatusMessage: "Invalid Password"
                            })
                        } else {
                            const val = await findCode();

                            let mfrequency = ((Date.now() / 1000) + (1 * 1 * 2 * 60))  // two minutes added to current time

                            let mfrequency_now = ((Date.now() / 1000))  // two minutes added to current time

                            let message = util.format(otpMessage, val)
                            let subject = "OTP verification"

                            await emailSent(message, subject, result[0].email)
                            // let message = format(text, val)
                            const mid = await getNextSequenceValue(`${table.db_queue}`)
                            const queue = new dbQueueModel({ id: mid, msisdn: `${msisdn_temp}`, message: `${message}` });
                            // CounterSchema
                            queue.markModified(`${table.db_queue}`);
                            await queue.save()
                                .then(async (data) => {
                                    const insertVerification = {
                                        msisdn: `${msisdn_temp}`,
                                        email: `${body.email}`,
                                        code: `${val}`,
                                        expired: `${mfrequency}`,
                                        created: `${mfrequency_now}`
                                    };
                                    const vqueue = new verificationModel(insertVerification);
                                    await vqueue.save().then(async (dbResult: any) => {
                                        Promise
                                        let msisdn_temp = String(result[0].msisdn.toString())
                                        await client.hSet(msisdn_temp, `login_details`, JSON.stringify(result[0]));
                                        res.status(200).send({
                                            Status: true,
                                            StatusCode: 0,
                                            StatusMessage: `הקוד נשלח בהצלחה!`
                                        })
                                    }).catch(error => {
                                        /**
                                        * * @return catch error is send out here 
                                        * */
                                        res.status(400).send({
                                            Status: false,
                                            StatusCode: 2,
                                            StatusMessage: `${error}`
                                        })
                                        // })
                                    })
                                }).catch(error => {
                                    /**
                                    * @return 
                                    * catch error is send out here 
                                    * */
                                    res.status(400).send({
                                        Status: false,
                                        StatusCode: 2,
                                        StatusMessage: `${error}`
                                    })
                                })
                        }
                    } else {
                        let error = {
                            msisdn: "טלפון לא נמצא",
                        }
                        res.status(400).send({
                            Status: false,
                            StatusCode: 2,
                            errors: error,
                            StatusMessage: "טלפון לא נמצא"
                        })
                    }
                })
            } else {
                let error = {
                    msisdn: "טלפון לא נמצא"
                }
                res.status(400).send({
                    Status: false,
                    StatusCode: 2,
                    errors: error,
                    StatusMessage: "טלפון לא נמצא"
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


    /**
    * @desc active/deactivate user profile 
    * */
    /**
    * @name PUT 
    * @desc controller to edit @name updateUserStatus values
    * @function updateUserStatus 
    * */

    updateUserStatus: async (req: any, res: any) => {
        logger.info(`/PUT user`);
        try {
            const body = await req.body;

            let role = req.locals.role;
            if (role == 'admin') {
                logger.info(body);
                /**
                * @const updateUserStatus query defined 
                * @desc active_status is either @name inactive or @name active
                * */

                await userModel.updateOne({ id: `${body.id}` }, { active_status: `${body.active_status}` },
                    { new: true })
                    .then(async (resp: any) => {
                        if (resp.modifiedCount > 0) {
                            /**
                            * @desc updated ok 
                            * */
                            res.status(200).send({
                                Status: true,
                                StatusCode: 0,
                                StatusMessage: "הצלחת!"
                            })
                        } else {
                            /**@desc nothing is updated */
                            res.status(200).send({
                                Status: false,
                                StatusCode: 1,
                                StatusMessage: "אין שינוי בערך של השדה"
                            })
                        }
                    }).catch(error => {
                        res.status(400).send({
                            Status: false,
                            StatusCode: 2,
                            StatusMessage: error
                        })
                    })
            } else {
                res.status(400).send({
                    Status: false,
                    StatusCode: 1,
                    StatusMessage: "Only admin can activate/deactivate profile"
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
    /**
    * @desc approve/reject user profile 
    * */
    /**
        * @name PUT 
        * @desc controller to edit @name approveProfile values
        * @function approveProfile 
    * */
    approveProfile: async (req: any, res: any) => {
        logger.info(`/PUT user`);
        try {
            const body = await req.body;


            let role = req.locals.role;

            // only admin can approve reject profile 
            if (role == 'admin') {
                
                logger.info(body);
                /**
                * @const approveProfile query defined 
                * @desc status is either @name approved or @name declined
                * */
                await userModel.updateOne({ id: `${body.id}` }, { status: `${body.status}`, active_status: `${body.status}` }, { new: true }).then(async (resp: any) => {
                    if (resp.modifiedCount > 0) {
                        /**
                        * @desc updated ok 
                        * */
                        res.status(200).send({
                            Status: true,
                            StatusCode: 0,
                            StatusMessage: "הצלחת!"
                        })
                    } else {
                        /**
                        * @desc nothing is updated 
                        * */
                        res.status(400).send({
                            Status: false,
                            StatusCode: 1,
                            StatusMessage: "אין שינוי בערך של השדה"
                        })
                    }
                })
            } else {
                res.status(400).send({
                    Status: false,
                    StatusCode: 1,
                    StatusMessage: "Only admin can appprove/decline profile"
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




    /**
    * @desc update description profile 
    * @name PUT 
    * @desc controller to edit @name updateProfileDescription values
    * @function updateProfileDescription 
    * */

    updateProfileDescription: async (req: any, res: any) => {
        logger.info(`/PUT profile description`);
        try {
            const body = await req.body;

            let profile_id = req.locals.id;

            // only admin can approve reject profile 
            await userModel.find({ id: `${profile_id}` }).then(async (result: any) => {

                if (result && result.length > 0) {
                    logger.info(body);
                    /**
                    * @const updateProfileDescription query defined 
                    * @desc status is either @name approved or @name declined
                    * */
                    await userModel.updateOne({ id: `${profile_id}` }, { description: `${body.description}` }, { new: true }).then(async (resp: any) => {

                        if (resp.modifiedCount > 0) {
                            /**
                            * @desc updated ok 
                            * */
                            res.status(200).send({
                                Status: true,
                                StatusCode: 0,
                                StatusMessage: "הצלחת!"
                            })
                        } else {
                            /**@desc nothing is updated */
                            res.status(400).send({
                                Status: false,
                                StatusCode: 1,
                                StatusMessage: "אין שינוי בערך של השדה"
                            })
                        }
                    })
                } else {
                    res.status(400).send({
                        Status: false,
                        StatusCode: 1,
                        StatusMessage: "Profile not found"
                    })
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
                StatusMessage: `${error}`
            })
        }
    },



    /**
    * @desc update description profile 
    * @name PUT 
    * @desc controller to edit @name updateProfileTags values
    * @function updateProfileTags
    * */

    updateProfileTags: async (req: any, res: any) => {
        logger.info(`/PUT profile tags`);
        try {
            const body = await req.body;

            let profile_id = req.locals.id;

            // only admin can approve reject profile 
            await userModel.find({ id: `${profile_id}` }).then(async (result: any) => {
                if (result && result.length > 0) {
                    logger.info(body);
                    /**
                        * @const updateProfileDescription query defined 
                        * @desc status is either @name approved or @name declined
                    * */
                    await userModel.updateOne({ id: `${profile_id}` }, { tags: `${body.tags}` },
                        { new: true }).
                        then(async (resp: any) => {
                            if (resp.modifiedCount > 0) {
                                /**
                                    * @desc updated ok 
                                * */
                                res.status(200).send({
                                    Status: true,
                                    StatusCode: 0,
                                    StatusMessage: "הצלחת!"
                                })
                            } else {
                                /**@desc nothing is updated */
                                res.status(400).send({
                                    Status: false,
                                    StatusCode: 1,
                                    StatusMessage: "אין שינוי בערך של השדה"
                                })
                            }
                        })
                } else {
                    res.status(400).send({
                        Status: false,
                        StatusCode: 1,
                        StatusMessage: "Profile not found"
                    })
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
                StatusMessage: `${error}`
            })
        }
    },

    /**
    * @desc 
    * @name refreshToken  controller
    */
    refreshToken: async (req: any, res: any) => {
        logger.info(`/POST refresh token`, req.cookies);
        try {
            const body = await req.body;
            let msisdn_temp = String(parseInt(body.msisdn));
            const fuga = await client.hGetAll(msisdn_temp);
            if (fuga.refresh_token_set) {
                if (fuga.refresh_token_set == body.refresh_token) {
                    // Destructuring refreshToken from cookie
                    const refreshToken = fuga.refresh_token_set;
                    // Verifying refresh token
                    jwt.verify(refreshToken, `${process.env.JWT_REFRESH}`,
                        (err, decoded) => {
                            if (err) {
                                // Wrong Refesh Token
                                res.status(400).send({
                                    Status: false,
                                    StatusCode: 1,
                                    StatusMessage: "Invalid refresh token"
                                })
                            }
                            else {
                                /**
                                * @desc retrieve data from refresh token 
                                * */
                                let metaData = JSON.parse(JSON.stringify(decoded))

                                let user = {
                                    id: metaData.id,
                                    first_name: metaData.first_name,
                                    last_name: metaData.last_name,
                                    email: metaData.email,
                                    msisdn: metaData.msisdn.toString(),
                                    other_msisdn: metaData.other_msisdn,
                                    organization_name: metaData.organization_name,
                                    business_number: metaData.business_number,
                                    occupation: metaData.occupation,
                                    business_address: metaData.business_address,
                                    department: metaData.department,
                                    stage_name: metaData.stage_name,
                                    status: metaData.status,
                                    presented_office: metaData.presented_office,
                                    gender: metaData.gender,
                                    category: metaData.category,
                                    active_status: metaData.active_status,
                                    role: metaData.role
                                }
                                const token = jwt.sign(user,
                                    `${process.env.JWT_SECRET}`, {
                                    expiresIn: `${process.env.TOKEN_EXPIRY}`,
                                });
                                // Correct token we send a new access token
                                res.status(400).send({
                                    Status: true,
                                    StatusCode: 0,
                                    Token: token,
                                    StatusMessage: "Success"
                                })
                            }
                        })
                } else {
                    res.status(400).send({
                        Status: false,
                        StatusCode: 1,
                        StatusMessage: "Invalid refresh token"
                    })
                }
            }
            else {
                res.status(400).send({
                    Status: false,
                    StatusCode: 1,
                    StatusMessage: "Token not found"
                })
            }
        } catch (error) {
            /**
            * @return 
            **/
            res.status(400).send({
                Status: false,
                StatusCode: 2,
                StatusMessage: `${error}`
            })
        }
    }
}
