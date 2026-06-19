import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

export type NotebookLmDispatchableJobType = 'INGEST' | 'QUERY' | 'DELETE_DOC';

const PYTHON_WORKER_BY_JOB_TYPE: Record<NotebookLmDispatchableJobType, 'ingestion' | 'query' | 'delete'> = {
  INGEST: 'ingestion',
  QUERY: 'query',
  DELETE_DOC: 'delete',
};

export async function dispatchNotebookLmWorker(jobType: NotebookLmDispatchableJobType): Promise<void> {
  const workerName = PYTHON_WORKER_BY_JOB_TYPE[jobType];
  const projectRoot = path.resolve(process.cwd(), '..');
  const venvPythonOnWindows = path.resolve(projectRoot, '.venv', 'Scripts', 'python.exe');
  const pythonExecutable = process.env.PYTHON_WORKER_EXECUTABLE
    || (fs.existsSync(venvPythonOnWindows) ? venvPythonOnWindows : 'python');
  const scriptPath = path.resolve(projectRoot, 'python-services', 'run_worker_live.py');

  const child = spawn(pythonExecutable, [scriptPath, '--worker', workerName, '--once'], {
    cwd: projectRoot,
    detached: true,
    stdio: 'ignore',
  });

  child.unref();
}
