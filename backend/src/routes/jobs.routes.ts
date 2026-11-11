import { Router } from 'express';
import { runJobs } from '../controllers/jobs.controller';

const jobsRouter = Router();

jobsRouter.post('/run', runJobs);

export default jobsRouter;
