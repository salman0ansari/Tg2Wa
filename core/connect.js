const {
  default: makeWASocket,
  DisconnectReason,
  makeInMemoryStore,
  useSingleFileAuthState,
} = require("@adiwajshing/baileys");
const path = require("path");
const P = require("pino");

// start a connection
exports.makeWASocket = () => {
  const store = makeInMemoryStore({});
  
  store?.readFromFile(path.join(__dirname, `/store.json`));
  // save every 10s
  setInterval(() => { store?.writeToFile(path.join(__dirname, `/store.json`))}, 10_000);

  const msgRetryCounterMap = {};

  const { state, saveState } = useSingleFileAuthState(path.join(__dirname, `/skynet.json`))

  const sock = makeWASocket({
    printQRInTerminal: true,
    auth: state,
    logger: P({ level: "silent" }),
    msgRetryCounterMap,
  });

  store?.bind(sock.ev);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      // reconnect if not logged out
      if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) { startSock() } 
      else { console.log("Connection closed. You are logged out.")}
    }
    console.log("connection update", update);
  });

  sock.ev.on("creds.update", saveState);

  return sock;
};
