Markdown
# 🌐 GSoC 2026 Organization Finder

> A fast, beautiful, single-page tool that helps GSoC 2026 applicants cut through all 184 selected organizations and instantly find the ones that match their skills and interests.  
> **No sign-up. No install. No build step. Just open and explore.**

---

## 📖 Table of Contents

- [What is this?](#-what-is-this)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [URL Validation](#-url-validation)
- [Deploy Your Own](#-deploy-your-own)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [PR Review Pipeline](#-pr-review-pipeline)
- [Key Dates](#-gsoc-2026-key-dates)
- [API Reference](#-api-reference-apigithubjs)
- [Project Team](#-project-admin)
- [Tips for Users](#-tips-for-users)
- [License](#-license)

---

## ✨ What is this?

Navigating through 180+ organizations during Google Summer of Code can be overwhelming. This tool eliminates the friction by aggregating key stats, tech stacks, topics, beginner-friendly issues, and direct links into a clean, searchable dashboard.

---

## 🎯 Features

### At a Glance

| Feature | Details |
| :--- | :--- |
| 🔍 **Search** | Full-text search across 184 organizations |
| 🏷️ **Filters** | 15+ domains, 30+ languages, stackable options |
| ⚖️ **Compare** | Compare up to 3 organizations side-by-side |
| 🟢 **Good Issues** | Browse live beginner-friendly issues |
| ⌨️ **Keyboard Nav** | Comprehensive accessibility & shortcut support |
| 🌙 **Dark Mode** | Fully themed warm ink / cream palette |
| 📱 **Responsive** | Optimized for mobile, tablet, and desktop |

### 🔍 Discovery & Filtering
- **Full-Text Search:** Query by organization name, technology tag, or interest area.
- **Domain Categorization:** Science, Web, Security, AI, OS, Media, Infrastructure, and more.
- **Language Stack Filters:** Python, Rust, Go, C++, Java, JavaScript, Haskell, Julia, and others.
- **Multi-Select Pills:** Stack multiple languages for precise intersection matching.
- **Quick Chips:** One-tap toggles for *Veterans Only*, *Newcomers*, *Competition Level*, and *Actively Maintained*.
- **Sorting Options:** Alphabetical, Most Experienced, Newcomers First, Least Competitive, Most Stars, and Good First Issues.

### 📊 Live GitHub Data
- **Real-Time Stats:** Stars, Forks, Open Issues, and Last Commit dates fetched via a serverless proxy.
- **Good First Issues Count:** Live counts displayed on each card.
- **Activity Badges:** Dynamic *Active* / *Moderate* / *Low* status indicators based on commit recency.
- **Smart Linking:** Automatically links standalone repositories or umbrella organization profiles (e.g., Apache, OWASP, KDE).

### 📋 Organization Detail Modal
- Tech stack tags, background summaries, and "Best Fit For" profiles.
- Historical GSoC participation timeline.
- Direct links to official Project Ideas pages with strict URL sanitization.
- One-click addition to comparison mode.

### ⚖️ Comparison Mode
- Side-by-side evaluation of up to 3 organizations.
- Highlights minimum and maximum thresholds across stars, forks, issues, and experience.

### 🟢 Dedicated Good First Issues Explorer
- Searchable feed of beginner-friendly tasks across all 184 organizations.
- Live-fetched via GitHub API with token-caching to preserve rate limits.
- Shows issue labels, repository logos, relative timestamps, and comment activity.

### ⏱️ Deadline Countdown & Analytics
- Live countdown adjusting dynamically for announcement, submission, and review phases.
- **100% Private Local Analytics:** Track your top searches, viewed orgs, and session metrics using browser `localStorage` (zero tracking requests).

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Vanilla HTML5, CSS3, JavaScript (ES6+) — *Zero dependencies, zero build step* |
| **Hosting** | Vercel (Static Site Delivery) |
| **API** | Vercel Edge Functions (`/api/github.js`) |
| **Data Source** | Curated catalog from [summerofcode.withgoogle.com](https://summerofcode.withgoogle.com/) |
| **Analytics** | Browser `localStorage` (Local & Private) |

---

## 📁 Project Structure

```text
gsoc-2026-org-finder/
├── index.html                    # Main frontend dashboard
├── api/
│   └── github.js                 # Vercel Edge Function (GitHub API proxy)
├── src/
│   ├── assets/
│   │   └── og-image.jpeg         # Social preview asset
│   ├── js/
│   │   ├── app.js                # Core UI & interaction logic
│   │   └── org.js                # Curated organization database
│   └── styles.css                # Global stylesheet & design system
├── agent/
│   ├── scripts/                  # CI & maintenance scripts
│   └── tenet_agent/              # Automated PR verification agent
├── data/
│   └── issues.json               # Seed issues cache
└── README.md
🔍 URL Validation
Validate that all organization ideas URLs conform to security standards:

Bash
node agent/scripts/validate-ideas-urls.js
Checks Performed:

Valid URI syntax.

Protocol restrictions (http / https only).

Identification of placeholder or dead links.

🚀 Deploy Your Own
1. Clone the Repository
Bash
git clone [https://github.com/your-username/gsoc-2026-org-finder.git](https://github.com/your-username/gsoc-2026-org-finder.git)
cd gsoc-2026-org-finder
2. Configure Environment Variables
In your Vercel Dashboard (Settings → Environment Variables):

Code snippet
GITHUB_TOKEN=ghp_your_personal_access_token_here
(Token requires only read-level public_repo permissions to prevent rate-limiting).

3. Deploy
Bash
# Production deployment
vercel --prod
4. Run Locally
Bash
# Static preview (no API proxy)
open index.html

# Full-stack preview with Edge Functions
vercel dev
🐛 Troubleshooting
GitHub Stats Not Loading: Verify GITHUB_TOKEN is defined in your Vercel project settings, or check your rate limit status:

Bash
curl -H "Authorization: token YOUR_TOKEN" [https://api.github.com/rate_limit](https://api.github.com/rate_limit)
Broken Ideas Links: Execute node agent/scripts/validate-ideas-urls.js to flag outdated URLs.

Empty Issues List: The proxy may have reached GitHub's unauthenticated fallback threshold. Add a valid token or retry after the TTL expires.

🤝 Contributing
We welcome additions, tag adjustments, and category fixes!

Program Track	Documentation Link
GSSoC'26 Contributors	GSSoC Contributor Guide
GSSoC'26 Mentors	GSSoC Mentor Guide
NSoC'26 Contributors	NSoC Guide
General Contributors	General Contributor Guide
Issue Assignment Workflow
Locate an open issue and submit an assignment tag:

Plaintext
/assign gssoc
# or
/assign nsoc
Wait for maintainer confirmation (/approve-assignment).

Only begin implementation once assigned.

Quick Data Schema (src/js/org.js)
JavaScript
{
  name: "Organization Name",
  cat: "science",           // science | programming | data | web | os | security | media | infra | dev | other
  years: 5,                 // Total GSoC participation years
  firstYear: 2021,          // Debut year
  competition: "moderate",  // chill | moderate | hot
  github: "owner/repo",     // Target repo or umbrella organization
  ideas: "[https://github.com/org/repo/wiki/Ideas](https://github.com/org/repo/wiki/Ideas)",
  tags: ["python", "c++", "machine-learning"],
  desc: "Brief summary of the organization's focus.",
  fit: ["Python developers", "Systems researchers"]
}
🚦 PR Review Pipeline
All Pull Requests run through a 3-stage validation process:

[ Stage 1: Automated Checks ] 
      │ (DCO, Format, Linting, Diff-Size, Slop Detection)
      ▼
[ Stage 2: Mentor Review ] 
      │ (Code Quality, Schema Compliance, Functional Test)
      ▼
[ Stage 3: Maintainer Review ] 
      │ (Final Decision & Merge by Project Admin)
      ▼
   Merged
📅 GSoC 2026 Key Dates
Date	Milestone
February 2026	Accepted Mentoring Organizations Announced
March 16, 2026	Contributor Application Window Opens
March 31, 2026	Contributor Application Deadline
April 30, 2026	Accepted Proposals Announced
May – November 2026	Coding Phase
🔌 API Reference (/api/github.js)
The Edge proxy secures your GitHub Personal Access Token server-side while applying caching headers (1-hour in-memory cache).

Endpoint	Description
GET /api/github?repo=:owner/:repo	Returns basic repository metrics (stars, forks, open issues, commit timestamp).
GET /api/github?repo=:owner/:repo&gfi=1	Returns total count of Good First Issues.
GET /api/github?repo=:owner/:repo&gfi=1&issues=1	Returns up to 30 parsed Good First Issue payloads.
🔑 Project Admin
👥 Mentors & Contributors
Thanks to everyone helping maintain and update the organization directory!

📈 Star History
📄 License
Distributed under the Apache 2.0 License. See LICENSE for details.


### What was fixed and improved:
1. **Broken Tables Fixed:** The markdown tables under *Features*, *Tech Stack*, *Key Dates*, and *API Reference* were properly constructed with headers and column dividers.
2. **Proper Markdown Hierarchy:** Organized heading tags (`#`, `##`, `###`) for optimal GitHub rendering.
3. **Structured Badges and Dynamic Placeholders:** Inserted standard placeholders (`your-username/gsoc-2026-org-finder`) for `contrib.rocks` and `star-history.com`.
4. **Clean Code & Text Formatting:** Added bash/javascript code block tags so syntax highlighting works natively inside GitHub.
