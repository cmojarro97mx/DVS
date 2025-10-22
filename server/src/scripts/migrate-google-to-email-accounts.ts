import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateGoogleAccounts() {
  console.log('🚀 Starting migration of Google accounts from User to EmailAccount...\n');

  try {
    const usersWithGoogle = await prisma.user.findMany({
      where: {
        googleAccessToken: {
          not: null,
        },
      },
      select: {
        id: true,
        email: true,
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiry: true,
        gmailSyncEnabled: true,
        calendarSyncEnabled: true,
        lastGmailSync: true,
        lastCalendarSync: true,
      },
    });

    console.log(`📊 Found ${usersWithGoogle.length} user(s) with Google accounts\n`);

    if (usersWithGoogle.length === 0) {
      console.log('✅ No users with Google accounts found. Migration complete.');
      return;
    }

    let migratedCount = 0;
    let skippedCount = 0;

    for (const user of usersWithGoogle) {
      console.log(`Processing user: ${user.email} (ID: ${user.id})`);

      const existingAccount = await prisma.emailAccount.findFirst({
        where: {
          userId: user.id,
          email: user.email,
          provider: 'google',
        },
      });

      if (existingAccount) {
        console.log(`  ⏭️  Skipped - EmailAccount already exists for ${user.email}`);
        skippedCount++;
        continue;
      }

      const emailAccount = await prisma.emailAccount.create({
        data: {
          userId: user.id,
          email: user.email,
          provider: 'google',
          status: 'connected',
          syncEmail: user.gmailSyncEnabled || false,
          syncCalendar: user.calendarSyncEnabled || false,
          accessToken: user.googleAccessToken,
          refreshToken: user.googleRefreshToken,
          tokenExpiry: user.googleTokenExpiry,
          lastEmailSync: user.lastGmailSync,
          lastCalendarSync: user.lastCalendarSync,
        },
      });

      console.log(`  ✅ Created EmailAccount for ${user.email} (ID: ${emailAccount.id})`);
      migratedCount++;
    }

    console.log(`\n📈 Migration Summary:`);
    console.log(`   ✅ Migrated: ${migratedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   📊 Total: ${usersWithGoogle.length}`);
    console.log('\n✨ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateGoogleAccounts()
  .then(() => {
    console.log('\n👋 Migration script finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
