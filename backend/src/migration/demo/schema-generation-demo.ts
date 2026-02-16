import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { SchemaExtractorService } from '../services/schema-extractor.service';
import { PrismaSchemaGeneratorService } from '../services/prisma-schema-generator.service';
import * as path from 'path';

/**
 * Demo script for complete schema extraction and Prisma generation workflow
 * 
 * This demonstrates:
 * 1. Extracting schema from Supabase migrations
 * 2. Generating Prisma schema from extracted data
 * 3. Validating the generated schema
 * 4. Writing the schema to file
 */
async function demonstrateSchemaGeneration() {
  console.log('🚀 Starting Schema Generation Demo');
  console.log('=====================================\n');

  try {
    // Initialize NestJS application
    const app = await NestFactory.createApplicationContext(AppModule);
    const schemaExtractor = app.get(SchemaExtractorService);
    const prismaGenerator = app.get(PrismaSchemaGeneratorService);

    // Step 1: Extract schema from Supabase migrations
    console.log('📋 Step 1: Extracting schema from Supabase migrations...');
    const migrationPath = path.join(process.cwd(), '..', 'frontend', 'supabase', 'migrations');
    
    const extractedSchema = await schemaExtractor.extractCompleteSchema(migrationPath);
    
    console.log(`✅ Schema extraction completed:`);
    console.log(`   - Tables extracted: ${extractedSchema.tables.length}`);
    console.log(`   - Enums extracted: ${extractedSchema.enums.length}`);
    console.log(`   - Functions extracted: ${extractedSchema.functions.length}`);
    console.log(`   - Migration files processed: ${extractedSchema.migrationFiles.length}`);
    
    // Display extracted tables
    console.log('\n📊 Extracted Tables:');
    extractedSchema.tables.forEach(table => {
      console.log(`   - ${table.name} (${table.columns.length} columns, ${table.constraints.length} constraints)`);
    });
    
    // Display extracted enums
    console.log('\n🏷️  Extracted Enums:');
    extractedSchema.enums.forEach(enumDef => {
      console.log(`   - ${enumDef.name}: [${enumDef.values.join(', ')}]`);
    });

    // Step 2: Validate extracted schema
    console.log('\n🔍 Step 2: Validating extracted schema...');
    const validation = await schemaExtractor.validateExtractedSchema(extractedSchema);
    
    console.log(`✅ Schema validation: ${validation.isValid ? 'PASSED' : 'FAILED'}`);
    if (validation.warnings.length > 0) {
      console.log(`⚠️  Warnings (${validation.warnings.length}):`);
      validation.warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    if (validation.errors.length > 0) {
      console.log(`❌ Errors (${validation.errors.length}):`);
      validation.errors.forEach(error => console.log(`   - ${error}`));
    }

    // Step 3: Generate Prisma schema
    console.log('\n🏗️  Step 3: Generating Prisma schema...');
    const outputPath = path.join(process.cwd(), 'prisma', 'generated-schema.prisma');
    
    const generationResult = await prismaGenerator.generatePrismaSchema(extractedSchema, {
      outputPath,
      includeComments: true,
      preserveSupabaseMetadata: true,
      generateMigrations: false,
    });
    
    console.log(`✅ Prisma schema generation completed:`);
    console.log(`   - Models generated: ${generationResult.modelsGenerated.length}`);
    console.log(`   - Enums generated: ${generationResult.enumsGenerated}`);
    console.log(`   - Schema written to: ${outputPath}`);
    
    // Display generated models
    console.log('\n📝 Generated Models:');
    generationResult.modelsGenerated.forEach(model => {
      console.log(`   - ${model}`);
    });
    
    if (generationResult.warnings.length > 0) {
      console.log(`\n⚠️  Generation Warnings (${generationResult.warnings.length}):`);
      generationResult.warnings.forEach(warning => console.log(`   - ${warning}`));
    }

    // Step 4: Validate generated Prisma schema
    console.log('\n✅ Step 4: Validating generated Prisma schema...');
    const schemaValidation = await prismaGenerator.validateGeneratedSchema(generationResult.schemaContent);
    
    console.log(`✅ Prisma schema validation: ${schemaValidation.isValid ? 'PASSED' : 'FAILED'}`);
    if (schemaValidation.warnings.length > 0) {
      console.log(`⚠️  Schema Warnings (${schemaValidation.warnings.length}):`);
      schemaValidation.warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    if (schemaValidation.errors.length > 0) {
      console.log(`❌ Schema Errors (${schemaValidation.errors.length}):`);
      schemaValidation.errors.forEach(error => console.log(`   - ${error}`));
    }

    // Step 5: Display schema preview
    console.log('\n📄 Step 5: Schema Preview (first 50 lines):');
    console.log('─'.repeat(80));
    const lines = generationResult.schemaContent.split('\n');
    lines.slice(0, 50).forEach((line, index) => {
      console.log(`${(index + 1).toString().padStart(3, ' ')}: ${line}`);
    });
    if (lines.length > 50) {
      console.log(`... (${lines.length - 50} more lines)`);
    }
    console.log('─'.repeat(80));

    // Step 6: Export extracted schema for reference
    console.log('\n💾 Step 6: Exporting extracted schema for reference...');
    const extractedSchemaPath = path.join(process.cwd(), 'migration-logs', 'extracted-schema.json');
    await schemaExtractor.exportSchemaToFile(extractedSchema, extractedSchemaPath);
    console.log(`✅ Extracted schema exported to: ${extractedSchemaPath}`);

    // Summary
    console.log('\n🎉 Schema Generation Demo Completed Successfully!');
    console.log('================================================');
    console.log(`📊 Summary:`);
    console.log(`   - Supabase tables processed: ${extractedSchema.tables.length}`);
    console.log(`   - Prisma models generated: ${generationResult.modelsGenerated.length}`);
    console.log(`   - Enums converted: ${generationResult.enumsGenerated}`);
    console.log(`   - Schema file: ${outputPath}`);
    console.log(`   - Extraction data: ${extractedSchemaPath}`);
    
    console.log('\n📋 Next Steps:');
    console.log('   1. Review the generated Prisma schema');
    console.log('   2. Run `npx prisma generate` to generate the Prisma client');
    console.log('   3. Run `npx prisma migrate dev` to create database migrations');
    console.log('   4. Test the schema with your application');

    await app.close();

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  demonstrateSchemaGeneration().catch(console.error);
}

export { demonstrateSchemaGeneration };