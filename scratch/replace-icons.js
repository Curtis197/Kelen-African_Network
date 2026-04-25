const fs = require('fs');
const path = require('path');

const ICON_MAP = {
  'home': 'Home',
  'search': 'Search',
  'chevron_right': 'ChevronRight',
  'close': 'X',
  'menu': 'Menu',
  'check': 'Check',
  'arrow_back': 'ArrowLeft',
  'person': 'User',
  'settings': 'Settings',
  'star': 'Star',
  'report': 'AlertTriangle',
  'block': 'Ban',
  'work': 'Briefcase',
  'call': 'Phone',
  'arrow_forward': 'ArrowRight',
  'message': 'MessageSquare',
  'open_in_new': 'ExternalLink',
  'mail': 'Mail',
  'add_task': 'ListTodo',
  'reviews': 'MessageCircle', // or Star
  'flag': 'Flag',
  'account_circle': 'UserCircle',
  'expand_more': 'ChevronDown',
  'dashboard': 'LayoutDashboard',
  'verified_user': 'ShieldCheck',
  'logout': 'LogOut',
  'business_center': 'Briefcase',
  'login': 'LogIn',
  'public': 'Globe',
  'add': 'Plus',
  'edit': 'Edit',
  'delete': 'Trash2',
  'arrow_upward': 'ArrowUp',
  'arrow_downward': 'ArrowDown',
  'arrow_outward': 'ExternalLink',
  'info': 'Info',
  'error': 'AlertCircle',
  'warning': 'AlertTriangle',
  'location_on': 'MapPin',
  'visibility': 'Eye',
  'visibility_off': 'EyeOff',
  'photo_camera': 'Camera',
  'more_vert': 'MoreVertical',
  'content_copy': 'Copy',
  'check_circle': 'CheckCircle',
  'cancel': 'XCircle',
  'help': 'HelpCircle',
  'download': 'Download',
  'upload': 'Upload',
  'verified': 'BadgeCheck',
  'share': 'Share2',
  'history': 'History',
  'filter_list': 'Filter',
  'sort': 'ArrowUpDown',
  'tune': 'SlidersHorizontal',
  'account_balance': 'Landmark'
};

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

const targetDirs = ['app', 'components'];

let allIcons = new Set();
let filesToModify = [];

targetDirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  walkDir(dir, (filePath) => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      const regex = /<span[^>]*material-symbols-outlined[^>]*>\s*([a-z_]+)\s*<\/span>/g;
      
      // also match dynamic icons like {item.icon} where we can't easily replace it with Lucide component
      let matches = [];
      let match;
      while ((match = regex.exec(content)) !== null) {
        allIcons.add(match[1]);
        filesToModify.push(filePath);
      }
    }
  });
});

console.log("Found icons:", Array.from(allIcons));
