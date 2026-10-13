import { ContestStatus } from '../models/Contracts';
export function statusColor(status: ContestStatus): string {
  if(status===ContestStatus.Value1)return '#137047';
  if(status===ContestStatus.Value2)return '#B42318';
  if(status===ContestStatus.Value4)return '#6D28D9';
  if(status===ContestStatus.Value5)return '#0E6675';
  if(status===ContestStatus.Value6)return '#475569';
  return '#1D4ED8';
}
