
#!/bin/bash

# Force the correct DATABASE_URL from .env
export DATABASE_URL="postgresql://neondb_owner:npg_fK01vAmLVObW@ep-holy-glitter-adsfdor9-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
echo "Using Neon database"

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
