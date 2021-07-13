const {
    WAConnection,
    Browsers
} = require('@adiwajshing/baileys')
const fs = require('fs')
const qrcode = require('qrcode-terminal')

const conn = new WAConnection()

exports.Whatsapp = conn

exports.connect = async () => {

    // Custom browser
    conn.browserDescription = Browsers.macOS('Chrome')
    
    conn.on('qr', async (qr) => {
        console.log('Scan the QR code above.')
        qrcode.generate(qr, { small: true });
    })
    fs.existsSync('./session_data.json') && conn.loadAuthInfo('./session_data.json')

    await conn.connect({ timeoutMs: 3*1000 })
    fs.writeFileSync('./session_data.json', JSON.stringify(conn.base64EncodedAuthInfo(), null, '\t'))
    console.log('='.repeat(50))
    console.log(`| + WA Version: ${conn.user.phone.wa_version}`)
    console.log(`| + Device: ${conn.user.phone.device_manufacturer}`)
    console.log('='.repeat(50))
    return conn
}