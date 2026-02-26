import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'immeubles'
    `;
        console.log('Columns in immeubles table:');
        console.log(JSON.stringify(columns, null, 2));
    } catch (error) {
        console.error('Error fetching columns:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
