import { conversationModal, counterModel, messageModal, subSubTagModal, subTagModal, verificationModel } from './schema';

/** @package express */
import express from 'express';
import dotenv from 'dotenv';
import multer from 'multer';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: '.env' }); // iniatilized configs here

/**
* @desc  initiate router object 
* */
export const router = express.Router()
export const project_folder = './uploads'  /**@desc   Can be changed to any location in the machine/server environment */
export const forgotPWD = 'https://pantheon.productivedev.co/change-password?token='


//get verification code
export const findCode = async () => {
    return new Promise(async (resolve, reject) => {

        const reTry = async () => {
            const val = Math.floor(1000 + Math.random() * 9000);
            const result = await verificationModel.find({ code: `${val}` })
            // console.log("test ", result)
            if (result.length > 0) {
                // console.log("dddkdkdk ", result)
                await reTry()
            } else {
                resolve(val)
            }
        }
        await reTry()
    })
}

//id counter to increase
export const getNextSequenceValue = async (sequenceName: any) => {
    return new Promise(async (resolve, reject) => {
        const result = await counterModel.find({ _id: sequenceName })

        if (result.length == 0) {
            let insertData = { _id: sequenceName, sequence_value: 0 };
            const vqueue = new counterModel(insertData);
            await vqueue
                .save().then(async () => {
                    await counterModel.updateOne({ _id: sequenceName }, { sequence_value: 1 }).then(async () => {
                        await counterModel.find({ _id: sequenceName }).then(async (resp) => {
                            resolve(resp[0].sequence_value);
                        });
                    });
                })
        } else {
            await counterModel.updateOne({ _id: sequenceName }, { sequence_value: result[0].sequence_value + 1 }).then(async () => {
                await counterModel.find({ _id: sequenceName }).then((resp) => {
                    resolve(resp[0].sequence_value);
                })
            });
        }
    })
}

/** send email out */
export const emailSent = async (message: string, subject: string, email: string) => {

    const nodemailer = require('nodemailer'); // mailer defined here

    // variable passrd here
    let mailTransporter = nodemailer.createTransport({
        service: `${process.env.EMAIL_SERVICE}`,
        auth: {
            user: `${process.env.EMAIL_USERNAME}`,
            pass: `${process.env.EMAIL_PASSWORD}`
        }
    });
    /**
    * @desc mail details description @name object 
    */
    let mailDetails = {
        from: `${process.env.EMAIL_FROM}`,
        to: `${email}`,
        subject: `${subject}`,
        text: `${message}`
    };


    /**
    * @desc mail transporter 
    * */
    mailTransporter.sendMail(mailDetails, function (err, data) {
        if (err) {
            return ('Error Occurs')
        } else {
            console.log('Email sent successfully ');
            return 'Email sent successfully';
        }
    });
}


/** quote status */
export const quoteStatusCHeck = async (value: string) => {

    if (value == 'waiting_for_the_supplier_response') {
        return 'waiting for the supplier response'
    }
    else if (value == 'waiting_for_the_client_response') {
        return 'waiting for the client response'
    } else if (value == 'declined_by_supplier') {
        return 'declined by supplier'
    } else if (value == 'declined_by_client') {
        return 'declined by client'
    }
    else if (value == 'approved') {
        return 'approved'
    }
}



//that 

export const quoteStatusUnCHeck = async (value: string) => {

    if (value == 'waiting for the supplier response') {
        return 'waiting_for_the_supplier_response'
    }
    else if (value == 'waiting for the client response') {
        return 'waiting_for_the_client_response'
    } else if (value == 'declined by supplier') {
        return 'declined_by_supplier'
    } else if (value == 'declined by client') {
        return 'declined_by_client'
    }
    else if (value == 'approved') {
        return 'approved'
    }
}




export const eventStatus = async (value: string) => {
    if (value == 'draft') {
        return 'draft'
    }
    else if (value == 'waiting for suppliers confirmation') {
        return 'waiting_for_suppliers_confirmation'
    }
    else if (value == 'waiting for customer response') {
        return 'waiting_for_customer_response'
    } else if (value == 'some of the suppliers didnt confirm quotation') {
        return 'some_of_the_suppliers_didnt_confirm_quotation'
    }
    else if (value == 'approved') {
        return 'approved'
    }
}


