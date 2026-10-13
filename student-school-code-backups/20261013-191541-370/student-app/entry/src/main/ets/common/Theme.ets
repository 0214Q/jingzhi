import { ContestStatus } from '../models/Contracts';
export function statusColor(status: ContestStatus): string {
  if(status===ContestStatus.Value1)return '#1FAA59';
  if(status===ContestStatus.Value2)return '#E5484D';
  if(status===ContestStatus.Value4)return '#7C5CFC';
  if(status===ContestStatus.Value5)return '#18B7C2';
  if(status===ContestStatus.Value6)return '#5C6670';
  return '#2C7BE5';
}
