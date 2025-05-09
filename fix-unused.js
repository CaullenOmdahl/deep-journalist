/**
 * Script to automatically fix common ESLint issues in the codebase
 * Focuses on removing unused variables and imports
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const srcDir = path.join(__dirname, 'src');
const extensions = ['.ts', '.tsx', '.js', '.jsx'];

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

console.log(`${colors.blue}Starting to fix unused variables and imports...${colors.reset}`);

// Function to recursively process directories
function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && extensions.includes(path.extname(entry.name))) {
      try {
        console.log(`${colors.yellow}Fixing issues in ${fullPath}${colors.reset}`);
        
        // Run ESLint with --fix option
        execSync(`npx eslint "${fullPath}" --fix`, { stdio: 'pipe' });
        
        console.log(`${colors.green}Successfully fixed issues in ${fullPath}${colors.reset}`);
      } catch (error) {
        console.log(`${colors.red}Error fixing ${fullPath}: ${error.message}${colors.reset}`);
      }
    }
  }
}

// Start processing from the src directory
try {
  processDirectory(srcDir);
  console.log(`${colors.green}Finished fixing unused variables and imports!${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Error occurred: ${error.message}${colors.reset}`);
  process.exit(1);
}

