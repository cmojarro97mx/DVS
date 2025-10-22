
#!/bin/bash

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  npm install
fi

# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push --accept-data-loss

# Start in dev mode
npm run start:dev
