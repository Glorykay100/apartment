import dotenv from 'dotenv';
dotenv.config();

import { app } from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Yahsab API Server] running on http://localhost:${PORT}`);
  console.log(`[Health check] available at http://localhost:${PORT}/api/v1/health`);
});
