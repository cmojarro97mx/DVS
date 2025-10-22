
#!/bin/bash

# DATABASE_URL is now managed through Replit Secrets
echo "Using Neon database from secrets"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  npm install
fi

# Generate Prisma client
npx prisma generate

# Push schema changes to database
npx prisma db push --accept-data-loss

# Start the NestJS server in development mode with increased memory
NODE_OPTIONS="--max-old-space-size=2048" npm run start:dev
