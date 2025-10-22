
#!/bin/bash

# Build DATABASE_URL from Replit PostgreSQL environment variables
if [ -n "$PGHOST" ] && [ -n "$PGUSER" ] && [ -n "$PGDATABASE" ]; then
  export DATABASE_URL="postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}?sslmode=disable"
  echo "Using Replit PostgreSQL database: $PGDATABASE"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  npm install
fi

# Generate Prisma client
npx prisma generate

# Push schema changes to database
npx prisma db push --accept-data-loss

# Start the NestJS server in development mode
npm run start:dev
