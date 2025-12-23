// Clear existing data and reseed with better dummy data
// Run with: npx ts-node scripts/clearAndReseed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Find demo user
    const user = await prisma.user.findUnique({ where: { email: 'demo@test.com' } });
    if (!user) {
        console.log('Demo user not found.');
        return;
    }

    console.log('Clearing existing transactions for:', user.email);
    await prisma.transaction.deleteMany({ where: { userId: user.id } });

    console.log('Creating new transactions with better data...');

    const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment'];
    const merchants: Record<string, string[]> = {
        'Food': ['Starbucks', 'McDonalds', 'Chipotle', 'Whole Foods', 'Local Cafe'],
        'Transport': ['Uber', 'Lyft', 'Shell Gas', 'Metro Card', 'Parking Garage'],
        'Shopping': ['Amazon', 'Target', 'Walmart', 'Best Buy', 'Apple Store'],
        'Bills': ['Electric Bill', 'Water Bill', 'Internet', 'Netflix', 'Spotify'],
        'Entertainment': ['Movie Theater', 'Concert Tickets', 'Bowling Alley', 'Dinner Out', 'Sports Event'],
    };

    const transactions: { amount: number; merchant: string; category: string; date: Date; type: string }[] = [];
    const today = new Date();

    // --- Last 7 days - 3-5 transactions per day with realistic amounts ---
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const date = new Date(today);
        date.setDate(today.getDate() - dayOffset);

        const txCount = Math.floor(Math.random() * 3) + 3; // 3-5 txs
        for (let i = 0; i < txCount; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)] as string;
            const merchantList = merchants[category] || ['Store'];
            const merchant = merchantList[Math.floor(Math.random() * merchantList.length)] as string;

            // Realistic amounts: $8 - $150
            const amount = Math.round((Math.random() * 142 + 8) * 100) / 100;

            transactions.push({
                amount,
                merchant,
                category,
                date,
                type: 'expense',
            });
        }
    }

    // --- Last week (7-14 days ago) - 3-5 transactions per day ---
    for (let dayOffset = 7; dayOffset < 14; dayOffset++) {
        const date = new Date(today);
        date.setDate(today.getDate() - dayOffset);

        const txCount = Math.floor(Math.random() * 3) + 3;
        for (let i = 0; i < txCount; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)] as string;
            const merchantList = merchants[category] || ['Store'];
            const merchant = merchantList[Math.floor(Math.random() * merchantList.length)] as string;
            const amount = Math.round((Math.random() * 142 + 8) * 100) / 100;

            transactions.push({
                amount,
                merchant,
                category,
                date,
                type: 'expense',
            });
        }
    }

    // --- All 12 months of current year - 5-10 transactions per month with good amounts ---
    for (let month = 0; month < 12; month++) {
        const txCount = Math.floor(Math.random() * 6) + 5; // 5-10 per month
        for (let i = 0; i < txCount; i++) {
            const day = Math.floor(Math.random() * 28) + 1;
            const date = new Date(today.getFullYear(), month, day);

            const category = categories[Math.floor(Math.random() * categories.length)] as string;
            const merchantList = merchants[category] || ['Store'];
            const merchant = merchantList[Math.floor(Math.random() * merchantList.length)] as string;

            // Monthly expenses: $15 - $250
            const amount = Math.round((Math.random() * 235 + 15) * 100) / 100;

            transactions.push({
                amount,
                merchant,
                category,
                date,
                type: 'expense',
            });
        }
    }

    // Add monthly salary
    for (let month = 0; month < 12; month++) {
        const date = new Date(today.getFullYear(), month, 15);
        if (date <= today) {
            transactions.push({
                amount: 4200,
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

    console.log('Done! Database reseeded with better data.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
