import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAudiences() {
  try {
    const audiences = await prisma.audiences.findMany({
      select: { 
        id: true, 
        statut: true, 
        date: true,
        affaire: {
          select: {
            reference: true
          }
        }
      },
      take: 10
    });
    
    console.log('Audiences in database:', audiences.length);
    audiences.forEach(a => {
      console.log(`- ${a.affaire?.reference}: ${a.statut} (${a.date})`);
    });
    
    const statusCounts = await prisma.audiences.groupBy({
      by: ['statut'],
      _count: {
        statut: true
      }
    });
    
    console.log('\nStatus counts:', statusCounts);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAudiences();