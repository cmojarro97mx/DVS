#!/bin/bash
export DATABASE_URL="postgresql://neondb_owner:npg_fK01vAmLVObW@ep-holy-glitter-adsfdor9-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
export JWT_SECRET="nexxio-super-secret-key-change-in-production-2024"
export PORT=3001
npm run start:dev
