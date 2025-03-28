<div align="center">
<h1>Deep Journalist</h1>

![GitHub deployments](https://img.shields.io/github/deployments/u14app/gemini-next-chat/Production)
![GitHub Release](https://img.shields.io/github/v/release/u14app/deep-research)
![Docker Image Size](https://img.shields.io/docker/image-size/xiangfa/deep-research/latest)
![Docker Pulls](https://img.shields.io/docker/pulls/xiangfa/deep-research)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[![Gemini](https://img.shields.io/badge/Gemini-8E75B2?style=flat&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Next](https://img.shields.io/badge/Next.js-111111?style=flat&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn/ui-111111?style=flat&logo=shadcnui&logoColor=white)](https://ui.shadcn.com/)

</div>

**AI-Powered Journalism with Balanced Reporting and Source Verification**

Deep Journalist is a cutting-edge application built with Next.js 15, leveraging the power of Google Gemini models to generate well-researched, balanced journalistic articles. This tool allows you to analyze existing articles or research news events by automatically finding and evaluating primary sources, highlighting conflicting perspectives, and producing balanced, well-attributed articles that adhere to professional journalistic standards.

## ✨ Features

- **Comprehensive Journalistic Workflow:** Ingest article URLs or event descriptions and produce balanced, fact-checked articles with proper sourcing.
- **Source Validation & Classification:** Automatically evaluate and categorize sources as primary, secondary, official, analysis, or commentary.
- **Multiple Article Formats:** Generate different types of journalistic content - news articles, feature stories, investigative reports, and explainers.
- **Journalistic Standards:** Adheres to the Society of Professional Journalists' ethical principles: Seek Truth, Minimize Harm, Act Independently, and Be Accountable.
- **Source Credibility Assessment:** Evaluates source reliability and potential bias, providing transparency about information quality.
- **Multi-perspective Coverage:** Identifies and presents conflicting viewpoints for balanced reporting.
- **Methodology Transparency:** Includes clear documentation of research methods, source verification processes, and limitations.
- **Multi-language Translation:** Translate articles into 11 different languages while preserving formatting and structure.
- **Social Media Integration:** Export content optimized for various platforms (Twitter/X, Facebook, LinkedIn, WhatsApp) with appropriate formatting and character limits.
- **Multi-platform Support:** Supports rapid deployment to Vercel, Cloudflare and other platforms.
- **Powered by Google Gemini:** Utilizes advanced Google Gemini models for accurate and insightful analysis.
- **Local & Server API Support:** Offers flexibility with both local and server-side API calling options to suit your needs.
- **Privacy-Focused:** Your data remains private and secure, as all data is stored locally on your browser.
- **Multi-language Support:** English、简体中文.
- **Built with Modern Technologies:** Developed using Next.js 15 and Shadcn UI, ensuring a modern, performant, and visually appealing user experience.
- **MIT Licensed:** Open-source and freely available for personal and commercial use under the MIT License.

## 🎯 Roadmap

- [x] Support preservation of research history
- [x] Support editing final article and search results
- [x] Support multiple article formats (news, feature, investigative, explainer)
- [x] Implement source credibility assessment
- [x] Support URL content extraction for article analysis
- [x] Add multi-language translation capabilities
- [x] Implement social media export optimization
- [ ] Add automated fact-checking against trusted databases
- [ ] Implement timeline construction for complex stories
- [ ] Create bias detection and neutralization algorithms
- [ ] Support file upload and local knowledge base

## 🚀 Getting Started

1. Get [Gemini API Key](https://aistudio.google.com/app/apikey)
2. One-click deployment of the project, you can choose to deploy to Vercel or Cloudflare

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fu14app%2Fdeep-research&project-name=deep-journalist&repository-name=deep-journalist)

   Currently the project supports deployment to Cloudflare, but you need to follow [How to deploy to Cloudflare Pages](./docs/How-to-deploy-to-Cloudflare-Pages.md) to do it.

3. Start using

## ⌨️ Development

Follow these steps to get Deep Journalist up and running on your local browser.

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18.18.0 or later recommended)
- [pnpm](https://pnpm.io/) or [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/u14app/deep-journalist.git
   cd deep-journalist
   ```

2. **Install dependencies:**

   ```bash
   pnpm install  # or npm install or yarn install
   ```

3. **Set up Environment Variables:**

   Create a `.env` file in the root directory of your project and configure the following environment variables:

   ```env
   # (Optional) Server-side Gemini API Key (Required for server API calls)
   GOOGLE_GENERATIVE_AI_API_KEY=

   # (Optional) Server API Proxy URL. Default, `https://generativelanguage.googleapis.com`
   API_PROXY_BASE_URL=

   # (Optional) Server API Access Password for enhanced security
   ACCESS_PASSWORD=

   # (Optional) Injected script code can be used for statistics or error tracking.
   HEAD_SCRIPTS=
   ```

   **Important Notes on Environment Variables:**

   - `GOOGLE_GENERATIVE_AI_API_KEY`: **Optional but required for using the server-side API.** You need to obtain a Google Generative AI API key from [Google AI Studio](https://aistudio.google.com/). This key should be kept secret and **never committed to your public repository.**
   - `API_PROXY_BASE_URL`: **Optional.** If you need to use a proxy server for API requests, configure this variable with your proxy server's base URL. This is relevant for server-side API calls.
   - `ACCESS_PASSWORD`: **Optional but highly recommended for server-side deployments.** Set a strong password to protect your server-side API endpoints. This password will be required to access server-side API functionalities.
   - `HEAD_SCRIPTS`: **Optional** Injected script code can be used for statistics or error tracking.

   **Privacy Reminder:** These environment variables are primarily used for **server-side API calls**. When using the **local API mode**, no API keys or server-side configurations are needed, further enhancing your privacy.
   **Multi-key Support:** Supports multiple keys, each key is separated by `,`, i.e. `key1,key2,key3`

4. **Run the development server:**

   ```bash
   pnpm dev  # or npm run dev or yarn dev
   ```

   Open your browser and visit [http://localhost:3000](http://localhost:3000) to access Deep Journalist.

## 🚢 Deployment

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fu14app%2Fdeep-research&project-name=deep-journalist&repository-name=deep-journalist)

### Cloudflare

Currently the project supports deployment to Cloudflare, but you need to follow [How to deploy to Cloudflare Pages](./docs/How-to-deploy-to-Cloudflare-Pages.md) to do it.

### Docker

> The Docker version needs to be 20 or above, otherwise it will prompt that the image cannot be found.

> ⚠️ Note: Most of the time, the docker version will lag behind the latest version by 1 to 2 days, so the "update exists" prompt will continue to appear after deployment, which is normal.

```bash
docker pull xiangfa/deep-journalist:latest
docker run -d --name deep-journalist -p 3333:3000 xiangfa/deep-journalist
```

You can also specify additional environment variables:

```bash
docker run -d --name deep-journalist \
   -p 3333:3000 \
   -e GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy... \
   -e ACCESS_PASSWORD=your-password \
   xiangfa/deep-journalist
```

or build your own docker image:

```bash
docker build -t deep-journalist .
docker run -d --name deep-journalist -p 3333:3000 deep-journalist
```

If you need to specify other environment variables, please add `-e key=value` to the above command to specify it.

Deploy using `docker-compose.yml`:

```bash
version: '3.9'
services:
   deep-journalist:
      image: xiangfa/deep-journalist
      container_name: deep-journalist
      environment:
         - GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy...
         - ACCESS_PASSWORD=your-password
      ports:
         - 3333:3000
```

or build your own docker compose:

```bash
docker compose -f docker-compose.yml build
```

### Static Deployment

You can also build a static page version directly, and then upload all files in the `out` directory to any website service that supports static pages, such as Github Page, Cloudflare, Vercel, etc..

```bash
pnpm build:export
```

## ⚙️ Configuration

As mentioned in the "Getting Started" section, Deep Journalist utilizes the following environment variables for server-side API configurations:

- `GOOGLE_GENERATIVE_AI_API_KEY`
- `API_PROXY_BASE_URL`
- `ACCESS_PASSWORD`

These variables are **only required if you intend to use the server-side API calling functionality.** For local API calls, no configuration is necessary beyond setting up the project.

## 🔌 API Reference

Deep Journalist provides several API endpoints for various functionalities:

### Server Settings
- **GET `/api/settings`**: Returns server environment variables needed by the client (API key, proxy URL, access password).

### Google AI Model Endpoints
- **GET `/api/models`**: Retrieves a list of available Google Gemini AI models using server-side API key.
- **GET `/api/mock/models`**: Provides mock model data for development and testing purposes.
- **GET/POST/PUT/DELETE `/api/ai/google/[...slug]`**: Proxy endpoint for Google Generative AI API calls with added security and CORS headers. Routes requests to Google's API with appropriate authentication.

### URL Content Extraction
- **POST `/api/extract-url`**: Extracts content from a provided URL, avoiding CORS issues by handling the request server-side. Returns structured data including title, author, content, and metadata.

### Testing
- **GET `/api/test`**: Tests the configured API keys, returning validation results for each key.

All API endpoints include proper CORS headers and error handling. Server-side endpoints are protected by the configured `ACCESS_PASSWORD` when set.

## 🧠 Journalistic Principles

Deep Journalist adheres to the Society of Professional Journalists' code of ethics:

1. **Seek Truth and Report It:** The application verifies facts from multiple sources, distinguishes between statements and verified information, and provides proper context.

2. **Minimize Harm:** Articles are designed to show respect for privacy and dignity, avoiding sensationalism and showing compassion for those affected by news coverage.

3. **Act Independently:** The system generates content free from outside influence and discloses potential conflicts of interest in sources.

4. **Be Accountable and Transparent:** Each article includes a methodology section explaining how information was gathered and verified, acknowledging limitations and gaps.

## 🛡️ Privacy

Deep Journalist is designed with your privacy in mind. **All research data and generated articles are stored locally on your machine.** We do not collect or transmit any of your research data to external servers (unless you are explicitly using server-side API calls, in which case data is sent to Google's Gemini API through your configured proxy if any). Your privacy is our priority.

## 📝 License

Deep Journalist is released under the [MIT License](LICENSE). This license allows for free use, modification, and distribution for both commercial and non-commercial purposes.

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org/) - The React framework for building performant web applications.
- [Shadcn UI](https://ui.shadcn.com/) - Beautifully designed components that helped streamline the UI development.
- [Google Gemini](https://ai.google.dev/gemini-api) - Powering the intelligent journalistic capabilities.
- [Deep Research](https://github.com/u14app/deep-research) - The foundation project that inspired this journalistic adaptation.

## 🤝 Contributing

We welcome contributions to Deep Journalist! If you have ideas for improvements, bug fixes, or new features, please feel free to:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them.
4. Submit a pull request.

For major changes, please open an issue first to discuss your proposed changes.

## ✉️ Contact

If you have any questions, suggestions, or feedback, please create a new [issue](https://github.com/u14app/deep-journalist/issues).
