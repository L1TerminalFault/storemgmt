const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');

      // 1. Remove border classes from div clusters (heuristics for cards)
      // We will look for sequences like: "bg-theme-card border border-theme-border"
      content = content.replace(/bg-theme-card(\/80)? backdrop-blur-([a-z0-9]+) border(-[lrtby])? border(-[lrtby])?-theme-border/g, 'bg-theme-card$1 backdrop-blur-$2');
      content = content.replace(/bg-theme-card(\/80)? border(-[lrtby])? border(-[lrtby])?-theme-border/g, 'bg-theme-card$1');
      content = content.replace(/border border-theme-border/g, ''); // global wipe on borders to obey strict reference 
      
      // Fix double spaces
      content = content.replace(/  +/g, ' ');

      // 2. Add button hover effects (scale)
      // Find className="..." inside <button>
      content = content.replace(/<button([^>]+)className=["']([^"']+)["']/g, (match, prefix, classNames) => {
        if (!classNames.includes("hover:scale-105")) {
          // ensure transition-transform is added for scaling
          let newClasses = classNames;
          if (!newClasses.includes("transition-")) newClasses += " transition-all";
          newClasses += " hover:scale-[1.03] active:scale-95 duration-300";
          return `<button${prefix}className="${newClasses}"`;
        }
        return match;
      });

      // Also add hover effect to the clickable divs like expanding cards in Customers
      // Look for cursor-pointer and add scale interactions if they are distinct elements
      content = content.replace(/className=["']([^"']+)cursor-pointer([^"']+)["']/g, (match, prefix, suffix) => {
        let classes = `${prefix}cursor-pointer${suffix}`;
        if (!classes.includes("hover:scale-")) {
            // Apply a slight scale for generic clickable divs
            classes += " active:scale-[0.98] transition-transform duration-300";
        }
        return `className="${classes}"`;
      });

      fs.writeFileSync(fullPath, content);
      console.log('Fixed styles in:', fullPath);
    }
  }
}

processDir(path.join(__dirname, '../src/app/(main)'));
processDir(path.join(__dirname, '../src/components'));
