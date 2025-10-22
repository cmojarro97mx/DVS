
#!/bin/bash

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  npm install
fi

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Start the server
npm run start:dev
