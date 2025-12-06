import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.join(__dirname, '../..');

// Load .env from project root before any other imports
dotenv.config({ path: path.join(rootDir, '.env') });

import app from './app.js';

const PORT = process.env['PORT'] || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
