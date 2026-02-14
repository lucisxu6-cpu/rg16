import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

type IsoDateTime = string;

export type StoredAssessment = {
  id: string;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  version: string;
  mode: string;
  durationMs?: number;
  answersJson?: unknown;
  scoresJson: unknown;
  mbtiJson: unknown;
  qualityJson: unknown;
};

export type StoredOrder = {
  stripeCheckoutSessionId: string;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  assessmentId: string;
  sku: string;
  status: string;
  amount: number;
  currency: string;
  rawJson?: unknown;
};

export type StoredEntitlement = {
  assessmentId: string;
  module: string;
  sku: string;
  status: "active" | "revoked";
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

type StoreData = {
  assessments: Record<string, StoredAssessment>;
  orders: Record<string, StoredOrder>; // key: stripeCheckoutSessionId
  entitlements: Record<string, Record<string, StoredEntitlement>>; // assessmentId -> module -> entitlement
};

const DEFAULT_PATH = path.join(process.cwd(), ".data", "rg16-store.json");

function storePath() {
  return process.env.RG16_STORE_PATH || DEFAULT_PATH;
}

function nowIso(): IsoDateTime {
  return new Date().toISOString();
}

let chain: Promise<unknown> = Promise.resolve();

function queued<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  // Keep chain alive regardless of success/failure to avoid deadlocks.
  chain = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

async function ensureDir(p: string) {
  await fs.mkdir(path.dirname(p), { recursive: true });
}

async function load(): Promise<StoreData> {
  const p = storePath();
  try {
    const raw = await fs.readFile(p, "utf8");
    const parsed = JSON.parse(raw) as StoreData;
    return {
      assessments: parsed.assessments ?? {},
      orders: parsed.orders ?? {},
      entitlements: parsed.entitlements ?? {},
    };
  } catch {
    return { assessments: {}, orders: {}, entitlements: {} };
  }
}

async function save(data: StoreData) {
  const p = storePath();
  await ensureDir(p);
  const tmp = `${p}.${randomUUID()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, p);
}

export async function createAssessment(args: Omit<StoredAssessment, "id" | "createdAt" | "updatedAt">) {
  return queued(async () => {
    const data = await load();
    const id = randomUUID();
    const t = nowIso();
    const row: StoredAssessment = { id, createdAt: t, updatedAt: t, ...args };
    data.assessments[id] = row;
    await save(data);
    return row;
  });
}

export async function getAssessment(id: string): Promise<StoredAssessment | null> {
  const data = await load();
  return data.assessments[id] ?? null;
}

export async function getActiveModules(assessmentId: string): Promise<Set<string>> {
  const data = await load();
  const mods = new Set<string>();
  const byModule = data.entitlements[assessmentId] ?? {};
  for (const [module, ent] of Object.entries(byModule)) {
    if (ent.status === "active") mods.add(module);
  }
  return mods;
}

export async function grantModules(args: { assessmentId: string; sku: string; modules: string[] }) {
  return queued(async () => {
    const data = await load();
    const t = nowIso();
    data.entitlements[args.assessmentId] ||= {};
    for (const moduleId of args.modules) {
      const prev = data.entitlements[args.assessmentId][moduleId];
      data.entitlements[args.assessmentId][moduleId] = {
        assessmentId: args.assessmentId,
        module: moduleId,
        sku: args.sku,
        status: "active",
        createdAt: prev?.createdAt ?? t,
        updatedAt: t,
      };
    }
    await save(data);
    return args.modules;
  });
}

export async function upsertOrder(args: StoredOrder) {
  return queued(async () => {
    const data = await load();
    const prev = data.orders[args.stripeCheckoutSessionId];
    data.orders[args.stripeCheckoutSessionId] = {
      ...args,
      createdAt: prev?.createdAt ?? args.createdAt,
      updatedAt: args.updatedAt,
    };
    await save(data);
    return data.orders[args.stripeCheckoutSessionId];
  });
}
