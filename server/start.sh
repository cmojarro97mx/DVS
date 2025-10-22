
#!/bin/bash

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  npm install
fi

# Run Prisma migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Start the NestJS server in development mode
npm run start:dev
