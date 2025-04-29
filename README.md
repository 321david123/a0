# a0.dev – Diff Digest ✍️

**Challenge:** Build a web experience that turns Git diffs into live, dual-tone release notes.  
**Time-box:** 24 hours from first commit / fork.
*Just hover over the preferred one and click generate notes!*
---

## Overview

This project fetches merged pull requests from a GitHub repository, displays them elegantly, and allows users to **generate live streaming release notes** for each PR.

Each PR generates:
- **Developer Notes:** Technical summary of the changes.
- **Marketing Notes:** User-focused improvements, benefits.

Notes are **streamed in real time** as they are generated.

---

## Features

- **Fetch merged pull requests** dynamically via `/api/sample-diffs`.
- **Optimized for Edge runtimes** for faster responses.
- **Generate AI-powered release notes** from Git diffs using OpenAI models.
- **Real-time streaming** of AI responses using `ReadableStream`.
- **Dual-tone release notes**: technical developer + marketing versions.
- **Polished UI/UX** with TailwindCSS.
- **Error, loading, and empty state handling**.
- **Pagination support** with "Load More" functionality.

---

## Tech Stack

- **Framework:** Next.js 15 (Edge runtime)
- **Styling:** Tailwind CSS
- **AI SDK:** `@ai-sdk/openai`
- **API Client:** `@octokit/rest`
- **Language:** TypeScript
- **Streaming:** `ReadableStream` handling manually

---

##  How It Works

### Frontend Flow
1. Fetch list of merged PRs using `/api/sample-diffs`.
2. Display PRs with title, description, and a "Generate Notes" button.
3. When a user clicks, send PR diff to `/api/generate-notes`.
4. Stream AI-generated notes in real time, updating UI as chunks arrive.

### Backend Flow
- `/api/generate-notes` accepts a PR diff and streams the AI's response using `gpt-4o-mini` or similar.
- Uses a **custom prompt** to ask for Developer and Marketing notes separately.
- Streaming response is piped directly back to the client.

---

## UI Preview

- **Error handling:** Beautifully styled error banners.
- **Loading states:** Button text dynamically changes to "Generating..." or "Fetching...".
- **Dark Mode Ready:** Tailwind dark mode classes used.
- **Live Streaming:** Notes appear word-by-word as the AI generates them.

---

## ⚙️ Quick Start

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Visit:
http://localhost:3000
# Or just visit:
http://a0.davidmtz.me
