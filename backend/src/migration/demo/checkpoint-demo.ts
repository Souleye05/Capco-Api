import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { CheckpointService } from '../services/checkpoint.service';
import { MigrationPhase } from '../types/checkpoint.types';

/**
 * Demo script showing how to use the checkpoint system
 * 
 * This demonstrates:
 * 1. Creating checkpoints at different migration phases
 * 2. Validating checkpoints before progression
 * 3. Rolling back to specific checkpoints
 * 4. Listing and managing checkpoints
 */
async function demonstrateCheckpointSystem() {
  console.log('🚀 Starting Checkpoint System Demo...\n');

  // Initialize NestJS application
  const app = await NestFactory.createApplicationContext(AppModule);
  const checkpointService = app.get(CheckpointService);

  try {
    // 1. Create initial checkpoint
    console.log('📍 Creating initial checkpoint...');
    const initialCheckpoint = await checkpointService.createCheckpoint(
      'initial-state',
      MigrationPhase.INITIAL,
      'Initial state before migration starts'
    );
    console.log(`✅ Created checkpoint: ${initialCheckpoint.id}`);
    console.log(`   Status: ${initialCheckpoint.status}`);
    console.log(`   Phase: ${initialCheckpoint.phase}\n`);

    // 2. Simulate schema extraction phase
    console.log('📍 Creating schema extraction checkpoint...');
    const schemaCheckpoint = await checkpointService.createCheckpoint(
      'schema-extracted',
      MigrationPhase.SCHEMA_EXTRACTED,
      'Schema successfully extracted from Supabase'
    );
    console.log(`✅ Created checkpoint: ${schemaCheckpoint.id}`);
    console.log(`   Validation results: ${schemaCheckpoint.validationResults?.length || 0} checks\n`);

    // 3. Validate checkpoint before progression
    console.log('🔍 Validating checkpoint before progression...');
    const isValid = await checkpointService.validateCheckpointBeforeProgression(
      MigrationPhase.SCHEMA_EXTRACTED
    );
    console.log(`✅ Checkpoint validation: ${isValid ? 'PASSED' : 'FAILED'}\n`);

    // 4. Create data migration checkpoint
    console.log('📍 Creating data migration checkpoint...');
    const dataCheckpoint = await checkpointService.createCheckpoint(
      'data-migrated',
      MigrationPhase.DATA_MIGRATED,
      'All data successfully migrated from Supabase'
    );
    console.log(`✅ Created checkpoint: ${dataCheckpoint.id}\n`);

    // 5. List all checkpoints
    console.log('📋 Listing all checkpoints...');
    const allCheckpoints = await checkpointService.listCheckpoints();
    console.log(`Found ${allCheckpoints.length} checkpoints:`);
    allCheckpoints.forEach((cp, index) => {
      console.log(`   ${index + 1}. ${cp.name} (${cp.phase}) - ${cp.status}`);
    });
    console.log();

    // 6. Get active checkpoint for specific phase
    console.log('🎯 Getting active checkpoint for DATA_MIGRATED phase...');
    const activeCheckpoint = await checkpointService.getActiveCheckpointForPhase(
      MigrationPhase.DATA_MIGRATED
    );
    if (activeCheckpoint) {
      console.log(`✅ Active checkpoint: ${activeCheckpoint.name}`);
      console.log(`   Created: ${activeCheckpoint.createdAt.toISOString()}`);
      console.log(`   Metadata: ${JSON.stringify(activeCheckpoint.metadata, null, 2)}\n`);
    }

    // 7. Demonstrate rollback (this would normally be used in case of failure)
    console.log('⏪ Demonstrating rollback to initial checkpoint...');
    console.log('   (Note: This is a demo - in production, use this only when needed)');
    
    try {
      const rollbackResult = await checkpointService.rollbackToCheckpoint(initialCheckpoint.id);
      console.log(`✅ Rollback result: ${rollbackResult.success ? 'SUCCESS' : 'FAILED'}`);
      console.log(`   Components rolled back: ${rollbackResult.componentsRolledBack.join(', ')}`);
      if (rollbackResult.errors.length > 0) {
        console.log(`   Errors: ${rollbackResult.errors.join(', ')}`);
      }
    } catch (error) {
      console.log(`❌ Rollback demo failed (expected in demo environment): ${error.message}`);
    }
    console.log();

    // 8. Filter checkpoints by phase
    console.log('🔍 Filtering checkpoints by INITIAL phase...');
    const initialCheckpoints = await checkpointService.listCheckpoints(MigrationPhase.INITIAL);
    console.log(`Found ${initialCheckpoints.length} checkpoints in INITIAL phase:`);
    initialCheckpoints.forEach((cp, index) => {
      console.log(`   ${index + 1}. ${cp.name} - ${cp.status}`);
    });

    console.log('\n✨ Checkpoint System Demo completed successfully!');
    console.log('\n📚 Key Features Demonstrated:');
    console.log('   • ✅ Checkpoint creation with metadata collection');
    console.log('   • ✅ Validation before migration progression');
    console.log('   • ✅ Granular rollback to specific checkpoints');
    console.log('   • ✅ Checkpoint listing and filtering');
    console.log('   • ✅ Active checkpoint management');
    console.log('   • ✅ Comprehensive error handling');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await app.close();
  }
}

// Run the demo
if (require.main === module) {
  demonstrateCheckpointSystem()
    .then(() => {
      console.log('\n🎉 Demo completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Demo failed:', error);
      process.exit(1);
    });
}

export { demonstrateCheckpointSystem };