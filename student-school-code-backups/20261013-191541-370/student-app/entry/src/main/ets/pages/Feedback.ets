import { router } from '@kit.ArkUI';
import { Feedback as FeedbackItem } from '../models/Contracts';
import { requireStudentSession } from '../services/Navigation';
import { interactionProvider } from '../services/InteractionProvider';
interface FeedbackRoute { contestId?: string; }
@Entry
@Component
struct Feedback {
 @State contestId: string | null = null;
 @State type: string = '信息纠错';
 @State desc: string = '';
 @State rows: FeedbackItem[] = [];
 @State busy: boolean = false;
 @State loading: boolean = false;
 @State error: string = '';
 @State message: string = '';
 @State page: number = 1;
 @State total: number = 0;
 private active: boolean = false;
 private loadId: number = 0;
 private submitId: number = 0;
 aboutToAppear(): void { this.active = true; const params: FeedbackRoute = router.getParams() as FeedbackRoute; this.contestId = params?.contestId || null; }
 onPageShow(): void { this.active = true; this.load(1); }
 onPageHide(): void { this.active = false; this.loadId += 1; this.submitId += 1; this.loading = false; this.busy = false; }
 aboutToDisappear(): void { this.active = false; this.loadId += 1; this.submitId += 1; }
 private async load(page: number): Promise<void> {
  if (this.loading) return; const id: number = ++this.loadId; this.loading = true;
  try { if (!(await requireStudentSession(() => this.active && id === this.loadId))) return; const result = await interactionProvider.getFeedback().listMine({ page: page, pageSize: 20 }); if (this.active && id === this.loadId) { this.rows = result.list; this.page = page; this.total = result.total; this.error = ''; } }
  catch { if (this.active && id === this.loadId) this.error = '处理记录加载失败，请重试'; }
  finally { if (this.active && id === this.loadId) this.loading = false; }
 }
 private async submit(): Promise<void> {
  if (this.busy || !this.desc.trim()) return; const id: number = ++this.submitId; this.busy = true; this.error = ''; this.message = '';
  try { if (!(await requireStudentSession(() => this.active && id === this.submitId))) return; await interactionProvider.getFeedback().create({ contestId: this.contestId, type: this.type, desc: this.desc }); if (this.active && id === this.submitId) { this.desc = ''; this.message = '反馈已提交，可在下方查看处理结果'; this.load(1); } }
  catch { if (this.active && id === this.submitId) this.error = '提交失败，请检查内容并重试'; }
  finally { if (this.active && id === this.submitId) this.busy = false; }
 }
 build() {
  Column({ space: 12 }) {
   Row() { Button('返回').onClick(() => router.back()); Text('反馈与处理记录').fontSize(20).fontWeight(FontWeight.Bold) }
   Scroll() { Column({ space: 12 }) {
    Text(this.contestId === null ? '平台建议' : '赛事纠错：' + this.contestId).width('100%')
    Select([{ value: '信息纠错' }, { value: '内容补充' }, { value: '功能建议' }]).selected(0).value(this.type).enabled(!this.busy).onSelect((index: number, value: string) => { this.type = value; })
    TextArea({ text: this.desc, placeholder: '请说明问题及依据，最多2000字；勿填写敏感个人信息' }).maxLength(2000).height(120).enabled(!this.busy).onChange((value: string) => { this.desc = value; })
    Button(this.busy ? '提交中…' : '提交反馈').enabled(!this.busy && !this.loading && this.desc.trim().length > 0).onClick(() => this.submit())
    if (this.message !== '') { Text(this.message).fontColor('#208052') }
    if (this.error !== '') { Text(this.error).fontColor('#E5484D') }
    Text('我的反馈（' + this.total.toString() + '）').fontSize(18).fontWeight(FontWeight.Bold)
    if (this.loading) { Text('正在读取…') }
    if (!this.loading && this.error === '' && this.total === 0) { Text('暂无反馈记录') }
    ForEach(this.rows, (item: FeedbackItem) => {
     Column({ space: 8 }) { Text(item.type + ' · ' + item.status).fontWeight(FontWeight.Bold); Text(item.desc); Text('关联赛事：' + (item.contestId || '平台')); Text('处理说明：' + (item.note || '尚未处理')); Text(item.time).fontSize(12) }.width('100%').padding(16).backgroundColor(Color.White).borderRadius(14)
    }, (item: FeedbackItem) => item.id)
    Row({ space: 8 }) { Button('上一页').enabled(!this.loading && this.page > 1).onClick(() => this.load(this.page - 1)); Button('刷新记录').enabled(!this.loading).onClick(() => this.load(this.page)); Button('下一页').enabled(!this.loading && this.page * 20 < this.total).onClick(() => this.load(this.page + 1)) }
   }.width('100%') }.layoutWeight(1)
  }.padding(16).width('100%').height('100%').backgroundColor('#F4F6FA')
 }
}
