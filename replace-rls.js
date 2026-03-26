const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'supabase', 'migrations');
const files = fs.readdirSync(dir);

let replacedCount = 0;

for (const file of files) {
  if (file.endsWith('.sql')) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace the specific problem string
    const searchString = "(SELECT role FROM users WHERE id = auth.uid()) = 'admin'";
    const replaceString = "public.has_role('admin')";
    
    if (content.includes(searchString)) {
      content = content.split(searchString).join(replaceString);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${file}`);
      replacedCount++;
    }
  }
}

console.log(`Finished replacing in ${replacedCount} files.`);
