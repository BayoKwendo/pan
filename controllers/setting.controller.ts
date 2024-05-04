import { categoryModal, subSubTagModal, subTagModal, tagModal } from './../helpers/schema';
import { table } from "../helpers/schema";
import dotenv from 'dotenv';
import logger from "../middlewares/logger";
import { emailSent, getNextSequenceValue } from "../helpers";
import util from 'util';
import { HttpRequest } from 'aws-sdk';


export default {

    /**
        * @name POST 
        * @desc controller to add   user values in the 
        * @name addCategory config table
    * */
    addCategory: async (req: any, res: any) => {
        logger.info(`/POST category`);
        try {
            const body = await req.body;

            /**
                * @desc variable declaration 
                * @name insertCategory
                *  @name errorCheck
                */
            let insertData: any;
            const mid = await getNextSequenceValue(`${table.category}`)

            if (req.locals.role == "admin") {
                insertData = {
                    id: mid,
                    category_name: `${body.name}`
                };
                const vqueue = new categoryModal(insertData);
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
        * @name PUT 
        * @name updateXategory config table
    * */
    updateCategory: async (req: any, res: any) => {
        logger.info(`/POST category`);
        try {
            const body = await req.body;

            /**
            * @desc variable declaration 
            * @name updateCategory
            *  @name errorCheck
            */
            if (req.locals.role == "admin") {
                await categoryModal.updateOne({ id: `${body.id}` }, { category_name: `${body.name}` }).then(async (resp: any) => {
                    if (resp.modifiedCount > 0) {
                        res.status(200).send({
                            Status: true,
                            StatusCode: 0,
                            StatusMessage: "הצלחת!"
                        });
                    } else {
                        res.status(400).send({
                            Status: false,
                            StatusCode: 2,
                            StatusMessage: 'סיסמאחדשה תואמת את הישנה. נסה שוב',
                        })
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
                    StatusMessage: "Only admin can edit Category"
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
     * @name category controller
     */
    getCategoryTable: async (req: any, res: any) => {
        logger.info(`/ GET category`);
        try {
            /**
                * @desc sql query get all the @name getCategoryTable 
                * @desc fech by either @name status,role,active_status 
                * and @name id                    
            * */

            let categoryData = await categoryModal.find({})

            res.status(200).send({
                Status: true,
                StatusCode: 0,
                Name: 'Category',
                Data: categoryData,
                StatusMessage: "הצלחת!"
            });
        } catch (error) {
            /**
            * @return 
            * cat47:01:47
             ch error is send out here 
            * */
            res.status(400).send({
                Status: false,
                StatusCode: 2,
                StatusMessage: `${error}`
            })
        }
    },


    /**
   * @name DELETE
   * @name category controller
 */
    deleteCategoryTable: async (req: any, res: any) => {
        logger.info(`/DELETE category`);
        try {
            let id = req.params.id;
            /**
                * @desc sql query get all the @name getTagTable 
                * @name status,role,active_status and
                * @name id                    
            * */
            if (req.locals.role == "admin") {

                let categoryData = await categoryModal.deleteOne({ id: id })
                if (categoryData.deletedCount > 0) {
                    res.status(200).send({
                        Status: true,
                        StatusCode: 0,
                        Name: 'Category',
                        Data: categoryData,
                        StatusMessage: "הצלחת!"
                    });
                } else {
                    res.status(400).send({
                        Status: false,
                        StatusCode: 1,
                        Name: 'Category',
                        StatusMessage: "Category not found"
                    });
                }
            } else {
                res.status(400).send({
                    Status: false,
                    StatusCode: 2,
                    StatusMessage: "Only admin can delete Category"
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
        * @name POST 
        * @desc controller to add   user values in the 
        * @name addTag config table
    * */
    addTag: async (req: any, res: any) => {
        logger.info(`/POST tags`);

        try {
            const body = await req.body;

            /**
            * @desc variable declaration 
            * @name insertTags
            *  @name errorCheck
            */
            let insertData: any;
            if (req.locals.role == "admin") {

                const mid = await getNextSequenceValue(`${table.tags}`)
                insertData = {
                    id: mid,
                    tag_type: `${body.tag_type}`,
                    tag_name: `${body.name}`
                };
                const vqueue = new tagModal(insertData);
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
            } else {
                res.status(400).send({
                    Status: false,
                    StatusCode: 2,
                    StatusMessage: "Only admin can add Tags"
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
       * @name POST 
       * @desc controller to add sub tag values in the 
       * @name addSubTag config table
   * */
    addSubTag: async (req: any, res: any) => {
        logger.info(`/POST sub tags`);

        try {
            const body = await req.body;
            /**
                * @desc variable declaration 
                * @name insertTags
                * @name errorCheck
            */
            let insertData: any;
            let tagData = await tagModal.find({ id: body.tag_id })
            if (tagData && tagData.length > 0) {
                if (req.locals.role == "admin") {
                    const mid = await getNextSequenceValue(`${table.sub_tags}`)

                    insertData = {
                        id: mid,
                        tag_id: body.tag_id,
                        sub_tag_name: `${body.sub_tag_name}`
                    };

                    const vqueue = new subTagModal(insertData);
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
                } else {
                    res.status(400).send({
                        Status: false,
                        StatusCode: 2,
                        StatusMessage: "Only admin can add sub Tags"
                    });
                }
            }
            else {
                res.status(400).send({
                    Status: false,
                    StatusCode: 2,
                    StatusMessage: "Tag Category not found"
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
     * @name PUT 
     * @name updateTag config table
 * */
    updateSubTag: async (req: any, res: any) => {
        logger.info(`/PUT sub tags`);
        try {
            const body = await req.body;

            /**
            * @desc variable declaration 
            * @name updateTags
            *  @name errorCheck
            */
            if (req.locals.role == "admin") {

                await subTagModal.updateOne({ id: `${body.id}` }, { sub_tag_name: `${body.sub_tag_name}` }).then(async (resp: any) => {


                    if (resp.modifiedCount > 0) {
                        res.status(200).send({
                            Status: true,
                            StatusCode: 0,
                            StatusMessage: "הצלחת!"
                        });
                    } else {
                        res.status(400).send({
                            Status: false,
                            StatusCode: 2,
                            StatusMessage: 'סיסמאחדשה תואמת את הישנה. נסה שוב'
                        })
                    }
                }).catch((error) => {
                    /**
                     * @return
                    * */
                    res.status(400).send({
                        Status: false,
                        StatusCode: 2,
                        StatusMessage: `${error}`
                    });
                });
            } else {
                res.status(400).send({
                    Status: false,
                    StatusCode: 2,
                    StatusMessage: "Only admin can edit sub Tags"
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
     * @name POST 
     * @desc controller to add sub tag values in the 
     * @name addSubTag config table
 * */
    addSubSubTag: async (req: any, res: any) => {
        logger.info(`/POST sub sub tags`);
        try {
            const body = await req.body;
            /**
                * @desc variable declaration 
                * @name insertTags
                * @name errorCheck
            */
            let insertData: any;
            let tagData = await subTagModal.find({ id: body.sub_tag_id })
            if (tagData && tagData.length > 0) {
                if (req.locals.role == "admin") {
                    const mid = await getNextSequenceValue(`${table.sub_sub_tags}`)

                    insertData = {
                        id: mid,
                        sub_tag_id: body.sub_tag_id,
                        sub_sub_tag_name: `${body.sub_sub_tag_name}`
                    };

                    const vqueue = new subSubTagModal(insertData);
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
                } else {
                    res.status(400).send({
                        Status: false,
                        StatusCode: 2,
                        StatusMessage: "Only admin can add sub sub Tags"
                    });
                }
            }
            else {
                res.status(400).send({
                    Status: false,
                    StatusCode: 2,
                    StatusMessage: "Sub Tag Category not found"
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
     * @name PUT >
     * @name updateTag config table
 * */
    updateSubSubTag: async (req: any, res: any) => {
        logger.info(`/PUT sub tags`);
        try {
            const body = await req.body;

            /**
            * @desc variable declaration 
            * @name updateTags
            *  @name errorCheck
            */
            if (req.locals.role == "admin") {

                await subSubTagModal.updateOne({ id: `${body.id}` }, { sub_sub_tag_name: `${body.sub_sub_tag_name}` })
                    .then(async (resp: any) => {
                        if (resp.modifiedCount > 0) {
                            res.status(200).send({
                                Status: true,
                                StatusCode: 0,
                                StatusMessage: "הצלחת!"
                            });
                        } else {
                            res.status(400).send({
                                Status: false,
                                StatusCode: 2,
                                StatusMessage: 'סיסמאחדשה תואמת את הישנה. נסה שוב'
                            })
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
                    StatusMessage: "Only admin can edit sub sub Tags"
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
       * @name PUT 
       * @name updateTag config table
   * */
    updateTag: async (req: any, res: any) => {
        logger.info(`/PUT tags`);
        try {
            const body = await req.body;

            /**
            * @desc variable declaration 
            * @name updateTags
            *  @name errorCheck
            */
            if (req.locals.role == "admin") {
                await tagModal.updateOne({ id: `${body.id}` }, { tag_name: `${body.name}` })
                    .then(async (resp: any) => {
                        if (resp.modifiedCount > 0) {
                            res.status(200).send({
                                Status: true,
                                StatusCode: 0,
                                StatusMessage: "הצלחת!"
                            });
                        } else {
                            res.status(400).send({
                                Status: false,
                                StatusCode: 2,
                                StatusMessage: 'סיסמאחדשה תואמת את הישנה. נסה שוב',
                            })
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
                    StatusMessage: "Only admin can edit Tags"
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
     * @name tag controller
     */
    getTagTable: async (req: any, res: any) => {
        logger.info(`/ GET tag`); ``
        try {
            /** 
                * @desc sql query get all the
                    * @name getTagTable 
                    * @desc fech by either 
                    * @name status,role,active_status and
                * @name id                    
            * */
            let tag_type = req.query.tag_type;
            let mrole = req.locals.role;
            let tags_type = ["private", "business", "institution"]
            if (mrole == 'artist') {
                tags_type = [tag_type]
            }
            if (mrole == "private_customer") {
                tags_type = ["private"]
            }
            if (mrole == "business_customer") {
                tags_type = ["business"]
            }
            if (mrole == "institutional_customer") {
                tags_type = ["institution"]
            }
            /**
             * @desc main tag category 
             * */
            await tagModal.find({ tag_type: { $in: tags_type } }).then(async (tegCategory) => {
                let results_temp = Array();
                for (let k = 0; k < tegCategory.length; k++) {
                    const results = await mHttpRequest(tegCategory[k].id)
                    let mtagname = { "tag_name": tegCategory[k].tag_name }
                    let mtagid = { "id": tegCategory[k].id }
                    let mtagtype = { "tag_type": tegCategory[k].tag_type }
                    let mtagstatus = { "active_status": tegCategory[k].active_status }
                    let msubcategory = { "sub_category": results }
                    results_temp.push(Object.assign(mtagid, mtagname, mtagtype, mtagstatus, msubcategory))
                }
                res.status(200).send({
                    Status: true,
                    StatusCode: 0,
                    Name: 'Tag',
                    Data: results_temp,
                    StatusMessage: "הצלחת!"
                });
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
       * @name DELETE
       * @name tag_sub_sub controller
     */
    deleteSubTagTable: async (req: any, res: any) => {
        logger.info(`/DELETE tag`);
        try {
            let id = req.params.id;
            /**
                * @desc sql query get all the @name getTagTable 
                * @name status,role,active_status and
                * @name id                    
            * */
            if (req.locals.role == "admin") {
                let tagData = await subSubTagModal.deleteOne({ id: id })
                if (tagData.deletedCount > 0) {
                    res.status(200).send({
                        Status: true,
                        StatusCode: 0,
                        Name: 'Sub Sub Tag',
                        Data: tagData,
                        StatusMessage: "הצלחת!"
                    });
                } else {
                    res.status(400).send({
                        Status: false,
                        StatusCode: 1,
                        Name: 'Sub Sub Tag',
                        StatusMessage: "Sub Sub Tag not found"
                    });
                }
            } else {
                res.status(400).send({
                    Status: false,
                    StatusCode: 2,
                    StatusMessage: "Only admin can delete sub sub Tags"
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
}

async function mHttpRequest(tag_id: any) {
    return new Promise((resolve, reject) => {
        let sub_tegProccess = Array()
        subTagModal.find({ tag_id: tag_id }).then(async (sub_tegCategory) => {
            if (sub_tegCategory.length > 0) {
                for (let l = 0; l < sub_tegCategory.length; l++) {
                    const results: any = await subHttpRequest(sub_tegCategory[l].id)
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


async function subHttpRequest(sub_tag_id: any) {
    return new Promise(async (resolve, reject) => {
        await subSubTagModal.find({ sub_tag_id: sub_tag_id }).then((sub_tegCategory) => {
            resolve(sub_tegCategory)
        })
    })
}