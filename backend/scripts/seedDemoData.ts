// Seed script to add test transactions
// Run with: npx ts-node scripts/seedDemoData.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Find demo user
    const user = await prisma.user.findUnique({ where: { email: 'demo@test.com' } });
    if (!user) {
        console.log('Demo user not found. Please register demo@test.com first.');
        return;
    }

    console.log('Seeding transactions for:', user.email);

    const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment'];
    const merchants: Record<string, string[]> = {
        'Food': ['Starbucks', 'McDonalds', 'Chipotle', 'Subway', 'Panera Bread'],
        'Transport': ['Uber', 'Lyft', 'Shell Gas', 'Metro Card', 'Parking'],
        'Shopping': ['Amazon', 'Target', 'Walmart', 'Best Buy', 'Apple Store'],
        'Bills': ['Electric Co.', 'Water Bill', 'Internet', 'Netflix', 'Spotify'],
        'Entertainment': ['Movie Theater', 'Concert Tickets', 'Bowling', 'Mini Golf', 'Arcade'],
    };

    const transactions: { amount: number; merchant: string; category: string; date: Date; type: string }[] = [];

    const today = new Date();

    // --- Last 4 weeks (28 days) - more transactions ---
    for (let dayOffset = 0; dayOffset < 28; dayOffset++) {
        const date = new Date(today);
        date.setDate(today.getDate() - dayOffset);

        // 1-3 transactions per day
        const txCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < txCount; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)] as string;
            const merchantList = merchants[category] || ['Store'];
            const merchant = merchantList[Math.floor(Math.random() * merchantList.length)] as string;
            const amount = Math.round((Math.random() * 50 + 5) * 100) / 100; // $5 - $55

            transactions.push({
                amount,
                merchant,
                category,
                date,
                type: 'expense',
            });
        }
    }

    // --- Yearly data (Jan - Nov of current year) - 2-5 transactions per month ---
    for (let month = 0; month < 11; month++) { // Jan to Nov
        const txCount = Math.floor(Math.random() * 4) + 2; // 2-5 per month
        for (let i = 0; i < txCount; i++) {
            const day = Math.floor(Math.random() * 28) + 1;
            const date = new Date(today.getFullYear(), month, day);

            const category = categories[Math.floor(Math.random() * categories.length)] as string;
            const merchantList = merchants[category] || ['Store'];
            const merchant = merchantList[Math.floor(Math.random() * merchantList.length)] as string;
            const amount = Math.round((Math.random() * 100 + 20) * 100) / 100; // $20 - $120

            transactions.push({
                amount,
                merchant,
                category,
                date,
                type: 'expense',
            });
        }
    }

    // Add income transactions (salary)
    for (let month = 0; month < 12; month++) {
        const date = new Date(today.getFullYear(), month, 15);
        if (date <= today) {
            transactions.push({
                amount: 3500,
                merchant: 'Acme Corp',
                category: 'Salary',
                date,
                type: 'income',
            });
        }
    }

    // Insert all transactions
    console.log(`Creating ${transactions.length} transactions...`);

    for (const tx of transactions) {
        await prisma.transaction.create({
            data: {
                userId: user.id,
                ...tx,
            },
        });
    }

    console.log('Done! Seed data created.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
