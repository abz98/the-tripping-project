# Environment Configuration

This folder contains environment-specific configuration files for the application.

## Files

- `environment.ts` - Development environment configuration
- `environment.prod.ts` - Production environment configuration
- `environment.example.ts` - Example template for environment files

## Configuration Variables

### apiBaseUrl

The base URL for all API requests.

- **Development**: `http://localhost:3001/api/v1`
- **Production**: Update with your production API URL

### production

Boolean flag indicating if the app is running in production mode.

### appName

The application name.

### enableDebugMode

Enable/disable debug logging and development features.

### apiTimeout

Timeout for API requests in milliseconds (default: 30000ms / 30 seconds).

## Usage

Import the environment configuration in your components or services:

```typescript
import { environment } from "../../environments/environment";

// Use in your code
const apiUrl = environment.apiBaseUrl;
this.http.get(`${apiUrl}/trips`);
```

## Build Configuration

The Angular build system automatically replaces `environment.ts` with `environment.prod.ts` when building for production:

```bash
# Development build (uses environment.ts)
npm run start

# Production build (uses environment.prod.ts)
npm run build
```

## Adding New Variables

When adding new environment variables:

1. Add the variable to both `environment.ts` and `environment.prod.ts`
2. Update `environment.example.ts` with the new variable
3. Document the variable in this README
