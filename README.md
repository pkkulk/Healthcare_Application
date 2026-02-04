# Healthcare Doctor–Patient Translation Web Application

A real-time translation bridge ensuring seamless and accurate communication between doctors and patients who speak different languages. This application features role-based chat, real-time AI translation (powered by Google Gemini), audio recording, and conversation summarization.

##  Features

- **Role Selection**: Distinct interfaces for **Doctors** and **Patients**.
- **Real-Time Text Translation**: Messages are translated instantly into the recipient's preferred language (`English`, `Spanish`, `French`, `Hindi`).
- **Audio Messaging**: Record audio directly in the chat; clips are stored securely and playable by both parties.
- **AI Integration**:
  - **Translation**: Powered by Google Gemini (`gemini-2.5-flash-lite`) for optimized speed and quota management.
  - **Summarization**: Generates professional clinical visit summaries highlighting symptoms, diagnoses, and next steps.
- **Conversation History**: All chats are persisted in a database for future reference.
- **Search**: Filter conversation history by keywords.

## 🛠️ Technology Stack

- **Frontend**: 
  - React (Vite)
  - Tailwind CSS (Styling)
  - Lucide React (Icons)
  - Supabase Client (Real-time subscriptions & Storage)
- **Backend**: 
  - Node.js & Express
  - Google Generative AI SDK (`@google/generative-ai`)
- **Database & Services**: 
  - **Supabase**: PostgreSQL Database, Realtime, Storage (Audio buckets).

## ⚙️ Setup Instructions

### Prerequisites
- Node.js (v18+)
- A Supabase Project (Database & Storage bucket named `audio` aimed at public or authenticated access).
- A Google Gemini API Key.

### 1. Clone the Repository
```bash
git clone https://github.com/pkkulk/Healthcare_Application.git
cd Healthcare_Application
```

### 2. Environment Variables

**Backend (`server/.env`)**
Create a `.env` file in the `server` directory:
```env
PORT=3000
GEMINI_API_KEY=your_google_gemini_api_key
```

**Frontend (`client/.env`)**
Create a `.env` file in the `client` directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Installation

**Install Backend Dependencies**
```bash
cd server
npm install
```

**Install Frontend Dependencies**
```bash
cd ../client
npm install
```

## 🏃‍♂️ Running the Application

You need to run both the backend (for AI) and the frontend (UI) concurrently.

**1. Start the Backend Server**
```bash
cd server
node index.js
```
*The server will run on `http://localhost:3000`.*

**2. Start the Frontend**
```bash
# In a new terminal window
cd client
npm run dev
```
*The client will usually run on `http://localhost:5173`.*

## 📂 Project Structure

```
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # ChatInterface, RoleSelection, etc.
│   │   └── supabaseClient.js
│   └── ...
├── server/                 # Node.js Backend
│   ├── index.js            # Express server & Gemini integration
│   └── ...
└── README.md               # Project Documentation
```


## ⚠️ Known Limitations & Trade-offs

1.  **Audio Translation Handling**:
    *   Currently, audio files are uploaded to Supabase Storage and a link is shared.
    *   **Limitation**: Real-time *speech-to-text* (transcription) is mocked or minimal in this version due to API complexity limits. The system acts as a pipeline ready for a Whisper API integration.
2.  **Authentication**:
    *   The app uses a simple Role Switcher for demonstration purposes. In a production environment, this would be replaced with strict Supabase Auth (Email/Password) to secure Patient vs. Doctor access.
3.  **model Availability**:
    *   We explicitly use `gemini-2.5-flash-lite` to ensure high availability and stay within free tier quotas, as standard Pro models may hit rate limits faster.

## 🔒 Security Note
- `.env` files are git-ignored to protect your API keys.
- Ensure your Supabase Row Level Security (RLS) policies are configured correctly for production use.

