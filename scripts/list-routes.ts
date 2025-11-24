import app from '../src/app.js';
import expressListRoutes from 'express-list-routes';

console.log('\n📍 Application Routes:\n');
expressListRoutes(app, {
  logger: (method, space, path) => console.log(method + space + path.replace('/~', ''))
});
