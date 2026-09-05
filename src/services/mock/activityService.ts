import { delay } from "@/store/storage";
import * as store from "@/store/crmStore";
import type { ActivityService } from "../interfaces";

export async function getActivities(filters?: Parameters<typeof store.getActivities>[0]) {
  await delay();
  return store.getActivities(filters);
}

export class MockActivityService implements ActivityService {
  getActivities = getActivities;
}
