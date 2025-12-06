import app from './app.js';

console.log('ENV VALUES', process.env);

const PORT = process.env['PORT'] || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
