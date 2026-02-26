const { PrismaClient } = require('@prisma/client');
const { ImportExcelService } = require('./dist/src/immobilier/import/import-excel.service');
const fs = require('fs');

async function testTemplateGeneration() {
  const prisma = new PrismaClient();
  const importService = new ImportExcelService(prisma);

  try {
    console.log('Testing template generation...');
    
    // Test proprietaires template
    const proprietairesTemplate = await importService.generateTemplate('proprietaires');
    fs.writeFileSync('./template-proprietaires-test.xlsx', proprietairesTemplate);
    console.log('✓ Propriétaires template generated successfully');

    // Test immeubles template
    const immeublesTemplate = await importService.generateTemplate('immeubles');
    fs.writeFileSync('./template-immeubles-test.xlsx', immeublesTemplate);
    console.log('✓ Immeubles template generated successfully');

    // Test locataires template
    const locatairesTemplate = await importService.generateTemplate('locataires');
    fs.writeFileSync('./template-locataires-test.xlsx', locatairesTemplate);
    console.log('✓ Locataires template generated successfully');

    // Test lots template
    const lotsTemplate = await importService.generateTemplate('lots');
    fs.writeFileSync('./template-lots-test.xlsx', lotsTemplate);
    console.log('✓ Lots template generated successfully');

    console.log('\nAll templates generated successfully!');
    console.log('Files created:');
    console.log('- template-proprietaires-test.xlsx');
    console.log('- template-immeubles-test.xlsx');
    console.log('- template-locataires-test.xlsx');
    console.log('- template-lots-test.xlsx');

  } catch (error) {
    console.error('Error testing template generation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTemplateGeneration();