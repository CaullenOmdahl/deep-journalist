# Deep-Journalist

Deep-Journalist is an AI-powered journalistic research assistant designed to elevate the quality of news reporting by transforming existing news stories into comprehensive, well-researched, and unbiased articles backed by primary sources.

## Features

- **Story Input and Analysis**
  - Direct URL to news article
  - Copy-pasted article content
  - Multiple article URLs for cross-reference
  - Bias detection
  - Claim identification
  - Source evaluation
  - Missing context detection

- **Comprehensive Research**
  - Primary source discovery
  - Multi-source verification
  - Timeline reconstruction
  - Context gathering
  - Expert opinion collection

- **Fact Verification**
  - Statement extraction
  - Source attribution
  - Verification status tracking
  - Source credibility assessment
  - Bias detection

- **Journalistic Synthesis**
  - Chronological organization
  - Balanced perspective presentation
  - Clear attribution of sources
  - AP Style compliance
  - Inverted pyramid structure

## Installation

1. Clone the repository:
```bash
git clone https://github.com/CaullenOmdahl/deep-journalist.git
cd deep-journalist
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Install Chrome/Chromium browser if not already installed.

4. Create a .env file with your configuration:
```bash
cp .env.example .env
# Edit .env with your settings
```

## Usage

### API

Start the API server:
```bash
uvicorn app.main:app --reload
```

API endpoints:
- POST /api/v1/analyze - Analyze article(s) from URL or text
- POST /api/v1/research - Conduct deep research on a topic
- POST /api/v1/verify - Verify specific claims
- POST /api/v1/synthesize - Generate final article

### CLI

```bash
python -m deep_journalist analyze --url "https://example.com/article"
python -m deep_journalist research --topic "Topic to research"
```

## Configuration

Key settings in .env:
- OPENAI_API_KEY - Your OpenAI API key
- MODEL_NAME - GPT model to use (default: gpt-4-1106-preview)
- CHROME_PATH - Path to Chrome/Chromium executable
- MIN_PRIMARY_SOURCES - Minimum number of primary sources (default: 3)
- NEUTRAL_SCORE_THRESHOLD - Minimum neutral language score (default: 0.9)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Based on [gpt-researcher](https://github.com/assafelovic/gpt-researcher)
- Uses [bypass-paywalls-chrome-clean](https://gitflic.ru/project/magnolia1234/bypass-paywalls-chrome-clean) for paywall bypass
- Inspired by the need for more rigorous journalistic standards in the age of AI 