import mongoose from 'mongoose';

/**
    * MONGO TABLES
    * @export table
*/
export const table = {
    users: 'users',
    verification: 'verifications',
    db_queue: 'db_queues',
    shows: 'shows',
    counters: 'counters',
    eventlabel: 'eventlabel',
    quotations: 'quotations',
    global_id: 'global_quote_id',
    events: 'events',
    quotation_logs: 'quotation_logs',
    scheduler: 'scheduler',
    showevent: 'show_ids',
    category: 'category',
    tags: 'tags',
    conversation: 'conversation',
    messages: 'messages',
    event_type: 'event_type',
    sub_tags: 'sub_tags',
    sub_sub_tags: 'sub_sub_tags'

}

/**
   * @desc @name counter_table 
 * */
const CounterSchema = new mongoose.Schema({
    _id: {
        type: String,
    },
    sequence_value: {
        type: Number,
        required: true,
    }
});

// counterModel
export const counterModel = mongoose.model(`${table.counters}`, CounterSchema);

/**
    * @desc create user table
    * @export user_table
*/
const UserSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true,
    },
    first_name: {
        type: String,
        minlength: 1,
        maxlength: 100,
        required: [true, 'First name is required']
    },
    last_name: {
        type: String,
        minlength: 1,
        maxlength: 100,
        required: [true, 'Last name is required!']
    },
    email: {
        type: String,
        minlength: 1,
        maxlength: 100,
        unique: true,
        required: false,
    },
    msisdn: {
        type: Number,
        minlength: 110,
        maxlength: 13,
        unique: true,
        required: true,
    },
    other_msisdn: {
        type: String,
        minlength: 1,
        maxlength: 100,
        default: "0",
        required: false,
    },
    organization_name: {
        type: String,
        required: false,
    },
    organization_number: {
        type: Number,
        minlength: 1,
        maxlength: 100,
    },
    business_address: {
        type: String,
        minlength: 1,
        default: 0,
        maxlength: 100,
    },
    business_number: {
        type: String,
        minlength: 1,
        default: "0",
        maxlength: 100,
    },
    department: {
        type: String,
        minlength: 1,
        default: "0",
        maxlength: 100,
    },
    stage_name: {
        type: String,
        minlength: 1,
        default: "0",
        maxlength: 100,
    },
    presented_office: {
        type: String,
        minlength: 1,
        default: "0",
        maxlength: 1000,
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'transagender', 'both', 'unknown'], //possible alternatives
        default: 'unknown'
    },
    occupation: {
        type: String
    },
    category: {
        type: String,
        minlength: 0,
        maxlength: 100,
    },
    profile_url: {
        type: String,
        default: ''
    },
    cover_url: {
        type: String,
        default: ''
    },
    tags: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    password: {
        type: String,
        minlength: 0,
        maxlength: 100,
        required: true,
    },
    role: {
        type: String,
        enum: ['private_customer', 'business_customer', 'institutional_customer', 'artist', 'admin'], //enums
        required: true,
    },
    active_status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'inactive'
    },
    status: {
        type: String,
        enum: ['approved', 'pending', 'declined'],
        default: 'pending',
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'last_updated_on' } });
export const userModel = mongoose.model(`${table.users}`, UserSchema); // use schema




/**
 * @desc verification table 
 * */
const VerificationSchema = new mongoose.Schema({
    email: {
        type: String,
        required: false,
    },
    msisdn: {
        type: Number,
        minlength: 5,
        maxlength: 13,
        required: false,
    },
    code: {
        type: String,
        unique: true,
        required: true,
    },
    status: {
        type: Number,
        default: 0,
        required: true,
    },
    created: {
        type: Number,
        default: 0,
        required: false
    },
    expired: {
        type: Number,
        default: 0,
        required: true
    },
    active_status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'inactive'
    }
}, { timestamps: { createdAt: 'date_created', updatedAt: 'modified' } });
export const verificationModel = mongoose.model(`${table.verification}`, VerificationSchema); // verification data table

/**@desc  dbQueue */
/**@desc dbqueue table */

const dbQueueSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    msisdn: {
        type: String,
        minlength: 0,
        maxlength: 100,
        required: true,
    },
    message: {
        type: String,
        minlength: 0,
        maxlength: 100,
        required: true,
    },
    status: {
        type: String,
        default: '0',
        enum: ['0', '1'],
    },
    active_status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'inactive'
    }
}, {
    timestamps: {
        createdAt: 'created_on',
        updatedAt: 'last_updated_on'
    }
});
export const dbQueueModel = mongoose.model(`${table.db_queue}`, dbQueueSchema);


