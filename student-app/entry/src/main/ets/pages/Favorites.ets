import { studentSchoolProvider } from '../services/StudentSchoolService';
import { router } from '@kit.ArkUI';
import { requireStudentSchool } from '../services/Navigation';
import { interactionProvider } from '../services/InteractionProvider';
import { FavoriteView } from '../services/InteractionService';
@Entry
@Component
struct Favorites {
 @State schoolName: string = '';
 private scopeKey: string = '';
 @State rows: FavoriteView[] = [];
 @State page: number = 1;
 @State total: number = 0;
 @State busy: boolean = false;
 @State error: string = '';
 private active: boolean = false;
 private requestId: number = 0;
 aboutToAppear(): void { this.active = true; }
 onPageShow(): void { this.active = true; this.load(1); }
 onPageHide(): void { this.active = false; this.requestId += 1; this.busy = false; }
 aboutToDisappear(): void { this.active = false; this.requestId += 1; }
 private async load(page: number): Promise<void> {
  if (this.busy) return; const id: number = ++this.requestId; this.busy = true; this.error = ''; this.rows = []; this.total = 0;
  try { if (!(await requireStudentSchool(() => this.active && id === this.requestId))) return; const key: string = studentSchoolProvider.get().scopeKey(); const nextPage: number = key !== this.scopeKey ? 1 : page; this.scopeKey = key; this.schoolName = studentSchoolProvider.get().snapshot()?.selectedSchool?.name || ''; const result = await interactionProvider.getService().list(nextPage); if (this.active && id === this.requestId) { this.rows = result.list; this.total = result.total; this.page = nextPage; } }
  catch { if (this.active && id === this.requestId) this.error = '收藏加载失败，请重试'; }
  finally { if (this.active && id === this.requestId) this.busy = false; }
 }
 private async remove(contestId: string): Promise<void> {
  if (this.busy) return; const id: number = ++this.requestId; this.busy = true;
  try { await interactionProvider.getFavorites().remove(contestId); if (this.active && id === this.requestId) { this.busy = false; await this.load(this.rows.length === 1 && this.page > 1 ? this.page - 1 : this.page); } }
  catch { if (this.active && id === this.requestId) this.error = '取消收藏失败，请重试'; }
  finally { if (this.active && id === this.requestId) this.busy = false; }
 }
 build() {
  Column({ space: 12 }) {
   Row() { Button('返回', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).onClick(() => router.back()); Text('我的收藏').fontColor('#172B46').fontSize(22).fontWeight(FontWeight.Bold) }.width('100%')
   Text('当前高校：' + this.schoolName + ' · 其他高校收藏在切回后显示').fontSize(12).fontColor('#475569').width('100%')
   if (this.error !== '') { Text(this.error).fontColor('#B42318'); Button('重试', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).enabled(!this.busy).onClick(() => this.load(this.page)) }
   if (this.busy) { Text('加载中…').fontColor('#172B46') }
   if (!this.busy && this.error === '' && this.total === 0) { Text('暂无收藏，前往赛事详情添加。').fontColor('#172B46') }
   Scroll() { Column({ space: 12 }) {
    ForEach(this.rows, (row: FavoriteView) => {
     Column({ space: 8 }) {
      Text(row.name).fontColor('#172B46').fontSize(17).fontWeight(FontWeight.Bold).width('100%')
      Text(row.favorite.available ? '已收藏' : '赛事已下架或不可访问，仍可取消收藏').fontColor('#172B46').fontSize(12)
      Row({ space: 12 }) {
       Button('查看详情', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).enabled(row.favorite.available && !this.busy).onClick(() => router.pushUrl({ url: 'pages/ContestDetail', params: { contestId: row.favorite.contestId } }))
       Button('取消收藏', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).enabled(!this.busy).onClick(() => this.remove(row.favorite.contestId))
      }
     }.width('100%').padding(16).backgroundColor(Color.White).borderRadius(14)
    }, (row: FavoriteView) => row.favorite.contestId)
   }.width('100%') }.layoutWeight(1)
   Row({ space: 12 }) { Button('上一页', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).enabled(!this.busy && this.page > 1).onClick(() => this.load(this.page - 1)); Text(this.page.toString() + '页 / 共' + this.total.toString() + '条').fontColor('#172B46'); Button('下一页', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).enabled(!this.busy && this.page * 20 < this.total).onClick(() => this.load(this.page + 1)) }
  }.padding(16).width('100%').height('100%').backgroundColor('#F3F6FC')
 }
}
