const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
};

const files = walk('c:/Users/pteja/Downloads/Xeno-crm (2)/frontend/src');

const replacements = [
  { regex: /text-white/g, replacement: 'text-slate-900' },
  { regex: /text-gray-100/g, replacement: 'text-slate-900' },
  { regex: /text-gray-200/g, replacement: 'text-slate-800' },
  { regex: /text-gray-300/g, replacement: 'text-slate-700' },
  { regex: /text-gray-400/g, replacement: 'text-slate-500' },
  { regex: /text-gray-500/g, replacement: 'text-slate-400' },
  { regex: /text-gray-600/g, replacement: 'text-slate-400' },
  { regex: /bg-gray-950/g, replacement: 'bg-[#F4F9FF]' },
  { regex: /bg-gray-900\/50/g, replacement: 'bg-slate-50' },
  { regex: /bg-gray-900/g, replacement: 'bg-white' },
  { regex: /bg-gray-800\/50/g, replacement: 'bg-slate-50' },
  { regex: /bg-gray-800\/30/g, replacement: 'bg-slate-50\/50' },
  { regex: /bg-gray-800/g, replacement: 'bg-slate-100' },
  { regex: /bg-gray-700/g, replacement: 'bg-slate-200' },
  { regex: /border-gray-800\/50/g, replacement: 'border-slate-200' },
  { regex: /border-gray-800/g, replacement: 'border-slate-200' },
  { regex: /border-gray-700/g, replacement: 'border-slate-300' },
];

let modifiedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  replacements.forEach(({regex, replacement}) => {
    content = content.replace(regex, replacement);
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedFiles++;
    console.log('Modified', file);
  }
});

console.log('Done modifying', modifiedFiles, 'files.');
