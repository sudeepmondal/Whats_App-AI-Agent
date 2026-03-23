/**
 * WhatsApp Baileys Gateway Server (Fixed Version)
 */

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");

const express = require("express");
const axios   = require("axios");
const qrcode  = require("qrcode-terminal");
const pino    = require("pino");
require("dotenv").config({ path: "../.env" });

// ── Config ───────────────────────────────────────────────────
const PORT            = process.env.GATEWAY_PORT    || 3001;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "http://localhost:5678/webhook/whatsapp";
const MY_PHONE        = process.env.MY_PHONE_NUMBER || "";
const MY_NAME         = process.env.MY_NAME         || "";

let sock;
let isConnected = false;

// ── Connect to WhatsApp ───────────────────────────────────────
async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
  const { version }          = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    auth:   state,
    browser: ["WhatsApp AI Agent", "Chrome", "1.0.0"],
    printQRInTerminal: false,
  });

  // ── Connection Events ─────────────────────────────────────
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("\n📱 QR Code scan করো WhatsApp থেকে:\n");
      qrcode.generate(qr, { small: true });
      console.log("\n(WhatsApp → Linked Devices → Link a Device)\n");
    }

    if (connection === "close") {
      isConnected = false;
      const code  = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;
      console.log("❌ Connection বন্ধ। Code:", code, "| Reconnect:", shouldReconnect);
      if (shouldReconnect) {
        setTimeout(connectToWhatsApp, 5000);
      }
    } else if (connection === "open") {
      isConnected = true;
      console.log("✅ WhatsApp connected!");
      console.log("📡 Webhook:", N8N_WEBHOOK_URL);
    }
  });

  sock.ev.on("creds.update", saveCreds);

  // ── Incoming Messages ─────────────────────────────────────
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      try {
        await handleIncomingMessage(msg);
      } catch (err) {
        console.error("❌ Message error:", err.message);
      }
    }
  });
}

// ── Message Handler ───────────────────────────────────────────
async function handleIncomingMessage(msg) {
  const jid     = msg.key.remoteJid;
  const isGroup = jid.endsWith("@g.us");
  const fromMe  = msg.key.fromMe;
  const msgId   = msg.key.id;

  if (fromMe) return;

  const messageContent =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption    ||
    msg.message?.videoMessage?.caption    ||
    "";

  if (!messageContent) return;

  let senderNumber = isGroup ? (msg.key.participant || "") : jid;
  let senderName   = msg.pushName || senderNumber.split("@")[0];

  const payload = {
    msgId,
    jid,
    isGroup,
    senderNumber: senderNumber.split("@")[0],
    senderName,
    messageContent,
    myName:  MY_NAME,
    myPhone: MY_PHONE,
    timestamp: Date.now(),
  };

  console.log(`\n📨 ${isGroup ? "GROUP" : "PERSONAL"} | ${senderName}: ${messageContent.substring(0, 60)}`);

  try {
    await axios.post(N8N_WEBHOOK_URL, payload, {
      timeout: 30000,
      headers: { "Content-Type": "application/json" },
    });
    console.log("   ✅ n8n এ পাঠানো হয়েছে");
  } catch (err) {
    console.error("   ❌ n8n error:", err.message);
  }
}

// ── Express Server ────────────────────────────────────────────
const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: isConnected ? "connected" : "disconnected" });
});

app.post("/send-message", async (req, res) => {
  if (!isConnected || !sock) {
    return res.status(503).json({ error: "WhatsApp not connected" });
  }

  const { jid, message } = req.body;
  if (!jid || !message) {
    return res.status(400).json({ error: "jid and message required" });
  }

  try {
    await sock.sendPresenceUpdate("composing", jid);
    await new Promise(r => setTimeout(r, 1000));
    await sock.sendMessage(jid, { text: message });
    await sock.sendPresenceUpdate("paused", jid);
    console.log(`📤 Reply sent → ${jid}`);
    res.json({ success: true });
  } catch (err) {
    console.error("Send error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Gateway চালু → http://localhost:${PORT}`);
  console.log("⏳ WhatsApp connect হচ্ছে...\n");
});

connectToWhatsApp();