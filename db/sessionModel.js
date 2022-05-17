const mongooose = require('mongoose');

const sessionModel = new mongooose.Schema({
    ID: {
        type: String,
        required: true,
    },
    session: {
        type: Object,
        required: false,
        unique: true
    },
    updated_at: { 
        type: Date, default: Date.now 
    }
})

const Session = mongooose.model('Session', sessionModel);

module.exports = Session;
