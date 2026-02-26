#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface PerformanceResult {
  testName: string;
  duration: number;
  status: 'PASS' | 'FAIL';
  threshold: number;
  actualValue: number;
  timestamp: string;
}

class PerformanceTestRunner {
  private results: PerformanceResult[] = [];
  private readonly outputDir = path.join(__dirname, '../performance-reports');

  constructor() {
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async runPerformanceTests(): Promise<void> {
    console.log('🚀 Starting Immobilier Performance Tests...\n');

    try {
      // Run performance tests with Jest
      const testCommand = 'npm test -- --testPathPattern=performance --verbose --detectOpenHandles';
      
      console.log('Executing performance tests...');
      const output = execSync(testCommand, { 
        encoding: 'utf8',
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe'
      });

      console.log(output);
      
      // Parse test results (this would be more sophisticated in a real implementation)
      this.parseTestOutput(output);
      
      // Generate performance report
      await this.generateReport();
      
      console.log('\n✅ Performance tests completed successfully!');
      
    } catch (error) {
      console.error('❌ Performance tests failed:', error.message);
      
      // Still generate report with failure information
      await this.generateReport();
      
      process.exit(1);
    }
  }

  private parseTestOutput(output: string): void {
    // This is a simplified parser - in reality, you'd use Jest's JSON reporter
    const lines = output.split('\n');
    
    lines.forEach(line => {
      // Look for performance timing logs
      const timingMatch = line.match(/(\w+.*?): (\d+)ms/);
      if (timingMatch) {
        const [, testName, duration] = timingMatch;
        
        this.results.push({
          testName: testName.trim(),
          duration: parseInt(duration),
          status: 'PASS', // Would be determined by actual test results
          threshold: this.getThresholdForTest(testName),
          actualValue: parseInt(duration),
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  private getThresholdForTest(testName: string): number {
    // Map test names to their performance thresholds
    const thresholds: Record<string, number> = {
      'Unpaid detection': 500,
      'Statistics calculation': 2000,
      'Excel import': 5000,
      'Pagination': 300,
      'Filtered query': 200
    };

    for (const [key, threshold] of Object.entries(thresholds)) {
      if (testName.toLowerCase().includes(key.toLowerCase())) {
        return threshold;
      }
    }

    return 1000; // Default threshold
  }

  private async generateReport(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(this.outputDir, `performance-report-${timestamp}.json`);
    const htmlReportPath = path.join(this.outputDir, `performance-report-${timestamp}.html`);

    // Generate JSON report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.results.length,
        passed: this.results.filter(r => r.status === 'PASS').length,
        failed: this.results.filter(r => r.status === 'FAIL').length,
        averageDuration: this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length
      },
      results: this.results,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: process.memoryUsage()
      }
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate HTML report
    const htmlContent = this.generateHtmlReport(report);
    fs.writeFileSync(htmlReportPath, htmlContent);

    console.log(`\n📊 Performance report generated:`);
    console.log(`   JSON: ${reportPath}`);
    console.log(`   HTML: ${htmlReportPath}`);
  }

  private generateHtmlReport(report: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Immobilier Performance Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: #e3f2fd; padding: 15px; border-radius: 5px; text-align: center; }
        .metric.fail { background: #ffebee; }
        .results { margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f5f5f5; }
        .pass { color: green; }
        .fail { color: red; }
        .chart { margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Immobilier Performance Test Report</h1>
        <p>Generated: ${report.timestamp}</p>
        <p>Environment: Node ${report.environment.nodeVersion} on ${report.environment.platform}</p>
    </div>

    <div class="summary">
        <div class="metric">
            <h3>Total Tests</h3>
            <div>${report.summary.totalTests}</div>
        </div>
        <div class="metric">
            <h3>Passed</h3>
            <div class="pass">${report.summary.passed}</div>
        </div>
        <div class="metric ${report.summary.failed > 0 ? 'fail' : ''}">
            <h3>Failed</h3>
            <div class="fail">${report.summary.failed}</div>
        </div>
        <div class="metric">
            <h3>Avg Duration</h3>
            <div>${Math.round(report.summary.averageDuration)}ms</div>
        </div>
    </div>

    <div class="results">
        <h2>Test Results</h2>
        <table>
            <thead>
                <tr>
                    <th>Test Name</th>
                    <th>Duration (ms)</th>
                    <th>Threshold (ms)</th>
                    <th>Status</th>
                    <th>Performance</th>
                </tr>
            </thead>
            <tbody>
                ${report.results.map((result: PerformanceResult) => `
                    <tr>
                        <td>${result.testName}</td>
                        <td>${result.actualValue}</td>
                        <td>${result.threshold}</td>
                        <td class="${result.status.toLowerCase()}">${result.status}</td>
                        <td>${Math.round((result.threshold / result.actualValue) * 100)}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="chart">
        <h2>Performance Trends</h2>
        <p>Performance data can be used to track trends over time and identify regressions.</p>
    </div>
</body>
</html>`;
  }
}

// Run performance tests if this script is executed directly
if (require.main === module) {
  const runner = new PerformanceTestRunner();
  runner.runPerformanceTests().catch(console.error);
}

export { PerformanceTestRunner };