export const arrayListBudget = [
    {
        "name": "500-1000"
    },
    {
        "name": "1000-1500"
    },
    {
        "name": "1500-2000"
    },
    {
        "name": "2000-3000"
    },
    {
        "name": "3000-5000"
    },
    {
        "name": "5000-7000"
    },
    {
        "name": "7000-10000"
    },
    {
        "name": "10000-12000"
    },
    {
        "name": "12000-15000"
    },
    {
        "name": "15000-17000"
    },
    {
        "name": "17000-20000"
    },
    {
        "name": "20000-25000"
    },
    {
        "name": "25000-30000"
    },
    {
        "name": "30000-35000"
    }
    ,
    {
        "name": "35000-40000"
    }
    ,
    {
        "name": "40000-45000"
    }
    ,
    {
        "name": "45000-50000"
    }
    ,
    {
        "name": "50000-55000"
    }
    ,
    {
        "name": "55000-60000"
    }
    ,
    {
        "name": "60000-65000"
    },
    {
        "name": "65000-70000"
    },
    {
        "name": "70000-75000"
    },
    {
        "name": "75000-80000"
    },
    {
        "name": "80000-85000"
    },
    {
        "name": "85000-90000"
    },
    {
        "name": "90000-95000"
    },
    {
        "name": "95000-100000"
    },
    {
        "name": "100000-120000"
    },
    {
        "name": "120000-140000"
    },
    {
        "name": "140000-160000"
    },
    {
        "name": "160000-180000"
    },
    {
        "name": "180000-200000"
    }
    ,
    {
        "name": "200000-250000"
    },
    {
        "name": "250000-300000"
    },
    {
        "name": "מעל 300000"
    }
]

export const arrayCrowd = [

    {
        "name": "עד 100"
    },
    {
        "name": "100-300"
    },
    {
        "name": "300-500"
    },
    {
        "name": "500-1000"
    },
    {
        "name": "1000-2000"
    },
    {
        "name": "מעל 2000"
    }
]





export const eventStatusFirst = async (value: string) => {
    if (value == 'draft') {
        return 'draft'
    }
    else if (value == 'waiting_for_suppliers_confirmation') {
        return 'waiting for suppliers confirmation'
    }
    else if (value == 'waiting_for_customer_response') {
        return 'waiting for customer response'
    } else if (value == 'some_of_the_suppliers_didnt_confirm_quotation') {
        return 'some of the suppliers didnt confirm quotation'
    }
    else if (value == 'approved') {
        return 'approved'
    }
}


export const mHttpRequestTag = async (tag_id: any, sub_tag_id: any, sub_sub_tag_id: any) => {

    return new Promise((resolve, reject) => {

        let sub_tegProccess = Array()

        subTagModal.find({ id: { $in: sub_tag_id }, tag_id: tag_id }).then(async (sub_tegCategory) => {
            if (sub_tegCategory.length > 0) {
                for (let l = 0; l < sub_tegCategory.length; l++) {

                    const results: any = await subHttpRequestTag(sub_tegCategory[l].id, sub_sub_tag_id)

                    let mtagname = { "sub_tag_name": sub_tegCategory[l].sub_tag_name }

                    let mtagid = { "id": sub_tegCategory[l].id }

                    let mtagsubid = { "tag_id": sub_tegCategory[l].tag_id }

                    let mtagstatus = { "active_status": sub_tegCategory[l].active_status }

                    //     sub_tegCategory.push(results)
                    let msubcategory = { "sub_sub_category": results }
                    sub_tegProccess.push(Object.assign(mtagid, mtagsubid, mtagname, mtagstatus, msubcategory))

                    if (sub_tegCategory.length == (l + 1)) {
                        resolve(sub_tegProccess)
                    }
                }
            } else {
                resolve([])
            }
        })
    })
}

