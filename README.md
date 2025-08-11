# AB Testing Tracker

A lightweight AB testing tracker with frontend and infrastructure components that supports dynamic variant rendering based on manifest configuration.

## Project Structure

```
ab-testing-tracker/
├── frontend/          # NextJS application with AB testing variants
├── infra/            # Infrastructure configurations (Lambda + API Gateway)
├── package.json      # Root workspace configuration
└── README.md         # This file
```

## Features

- **Frontend**: Lightweight NextJS app that fetches manifest.json from S3/CloudFront
- **AB Testing**: Dynamic variant rendering based on weight distribution
- **Infrastructure**: Lambda functions behind API Gateway (planned)
- **Minimalistic Design**: Clean, simple interface with weight-based variant selection

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

This will start the frontend server on port 3000.

### Individual Services

**Frontend (NextJS)**
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

## AB Testing Features

### Manifest Configuration
The application fetches a `manifest.json` file that defines AB testing experiments:

```json
{
  "experiments": [
    {
      "id": "cta-color-001",
      "active": true,
      "variants": [
        { "id": "A", "weight": 50 },
        { "id": "B", "weight": 50 }
      ]
    }
  ]
}
```

### Variant Rendering
- **Variant A**: Blue gradient background with "Get Started" button
- **Variant B**: Pink gradient background with "Start Now" button
- Weight-based selection ensures proper traffic distribution
- Real-time variant display with experiment information

## Development

### Frontend
- NextJS 14 with App Router
- TypeScript support
- Dynamic variant rendering based on manifest
- Weight-based variant selection algorithm
- Clean, minimalistic UI

### Infrastructure (Planned)
- Lambda functions for API endpoints
- API Gateway for REST API
- S3/CloudFront for manifest storage
- CI/CD pipeline setup

## Next Steps

1. **Lambda Functions**: Set up Lambda functions for API endpoints
2. **API Gateway**: Configure API Gateway for REST API
3. **S3/CloudFront Configuration**: Add actual CloudFront URL for manifest.json
4. **Deployment**: Set up production deployment pipeline
5. **Monitoring**: Add logging and monitoring capabilities
6. **Analytics**: Track variant performance and user interactions

## Contributing

This is a minimalistic setup following the spec requirements. The project uses dummy data as specified and is ready for Lambda/API Gateway configuration when provided. The AB testing system supports dynamic variant rendering based on weight distribution.
