import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { ApprovalRecord, RejectionRecord, AntiPattern } from '../types';

const MEMORY_DIR = join(process.cwd(), 'outputs', 'reports');
const APPROVALS_FILE = join(MEMORY_DIR, 'approvals.json');
const REJECTIONS_FILE = join(MEMORY_DIR, 'rejections.json');
const ANTIPATTERNS_FILE = join(MEMORY_DIR, 'antiPatterns.json');

async function ensureMemoryDir(): Promise<void> {
  await mkdir(MEMORY_DIR, { recursive: true });
}

async function readAppendOnly<T>(filePath: string, defaultValue: T[]): Promise<T[]> {
  try {
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return defaultValue;
  }
}

async function appendRecord<T>(filePath: string, record: T): Promise<void> {
  await ensureMemoryDir();
  const records = await readAppendOnly<T>(filePath, []);
  records.push(record);
  await writeFile(filePath, JSON.stringify(records, null, 2), 'utf-8');
}

export async function readApprovals(): Promise<ApprovalRecord[]> {
  return readAppendOnly(APPROVALS_FILE, []);
}

export async function readRejections(): Promise<RejectionRecord[]> {
  return readAppendOnly(REJECTIONS_FILE, []);
}

export async function readAntiPatterns(): Promise<AntiPattern[]> {
  return readAppendOnly(ANTIPATTERNS_FILE, []);
}

export async function appendApproval(record: ApprovalRecord): Promise<void> {
  await appendRecord(APPROVALS_FILE, record);
}

export async function appendRejection(record: RejectionRecord): Promise<void> {
  await appendRecord(REJECTIONS_FILE, record);
}

export async function updateAntiPatterns(patterns: AntiPattern[]): Promise<void> {
  await ensureMemoryDir();
  await writeFile(ANTIPATTERNS_FILE, JSON.stringify(patterns, null, 2), 'utf-8');
}
