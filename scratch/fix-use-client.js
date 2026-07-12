const fs = require('fs');
const path = require('path');

const directory = 'c:/Users/Admin/Documents/VS code/Department Vote/app';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      if (dirPath.endsWith('.tsx') || dirPath.endsWith('.ts')) {
        callback(dirPath);
      }
    }
  });
}

let modifiedFiles = [];

walkDir(directory, function(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;
  
  // Check if "use client" exists but is not the first non-empty line
  const lines = content.split('\n');
  let useClientIndex = -1;
  let hasUseClient = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '"use client";' || lines[i].trim() === "'use client';") {
      hasUseClient = true;
      useClientIndex = i;
      break;
    }
  }

  // If it has "use client" but it's not the first line (excluding empty lines)
  if (hasUseClient && useClientIndex > 0) {
    let isFirstUsefulLine = true;
    for (let i = 0; i < useClientIndex; i++) {
      if (lines[i].trim() !== '') {
        isFirstUsefulLine = false;
        break;
      }
    }

    if (!isFirstUsefulLine) {
      // Remove it from its current position
      lines.splice(useClientIndex, 1);
      // Add it to the top
      lines.unshift('"use client";');
      
      content = lines.join('\n');
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    modifiedFiles.push(filePath);
    console.log(`Fixed "use client" in: ${filePath}`);
  }
});

console.log(`\nModified ${modifiedFiles.length} files.`);
