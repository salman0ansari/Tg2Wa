exports.sendText = async function (sock, jid, text) {
  await sock.sendMessage(jid, { text: text });
};

exports.sendSticker = async function (sock, jid, url) {
  await sock.sendMessage(jid + '@s.whatsapp.net', {
    sticker: { url: url },
    mimetype: "image/webp",
  });
};

exports.sendImage = async (sock, jid, buffer, caption = "") => {
  await sock.sendMessage(jid + '@s.whatsapp.net', {
    mimetype: "image/jpeg",
    image: buffer,
    caption: caption,
  });
};

exports.sendAnimatedSticker = async (sock, jid, url) => { return }
