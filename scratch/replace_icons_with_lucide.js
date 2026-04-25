const fs = require('fs');
const path = require('path');

const map = {
  'arrow_back': 'ArrowLeft',
  'description': 'FileText',
  'open_in_new': 'ExternalLink',
  'image': 'Image',
  'visibility': 'Eye',
  'attach_file': 'Paperclip',
  'download': 'Download',
  'account_circle': 'UserCircle',
  'verified': 'BadgeCheck',
  'check_circle': 'CheckCircle',
  'pending': 'Clock',
  'person_pin_circle': 'MapPin',
  'history': 'History',
  'close': 'X',
  'verified_user': 'ShieldCheck',
  'search': 'Search',
  'favorite': 'Heart',
  'location_on': 'MapPin',
  'person_search': 'UserSearch',
  'add_circle': 'PlusCircle',
  'filter_list': 'Filter',
  'payments': 'CreditCard',
  'edit': 'Edit',
  'chevron_right': 'ChevronRight',
  'folder_open': 'FolderOpen',
  'hub': 'Network',
  'expand_more': 'ChevronDown',
  'category': 'LayoutGrid',
  'book': 'Book',
  'folder_special': 'FolderStar',
  'picture_as_pdf': 'FileJson', // or FileText
  'add': 'Plus',
  'group': 'Users',
  'delete': 'Trash2',
  'arrow_forward': 'ArrowRight',
  'person_add': 'UserPlus',
  'gavel': 'Gavel',
  'manage_search': 'Search',
  'report_problem': 'AlertTriangle',
  'search_off': 'SearchX',
  'person_add_disabled': 'UserMinus',
  'security': 'Shield',
  'info': 'Info',
  'dataset': 'Database',
  'settings_suggest': 'Settings',
  'enhanced_encryption': 'Lock',
  'person': 'User',
  'account_balance': 'Landmark',
  'analytics': 'LineChart',
  'devices': 'MonitorSmartphone',
  'delete_forever': 'Trash',
  'mail': 'Mail',
  'lock': 'Lock',
  'key': 'Key',
  'cloud_done': 'CloudCheck',
  'shield_with_heart': 'Shield',
  'edit_note': 'FileEdit',
  'dns': 'Server',
  'cookie': 'Cookie',
  'cloud': 'Cloud',
  'warning': 'AlertTriangle',
  'notifications': 'Bell',
  'credit_card': 'CreditCard',
  'cancel': 'XCircle',
  'lightbulb': 'Lightbulb',
  'grid_view': 'LayoutGrid',
  'list': 'List',
  'cloud_off': 'CloudOff',
  'attachment': 'Paperclip',
  'cloud_upload': 'UploadCloud',
  'link': 'Link',
  'workspace_premium': 'Award',
  'subject': 'AlignLeft',
  'send': 'Send',
  'reply': 'Reply',
  'report': 'Flag',
  'block': 'Ban',
  'star': 'Star',
  'home': 'Home',
  'work': 'Briefcase',
  'call': 'Phone',
  'message': 'MessageSquare',
  'add_task': 'ListTodo',
  'reviews': 'MessageCircle',
  'flag': 'Flag',
  'dashboard': 'LayoutDashboard',
  'logout': 'LogOut',
  'business_center': 'Briefcase',
  'login': 'LogIn',
  'public': 'Globe',
  'check': 'Check',
  'arrow_upward': 'ArrowUp',
  'arrow_downward': 'ArrowDown',
  'alt_route': 'GitBranch',
  'photo_library': 'Image',
  'add_photo_alternate': 'ImagePlus'
};

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    if(fs.statSync(dirPath).isDirectory()) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

const targetDirs = ['app', 'components'];

targetDirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  walkDir(dir, (filePath) => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      const regex = /<span[^>]*material-symbols-outlined[^>]*>([\s\w_{}.]+)<\/span>/g;
      
      let matches = [];
      let match;
      while ((match = regex.exec(content)) !== null) {
        matches.push(match);
      }
      
      if (matches.length > 0) {
        let lucideImports = new Set();
        let newContent = content;
        
        // Reverse order replacement to not mess up indices
        for (let i = matches.length - 1; i >= 0; i--) {
          const m = matches[i];
          const fullMatch = m[0];
          const iconNameText = m[1].trim();
          
          if (iconNameText.startsWith('{') && iconNameText.endsWith('}')) {
               console.log("Skipping dynamic icon:", iconNameText, "in", filePath);
               continue;
          }
          
          const lucideName = map[iconNameText];
          if (!lucideName) {
            console.log("No mapping for:", iconNameText, "in", filePath);
            continue;
          }
          
          lucideImports.add(lucideName);
          
          let classNameMatch = fullMatch.match(/className="([^"]+)"/);
          let rawClasses = classNameMatch ? classNameMatch[1] : "";
          // Remove material-symbols-outlined
          let classes = rawClasses.replace(/material-symbols-outlined/g, '')
            .replace(/text-\[.*?\]/g, '') // optionally remove exact text sizes to let Lucide scale naturally, or we keep them
            .trim();
          
          // Many lucide icons inherit color and size. If we keep the class it is often fine.
          // Let's create the element
          let lucideEl = `<${lucideName} className="${classes}" />`;
          if (classes === "") {
             lucideEl = `<${lucideName} />`;
          }
          
          newContent = newContent.substring(0, m.index) + lucideEl + newContent.substring(m.index + fullMatch.length);
        }
        
        if (lucideImports.size > 0) {
          // Add import
          const importStr = `import { ${Array.from(lucideImports).join(', ')} } from "lucide-react";\n`;
          
          // Check if there's already an import from lucide-react
          const existingImportRegex = /import\s+{([^}]+)}\s+from\s+['"]lucide-react['"];?/;
          const existingImportMatch = newContent.match(existingImportRegex);
          
          if (existingImportMatch) {
            let existingImports = existingImportMatch[1].split(',').map(s => s.trim());
            Array.from(lucideImports).forEach(i => {
              if(!existingImports.includes(i)) existingImports.push(i);
            });
            newContent = newContent.replace(existingImportRegex, `import { ${existingImports.join(', ')} } from "lucide-react";`);
          } else {
             // add to top
             const lastImportIndex = newContent.lastIndexOf('import ');
             if (lastImportIndex !== -1) {
                const endOfLastImport = newContent.indexOf('\n', lastImportIndex);
                newContent = newContent.substring(0, endOfLastImport + 1) + importStr + newContent.substring(endOfLastImport + 1);
             } else {
               newContent = importStr + newContent;
             }
          }
          
          fs.writeFileSync(filePath, newContent, 'utf8');
          console.log(`Updated ${filePath}`);
        }
      }
    }
  });
});
