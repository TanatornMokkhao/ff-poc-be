import http from 'node:http';
import { handle } from './server.js';

const port = Number(process.env.PORT || 3000);
http.createServer(handle).listen(port, () => console.log(`be ${process.env.APP_VERSION || 'dev'} on ${port}`));
