var mongoose = require('mongoose')
const { mongoUrl } = require('./config.js')

mongoose.connect(mongoUrl)// Get Mongoose to use the global promise library
mongoose.Promise = global.Promise// Get the default connection
let db = mongoose.connection

// Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'))
db.once('open', () => { console.log('CONNECTED OK') })

module.exports = db