export const postMessage = (id, recepient_id, newMessage) => {
    return new Promise(async (resolve, reject) => {
        let from = new mongoose.Types.ObjectId(id);
        let to = new mongoose.Types.ObjectId(recepient_id);
        conversationModal.findOneAndUpdate(
            {
                recipients: {
                    $all: [
                        { $elemMatch: { $eq: from } },
                        { $elemMatch: { $eq: to } },
                    ],
                },
            },
            {
                recipients: [id, recepient_id],
                lastMessage: newMessage,
                date: Date.now(),
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }).then(e => {
                let message = new messageModal({
                    conversation: e._id,
                    to: recepient_id,
                    from: id,
                    body: newMessage,
                });
                message.save().then(emess => {
                    messageModal.aggregate([
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'to',
                                foreignField: '_id',
                                as: 'toObj',
                            },
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'from',
                                foreignField: '_id',
                                as: 'fromObj',
                            },
                        },
                        {
                            $match: { _id: emess._id }
                        },
                    ]).project({
                        'toObj.password': 0,
                        'toObj.__v': 0,
                        'toObj.date': 0,
                        'toObj.cover_url': 0,
                        'toObj.profile_url': 0,
                        'fromObj.password': 0,
                        'fromObj.__v': 0,
                        'fromObj.date': 0,
                        'fromObj.cover_url': 0,
                        'fromObj.profile_url': 0,
                    }).then((result) => {
                        // console.log(result.length > 0 ? result[0] : {})
                        resolve(result.length > 0 ? result[0] : {})
                    })
                })
            })
    })
}
// conversation first pull
export const getConversation = async (id, recepient_id) => {
    return new Promise(async (resolve, reject) => {
        let user1 = new mongoose.Types.ObjectId(id);
        let user2 = new mongoose.Types.ObjectId(recepient_id);
        messageModal.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'to',
                    foreignField: '_id',
                    as: 'toObj',
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'from',
                    foreignField: '_id',
                    as: 'fromObj',
                },
            },
            {
                $match: {
                    $or: [
                        { $and: [{ to: user1 }, { from: user2 }] },
                        { $and: [{ to: user2 }, { from: user1 }] },
                    ]
                }
            },
        ]).project({
            'toObj.password': 0,
            'toObj.__v': 0,
            'toObj.date': 0,
            'fromObj.password': 0,
            'fromObj.__v': 0,
            'fromObj.date': 0
        }).then((result) => {
            // console.log(result)
            resolve(result)
        })
    })
}



// user first pull
export const getUserList = async (id) => {
    console.log("cur ", id)
    return new Promise(async (resolve, reject) => {
        let user1 = new mongoose.Types.ObjectId(id);
        let from = user1;
        conversationModal.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'recipients',
                    foreignField: '_id',
                    pipeline: [{ $match: { _id: { $ne: from } } }],
                    as: 'recipientObj',
                }
            },
        ]).match({ recipients: { $all: [{ $elemMatch: { $eq: from } }] } })
            .project({
                'recipients': 0,
                'recipientObj.password': 0,
                'recipientObj.__v': 0,
                'recipientObj.date': 0,
                'recipientObj.created_at': 0,
                'recipientObj.last_updated_on': 0,
                'recipientObj.other_msisdn': 0,
                'recipientObj.status': 0,
                'recipientObj.active_status': 0,
                'recipientObj.role': 0,
                'recipientObj.description': 0,
                'recipientObj.tags': 0,
                'recipientObj.category': 0,
                'recipientObj.occupation': 0,
                'recipientObj.gender': 0,
                'recipientObj.presented_office': 0,
                'recipientObj.stage_name': 0,
                'recipientObj.department': 0,
                'recipientObj.business_number': 0,
                'recipientObj.business_address': 0,
                'recipientObj.organization_number': 0
            })
            .then((conversations) => {
                // console.log(conversations)
                resolve(conversations);
            });
    });
}


const subHttpRequestTag = (sub_tag_id: any, sub_sub_tag_id: any) => {
    return new Promise(async (resolve, reject) => {
        await subSubTagModal.find({ id: { $in: sub_sub_tag_id }, sub_tag_id: sub_tag_id }).then((sub_tegCategory) => {
            resolve(sub_tegCategory)
        })
    })
}

/**
* store file under a folder uploads
* @function storage  multer
* */
let storage = multer.diskStorage({
    destination: async (req, file, callBack) => {
        /**  
        * @desc get params appended to FormData() we use project id to create project folders 
        * @const body
        * */

        const body = await req.body;

        /**
        * @desc  ssaccess project folders
        *  */
        fs.access(project_folder, (error) => {
            /**
            * @desc  To check if the given directory already exists or not s
            * */
            if (error) {
                /**
                * @desc  If current directory does not exist then create it; here we create directory 
                * */
                fs.mkdir(project_folder, (error) => {
                    callBack(null, project_folder)
                });
            } else {
                /**
                * @callback callback
                * @desc file destination saved folder;; the path is defined in config index.ts file 
                * */
                callBack(null, project_folder) //csv destination saved folder;; the path is defined in config index.ts file
            }
        });
    },
    filename: (req, file, callBack) => {
        callBack(
            null,
            file.fieldname + '-' + Date.now() + path.extname(file.originalname), /**@desc save file with data and storage */
        )
    }
})
export const upload = multer({
    storage: storage
});



// sockee