/**
   * @desc  @name eventSchema 
   * @desc event table 
 * */
const EventSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    profile_id: {
        type: Number,
        required: true,
        ref: `${table.users}`
    },
    shows: {
        type: String,
        ref: `${table.shows}`
    },
    name: {
        type: String,
    },
    date: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    crowd_amount: {
        type: String,
        default: 0,
        required: true,
    },
    min_crowd_amount: {
        type: String,
        default: 0,
        required: true,
    },
    max_crowd_amount: {
        type: String,
        default: 0,
        required: true,
    },
    budget: {
        type: String,
        default: 0,
        required: true,
    },
    min_budget: {
        type: Number,
        default: 0,
        required: true,
    },
    max_budget: {
        type: Number,
        default: 0,
        required: true,
    },
    tags: {
        type: String,
        default: '0'
    },
    event_type: {
        type: String,
        default: 'private'
    },
    // age_restriction                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      restriction: {
    //     type: String,
    //     default: 'NO',
    //     enum: ['YES', 'NO'],
    // },
    note: {
        type: String,
    },
    status: {
        type: String,
        default: 'draft',
        enum: ["draft", "waiting for suppliers confirmation", "waiting for customer response", "some of the suppliers didnt confirm quotation", "approved"]
    },
    active_status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'inactive'
    }
}, { timestamps: { createdAt: 'created_on', updatedAt: 'last_updated_on' } });

export const eventModal = mongoose.model(`${table.events}`, EventSchema);



/**
   * @desc  @name showSchema
   * 
   * @desc event table 
 * */
const ShowSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    profile_id: {
        type: Number,
        required: true,
        ref: `${table.users}`
    },
    event_id: {
        type: Number,
        required: true,
        ref: `${table.events}`
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },

    includes: {
        type: String,
        required: true,
    },
    show_type: {
        type: String,
        enum: ['private', 'business', 'institution'],
        required: true,
    },
    age_restriction: {
        type: String,
        default: '0',
    },
    duration: {
        type: String,
        required: true,
        default: '0'
    },
    url: {
        type: String
    },
    crowd_amount: {
        type: String,
        default: 0,
        required: true,
    },
    price: {
        type: String,
        default: 0
    },
    min_price: {
        type: String,
        default: 0
    },
    max_price: {
        type: String,
        default: 0
    },
    tags: {
        type: String,
        default: '0'
    },
    active_status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, { timestamps: { createdAt: 'created_on', updatedAt: 'last_updated_on' } });


// show Modal 
export const showModal = mongoose.model(`${table.shows}`, ShowSchema);
/**
     * @desc  
     * @name quotationScheme
     *  
 * */
/**
    * @desc event table 
    * 
 * */
const QuotationSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    // artist_id: {
    //     type: Number,
    //     ref: `${table.users}`
    // },
    profile_id: {
        type: Number,
        required: true,
        ref: `${table.users}`
    },
    amount: {
        type: Number,
        default: 0,
    },
    events: {
        type: mongoose.Types.ObjectId,
        ref: `${table.events}`
    },
    event_id: {
        type: String,
        required: true,
        ref: `${table.events}`
    },
    artist_id: {
        type: Number,
        required: true
    },
    global_id: {
        type: Number,
        required: true
    },
    show_id: {
        type: Number,
        required: true
    },
    notes: {
        type: String,
    },
    quote_status: {
        type: String,
        enum: ["waiting for the supplier response", "waiting for the client response", "declined by supplier", "declined by client", "approved"],
        default: 'waiting for the supplier response'
    },
    active_status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, { timestamps: { createdAt: 'created_on', updatedAt: 'last_updated_on' } });

export const quotationModal = mongoose.model(`${table.quotations}`, QuotationSchema);

const QuotationLogsSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    artist_id: {
        type: Number,
    },
    profile_id: {
        type: Number,
        ref: `${table.users}`
    },
    quote_id: {
        type: Number,
        ref: `${table.quotation_logs}`
    },
    role: {
        type: String,
        require: true
    },
    quote_status: {
        type: String,
        enum: ["waiting for the supplier response", "waiting for the client response", "declined by supplier", "declined by client", "approved"],
        default: 'waiting for the supplier response'
    },
    response_status: {
        type: String,
    },
    description: {
        type: String,
    }
}, { timestamps: { createdAt: 'created_on', updatedAt: 'last_updated_on' } });
export const quotationLogModal = mongoose.model(`${table.quotation_logs}`, QuotationLogsSchema);
/** 
    * @desc quotation logs Modal 
 * */
const ShowIDSchema = new mongoose.Schema({
    show_id: {
        type: Number,
        required: true,
    },
    event_id: {
        type: Number,
        required: true,
    },
}, { timestamps: { createdAt: 'created_on', updatedAt: 'last_updated_on' } });
export const showEventModal = mongoose.model(`${table.showevent}`, ShowIDSchema);

const EventLabelSchema = new mongoose.Schema({

    event_label: {
        type: Number,
        required: true,
    },
}, { timestamps: { createdAt: 'created_on', updatedAt: 'last_updated_on' } });
export const eventNameSchema = mongoose.model(`${table.eventlabel}`, EventLabelSchema);

const schedulerID = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    artist_id: {
        type: Number,
    },
    quote_id: {
        type: Number
    },
    show_id: {
        type: Number,
        ref: `${table.shows}`
    },
    start_date: {
        type: String,
    },
    end_date: {
        type: String,
    },
    start_time: {
        type: String,
        require: true
    },
    end_time: {
        type: String,
        require: true
    },
    status: {
        type: String,
        enum: ['closed_quote', 'blocked', 'not_closed_quote'],
        default: 'not_closed_quote'

    },
    description: {
        type: String,
    },
    active_status: {
        type: String,
        enum: ['unavailable', 'available'],
        default: 'unavailable'
    }
}, { timestamps: { createdAt: 'created_on', updatedAt: 'last_updated_on' } });
export const scheduleModal = mongoose.model(`${table.scheduler}`, schedulerID);


/**
  * @desc @name category schema 
 * */


const eventTypeSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    active_status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, { timestamps: { createdAt: 'created_on', updatedAt: 'last_updated_on' } });
export const eventTypeModal = mongoose.model(`${table.event_type}`, eventTypeSchema);

const categorySchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    category_name: {
        type: String,
        unique: true,
        required: true
    },
    active_status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, { timestamps: { createdAt: 'created_on', updatedAt: 'last_updated_on' } });
export const categoryModal = mongoose.model(`${table.category}`, categorySchema);


const tagSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    tag_name: {
        type: String,
        required: true
    },
    tag_type: {
        type: String,
        default: 'private',
        enum: ['private', 'business', 'institution'],
    },
    active_status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, { timestamps: { createdAt: 'created_on', updatedAt: 'last_updated_on' } });
export const tagModal = mongoose.model(`${table.tags}`, tagSchema);

const subTagSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    tag_id: {
        type: Number,
        required: true
    },
    sub_tag_name: {
        type: String,
        required: true
    },
    active_status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, { timestamps: { createdAt: 'created_on', updatedAt: 'last_updated_on' } });
export const subTagModal = mongoose.model(`${table.sub_tags}`, subTagSchema);

const subSubTagSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    sub_tag_id: {
        type: Number,
        required: true
    },
    sub_sub_tag_name: {
        type: String,
        required: true
    },
    active_status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, { timestamps: { createdAt: 'created_on', updatedAt: 'last_updated_on' } });


export const subSubTagModal = mongoose.model(`${table.sub_sub_tags}`, subSubTagSchema);


const ConversationSchema = new mongoose.Schema({
    recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
    lastMessage: {
        type: String,
    },
    date: {
        type: String,
        default: Date.now,
    },
}, { timestamps: { createdAt: 'created_on', updatedAt: 'last_updated_on' } });
// eslint-disable-next-line no-undef
export const conversationModal = mongoose.model(`${table.conversation}`, ConversationSchema);

// Create Schema for Users
const MessageSchema = new mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: `${table.conversation}`,
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: `${table.users}`,
    },
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
    },
    body: {
        type: String,
        required: true,
    },
    date: {
        type: String,
        default: Date.now,
    },
}, { timestamps: { createdAt: 'created_on', updatedAt: 'last_updated_on' } });
export const messageModal = mongoose.model(`${table.messages}`, MessageSchema);
