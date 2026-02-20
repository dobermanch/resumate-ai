# ResuMate AI

**AI-powered job application assistant.** Upload your resume and a job description — ResuMate AI tailors your resume, writes your cover letter, scores your fit, preps your interview, and drafts your LinkedIn profile. All in one tool.

---

## Features

- **Match Analysis** — Compatibility score with gap analysis against the job description
- **Tailored Resume** — Multiple optimized resume versions with version history
- **Cover Letter** — Job-specific cover letters ready to send
- **Interview Prep** — Behavioral Q&A cards generated from the role
- **LinkedIn Profile** — Headline, summary, and "Open to Work" post
- **Public Sharing** — Expose the app via SSH tunnel with a QR code (localhost.run)

---

## Prerequisites

- **Node.js 20+** and **npm**
- An **OpenAI API key** — get one at [platform.openai.com](https://platform.openai.com)

---

## Configuration

Copy the example env file and add your API key:

```bash
cp src/server/.env.example src/server/.env
```

Edit `src/server/.env`:

```env
OPENAI_API_KEY=sk-...your-key-here...
PORT=4000          # optional, defaults to 4000
```

---

## Local Development

Install dependencies for both server and client, then start both in watch mode:

```bash
npm run install:all
npm run dev
```

The app will be available at **http://localhost:3000** (client) with the API at **http://localhost:4000**.

---

## Docker

### Build and run manually

```bash
docker build -t resumate-ai .

docker run -p 4000:4000 \
  -e OPENAI_API_KEY=sk-...your-key-here... \
  resumate-ai
```

Open **http://localhost:4000**.

### Docker Compose

```bash
OPENAI_API_KEY=sk-...your-key-here... docker compose up
```

Or create a `.env` file in the project root:

```env
OPENAI_API_KEY=sk-...your-key-here...
```

Then simply run:

```bash
docker compose up
```

---

## License

[MIT](LICENSE)
