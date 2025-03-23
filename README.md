# Deep-Journalist

An AI-powered journalistic research assistant designed to elevate the quality of news reporting. Deep-Journalist transforms existing news stories into comprehensive, well-researched, and unbiased articles backed by primary sources.

## Project Structure

```
deep-journalist/
├── api/                    # FastAPI backend
├── frontend/              # Next.js frontend
│   └── nextjs/           # Next.js application
└── e2e/                  # End-to-end tests
```

## Prerequisites

- Docker and Docker Compose
- Node.js 18+
- Python 3.12+

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/deep-journalist.git
cd deep-journalist
```

2. Create environment files:
```bash
cp api/.env.example api/.env
cp frontend/nextjs/.env.example frontend/nextjs/.env
```

3. Build and start the containers:
```bash
docker-compose up --build
```

The application will be available at:
- Frontend: http://localhost:3000
- API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Development

### Frontend (Next.js)

The frontend is built with:
- Next.js 14
- TypeScript
- Tailwind CSS
- Playwright for e2e testing

Key features:
- SWC compilation for faster builds
- Hot Module Replacement (HMR)
- Responsive design
- Type-safe API integration

### Backend (FastAPI)

The backend uses:
- FastAPI
- Python 3.12
- Google Gemini AI
- Redis for caching

Key features:
- Async/await for optimal performance
- OpenAPI documentation
- Type hints throughout
- Structured logging

## Testing

### End-to-End Tests

Run e2e tests with:
```bash
docker-compose run e2e npm test
```

Tests cover:
- User journey flows
- API integration
- Error handling
- Performance metrics

### Frontend Tests

Run frontend tests:
```bash
cd frontend/nextjs
npm test
```

### Backend Tests

Run backend tests:
```bash
cd api
pytest
```

## Docker Configuration

The project uses Docker Compose with three main services:
1. `frontend`: Next.js application
2. `api`: FastAPI backend
3. `e2e`: Playwright tests

Additional services:
- `redis`: For caching and session management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Code Quality Standards

- Follow PEP 8 for Python code
- Use ESLint and Prettier for JavaScript/TypeScript
- Maintain test coverage above 80%
- Document all public APIs
- Use type hints/TypeScript throughout

## Performance Targets

- Page load time < 3s
- API response time < 500ms
- Test suite execution < 5 minutes
- Lighthouse score > 90

## Security

- Environment variables for sensitive data
- Input validation and sanitization
- Rate limiting on API endpoints
- Regular dependency updates
- HTTPS in production

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Gemini AI for powering the analysis
- FastAPI for the efficient backend
- Next.js team for the frontend framework
- Playwright for reliable testing 