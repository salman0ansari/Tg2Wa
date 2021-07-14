const con = require('./connect')
const {
    Mimetype,
    MessageType
} = require('@adiwajshing/baileys')
const fs = require('fs')
const wa = con.Whatsapp

exports.sendText = function (jid, text) {
    wa.sendMessage(jid, text, MessageType.text)
}

exports.sendSticker = function (jid, url) {
    wa.sendMessage(
        jid + '@s.whatsapp.net',
        { url: url },
        MessageType.sticker, { mimetype: Mimetype.sticker }
    ).then((result) => {
        console.log('Sticker Sended')
    })
    .catch((err) => console.log('Error Sending Sticker'))
}

exports.sendImage = async(from, buffer, caption = "") => {
    await wa.sendMessage(from, buffer, MessageType.image, { caption: caption })
}

exports.sendGif = (from, gif) => {
	wa.sendMessage(from, gif, MessageType.video, {mimetype: "video/gif"})
}


//incomplete
// exports.sendMediaURL = async(to, 