const {
    WAConnection,
    Browsers
} = require('@adiwajshing/baileys')
const fs = require('fs')
const qrcode = require('qrcode-terminal')
const Session = require("../Db/sessionModel");
// const db = mongoose.connection

const conn = new WAConnection()

exports.Whatsapp = conn

exports.connect = async () => {
    // Custom browser
    conn.browserDescription = Browsers.macOS('Chrome')

    let alreadyThere = await Session.findOne({ ID: 'PROD' }).exec();
    if (alreadyThere) {
        conn.loadAuthInfo(alreadyThere.session)
        console.log("Loaded Session From DB")
    } else {
        conn.on('qr', async (qr) => {
            console.log('Scan the QR code above.')
            qrcode.generate(qr, { small: true });

            conn.on('open', async () => {
                const authInfo = conn.base64EncodedAuthInfo()
                let alreadyThere = await Session.findOne({ ID: 'PROD' }).exec();
                if (alreadyThere) {
                    const filter = { ID: 'PROD' }
                    const update = { session: authInfo }
                    const updateSession = await User.findOneAndUpdate(filter, update);
                    console.log('Session Updated');
                }
                else {
                    const addSession = await new Session({ ID: 'PROD', session: authInfo });
                    addSession.save(function (err) {
                        if (err) return handleError(err);
                    });
                }

            })
        })
    }
    await conn.connect({ timeoutMs: 3 * 1000 })
    console.log(`| + WA Version: ${conn.user.phone.wa_version}`)
    console.log(`| + Device: ${conn.user.phone.device_manufacturer}`)
    return conn
}
