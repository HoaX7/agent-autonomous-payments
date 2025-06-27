import { createAsync, query } from '@solidjs/router';
import { getActivityLogs, getInventory } from '../api';

const get = query(() => getInventory(), 'inventoryData');
const getLogs = query(() => getActivityLogs(), "activityLogs")

const InventoryData = () => {
  return createAsync(() => get());
};

export const ActivityLogData = () => {
    return createAsync(() => getLogs())
}

export default InventoryData;
export type AboutDataType = typeof InventoryData;
export type ActivityLogType = typeof ActivityLogData;
