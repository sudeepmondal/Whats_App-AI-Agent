<div align="center">

<img src="https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" />
<img src="https://img.shields.io/badge/n8n-EA4B71?style=for-the-badge&logo=n8n&logoColor=white" />
<img src="https://img.shields.io/badge/Groq-F55036?style=for-the-badge&logo=groq&logoColor=white" />
<img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
<img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" />

<br/><br/>

# 🤖 WhatsApp AI Auto-Reply Agent

### Fully automated WhatsApp reply bot powered by **Baileys** + **n8n** + **Groq LLaMA 3**  
Reply to personal & group chats automatically — completely **free** to run.

<br/>

[🚀 Quick Start](#-quick-start) · [📐 Architecture](#-architecture) · [⚙️ Configuration](#️-configuration) · [🧪 Testing](#-testing) · [❓ FAQ](#-faq)

<br/>

![demo](https://img.shields.io/badge/Status-Working-brightgreen?style=flat-square)
![node](https://img.shields.io/badge/Node.js-v18+-green?style=flat-square)
![n8n](https://img.shields.io/badge/n8n-v2.10+-orange?style=flat-square)

</div>

---

## ✨ Features

- 📨 **Auto-reply** to personal WhatsApp chats instantly
- 👥 **Group chat support** — replies only when your name is mentioned
- 🧠 **AI-powered** responses using Groq's LLaMA 3.3 (free tier)
- 💬 **Context-aware** — replies in the same language as the incoming message (Bangla/English)
- ⏱️ **Human-like typing delay** — simulates real typing before sending
- 🚫 **Spam filter** — ignores spam, bots, and your own messages
- 🌙 **Sleep mode** — auto-disables replies at night (configurable)
- 🔒 **Blacklist** — block specific numbers from getting replies
- 🎭 **Personality modes** — friendly, professional, funny, casual
- 💰 **100% free** — runs locally, no paid APIs required

---

## 📐 Architecture

```
┌─────────────────┐     webhook      ┌──────────────────────────────────────┐
│                 │ ───────────────▶ │           n8n Workflow               │
│  WhatsApp Web   │                  │                                      │
│  (via Baileys)  │                  │  Webhook → Preprocess → IF Filter    │
│                 │                  │       ↓                  ↓           │
│  Your Phone     │                  │  Groq LLM API      Skip (no reply)   │
│  Linked Device  │◀─────────────── │       ↓                              │
│                 │   POST /send     │  Extract Reply → Wait → Send Reply   │
└─────────────────┘                  └──────────────────────────────────────┘
        ▲                                          │
        │                                          │
        └──────── Baileys Gateway ─────────────────┘
                  localhost:3001
```

**Flow:**
1. Someone messages your WhatsApp
2. Baileys captures it and POSTs to n8n webhook
3. n8n filters (spam / group mention / sleep mode / blacklist)
4. Groq LLaMA 3 generates a smart reply
5. n8n sends reply back through Baileys gateway
6. Your WhatsApp sends the message automatically

---

## 📁 Project Structure

```
whatsapp-ai-agent/
├── baileys-gateway/
│   ├── server.js          # WhatsApp connection + HTTP API server
│   └── package.json       # Node.js dependencies
├── n8n-workflow/
│   └── workflow.json      # Import this into n8n
├── .env                   # Your API keys and config (never commit this!)
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Node.js | v18+ | [nodejs.org](https://nodejs.org) |
| n8n | v2.10+ | via npm |
| Groq Account | Free | [console.groq.com](https://console.groq.com) |

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/sudeepmondal/Whats_App-AI-Agent
cd whatsapp-ai-agent
```

---

### Step 2 — Install n8n

```bash
npm install -g n8n
n8n start
```

Open **http://localhost:5678** and create an account.

---

### Step 3 — Get your free Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up with Google (free)
3. Navigate to **API Keys** → **Create API Key**
4. Copy the key (starts with `gsk_...`)

---

### Step 4 — Configure environment variables

Copy the example env file and fill in your details:

```bash
cp .env .env.local
```

Edit `.env`:

```env
GROQ_API_KEY=gsk_your_key_here
MY_PHONE_NUMBER=8801XXXXXXXXX
MY_NAME=YourName
N8N_WEBHOOK_URL=http://localhost:5678/webhook/whatsapp
GATEWAY_PORT=3001
```

---

### Step 5 — Start the Baileys Gateway

```bash
cd baileys-gateway
npm install
npm start
```

A QR code will appear in the terminal:

```
📱 Scan this QR code from WhatsApp:

[QR CODE]

(WhatsApp → Linked Devices → Link a Device)
```

Scan it with your phone. You'll see:
```
✅ WhatsApp connected!
```

---

### Step 6 — Import the n8n Workflow

1. Open **http://localhost:5678**
2. Go to **Workflows** → click **+** → **Import from file**
3. Select `n8n-workflow/workflow.json`
4. Click the **Active** toggle to turn it ON ✅

---

### Step 7 — Add Groq API Key to n8n

In the **"HTTP - Call Groq API"** node:

- **Authentication**: None
- **Send Headers**: ON
- Add header: `Authorization` = `Bearer YOUR_GROQ_KEY`
- Add header: `Content-Type` = `application/json`

---

## 🧪 Testing

### Quick test via PowerShell (Windows):

```powershell
Invoke-WebRequest -Uri "http://localhost:5678/webhook/whatsapp" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"msgId":"test1","jid":"8801XXXXXXXXX@s.whatsapp.net","isGroup":false,"senderNumber":"8801000000001","senderName":"Test Friend","messageContent":"হ্যালো কেমন আছো?","myName":"YourName","myPhone":"8801XXXXXXXXX","timestamp":1234567890}'
```

### Quick test via curl (Linux/Mac):

```bash
curl -X POST http://localhost:5678/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"msgId":"test1","jid":"8801XXXXXXXXX@s.whatsapp.net","isGroup":false,"senderNumber":"8801000000001","senderName":"Test Friend","messageContent":"Hello, how are you?","myName":"YourName","myPhone":"8801XXXXXXXXX","timestamp":1234567890}'
```

Check **http://localhost:5678 → Executions** to see the workflow run.

---

## ⚙️ Configuration

### Personality Modes

Edit the `PERSONALITY` variable in the **"Function - Preprocess & Filter"** n8n node:

| Mode | Behavior |
|------|----------|
| `friendly` | Warm, natural replies in sender's language |
| `professional` | Formal, concise responses |
| `funny` | Witty and humorous |
| `casual` | Informal, like chatting with a friend |

### Group Chat Behavior

By default, the bot replies in groups **only when your name is mentioned**.

To reply to **all group messages**, find this in the filter node:

```javascript
// Change this:
} else if (isGroup && !myNameMentioned) {
  shouldReply = false;

// To this:
} else if (isGroup && !myNameMentioned) {
  shouldReply = true;
```

### Sleep Mode

The bot stays silent between 11 PM and 7 AM by default.

```javascript
const SLEEP_START = 23;  // 11 PM
const SLEEP_END   = 7;   // 7 AM
```

### Blacklist Numbers

```javascript
const BLACKLIST = ['8801XXXXXXXXX', '8801YYYYYYYYY'];
```

---

## 🔄 Daily Usage

Every time you restart your PC, open **two terminals**:

**Terminal 1 — n8n:**
```bash
n8n start
```

**Terminal 2 — Gateway:**
```bash
cd whatsapp-ai-agent/baileys-gateway
npm start
```

> After the first QR scan, your session is saved in `auth_info_baileys/` — no need to scan again.

---

## ❓ FAQ

**Q: Is this safe to use?**
A: This uses the unofficial WhatsApp Web protocol (Baileys). WhatsApp may ban accounts that use unofficial clients heavily. Use responsibly and avoid sending mass messages.

**Q: Will my session expire?**
A: Your session is saved locally. It persists until you log out from WhatsApp Linked Devices.

**Q: Can I run this 24/7?**
A: Yes! Deploy the gateway and n8n on a free cloud VM (e.g., Oracle Cloud Free Tier, Railway, Render) for always-on operation.

**Q: How many free requests does Groq allow?**
A: Groq free tier allows 30 requests/minute and ~14,400 requests/day — more than enough for personal use.

**Q: The QR code expired before I could scan it.**
A: Just restart the gateway with `npm start` to get a fresh QR code.

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| WhatsApp Connection | [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) |
| Workflow Automation | [n8n](https://n8n.io) |
| AI Model | Groq — LLaMA 3.3 70B Versatile |
| Gateway Server | Node.js + Express |
| HTTP Client | Axios |

---

<div align="center">

Made with ❤️ by [Deep](https://github.com/sudeepmondal)

⭐ Star this repo if it helped you!

</div>