import { requireStudentSession, goToLogin } from '../services/Navigation';
import { router, promptAction } from '@kit.ArkUI';
import { Category, ContestSummary } from '../models/Contracts';
import { contestRepositoryProvider } from '../services/Repositories';
import { HomeService, HomeData, HomeQuery, demoHomeConfig, deadlineHint, deadlineText } from '../services/HomeService';
import { ContestCard } from '../components/ContestCard';
import { ListRouteParams } from '../services/ContestListService';
interface CategoryEntry { label: string; value: Category; symbol: string; }
@Entry
@Component
struct Index {
  @State keyword: string = '';
  @State appliedKeyword: string = '';
  @State selectedCategory: Category | null = null;
  @State loading: boolean = true;
  @State error: string = '';
  @State urgent: ContestSummary[] = [];
  @State latest: ContestSummary[] = [];
  @State total: number = 0;
  private requestId: number = 0;
  private categories: CategoryEntry[] = [
    { label: '学科竞赛', value: Category.Value0, symbol: '学' },
    { label: '创新创业', value: Category.Value1, symbol: '创' },
    { label: '文体活动', value: Category.Value2, symbol: '艺' },
    { label: '技能竞赛', value: Category.Value3, symbol: '技' }
  ];
  private active: boolean = false;
  private enterId: number = 0;
  aboutToAppear(): void { this.active = true; }
  onPageShow(): void { this.active = true; this.enter(); }
  onPageHide(): void { this.active = false; this.enterId += 1; this.requestId += 1; }
  private async enter(): Promise<void> { const id: number = ++this.enterId; if (await requireStudentSession(() => this.active && id === this.enterId)) this.loadHome(); }
  aboutToDisappear(): void { this.active = false; this.enterId += 1; this.requestId += 1; }
  private async loadHome(): Promise<void> {
    const id = ++this.requestId;
    this.appliedKeyword = this.keyword.trim();
    this.loading = true; this.error = ''; this.urgent = []; this.latest = [];
    try {
      const service: HomeService = new HomeService(contestRepositoryProvider.get(), demoHomeConfig);
      const query: HomeQuery = { keyword: '', category: null };
      const result: HomeData = await service.load(query);
      if (id !== this.requestId) return;
      this.urgent = result.urgent; this.latest = result.latest; this.total = result.total;
    } catch {
      if (id !== this.requestId) return;
      this.error = '暂时无法读取赛事信息，请重试。';
    } finally {
      if (id === this.requestId) this.loading = false;
    }
  }
  private clearFilter(): void { this.keyword = ''; this.selectedCategory = null; this.loadHome(); }
  private openList(params: ListRouteParams = {}): void { router.pushUrl({ url: 'pages/ContestList', params: params }); }
  private unavailable(title: string): void { promptAction.showToast({ message: title + '暂未开放' }); }
  @Builder
  sectionTitle(title: string, note: string) {
    Row() {
      Text(title).fontSize(16).fontWeight(FontWeight.Bold).fontColor('#1F2733').layoutWeight(1)
      Text(note).fontSize(12).fontColor('#5A6573')
    }.width('100%')
  }
  @Builder
  categoryGrid() {
    Row({ space: 8 }) {
      ForEach(this.categories, (entry: CategoryEntry) => {
        Column({ space: 8 }) {
          Text(entry.symbol).fontSize(18).fontWeight(FontWeight.Bold).fontColor('#2C7BE5').width(44).height(44).textAlign(TextAlign.Center).backgroundColor('#EAF2FE').borderRadius(12)
          Text(entry.label).fontSize(12).fontColor(this.selectedCategory === entry.value ? '#2C7BE5' : '#5A6573')
        }.layoutWeight(1).padding({ top: 8, bottom: 8 }).borderRadius(12)
          .backgroundColor(this.selectedCategory === entry.value ? '#EAF2FE' : Color.Transparent)
          .onClick(() => { this.openList({ category: entry.value }); })
      }, (entry: CategoryEntry) => entry.value)
    }.width('100%')
  }
  build() {
    Column() {
      Scroll() {
        Column({ space: 20 }) {
          Column({ space: 12 }) {
            Search({ value: this.keyword, placeholder: '搜索赛事名称或主办方' })
              .searchButton('搜索').height(48).backgroundColor(Color.White)
              .onChange((value: string) => { this.keyword = value; })
              .onSubmit(() => { this.openList({ keyword: this.keyword }); })
            Row() {
              Text(demoHomeConfig.title).fontSize(20).fontWeight(FontWeight.Bold).fontColor('#2C7BE5').layoutWeight(1)
              Text(demoHomeConfig.schoolName).fontSize(12).fontColor('#5A6573')
            }.width('100%')
            Text('河南大学参赛目录 · 具体安排以当年官方通知为准').fontSize(12).fontColor('#9B4D09').width('100%')
          }.width('100%')
          if (this.loading) {
            Column({ space: 12 }) { LoadingProgress().width(32).height(32); Text('正在查找赛事…').fontSize(14).fontColor('#5A6573') }.width('100%').padding(24)
          } else if (this.error !== '') {
            Column({ space: 12 }) { Text(this.error).fontSize(14).fontColor('#E5484D'); Button('重新加载').onClick(() => this.loadHome()) }.width('100%').padding(24).backgroundColor(Color.White).borderRadius(14)
          } else {
            this.sectionTitle('即将截止', '未来 7 天')
            if (this.urgent.length === 0) {
              Text('近期暂无即将截止的赛事').fontSize(14).fontColor('#5A6573').width('100%').padding(16).backgroundColor('#FFF4EA').borderRadius(14)
            } else {
              ForEach(this.urgent, (item: ContestSummary) => {
                Column({ space: 8 }) {
                  Text(deadlineHint(item.regEnd, demoHomeConfig.now)).fontSize(12).fontWeight(FontWeight.Bold).fontColor('#A64B08').width('100%')
                  Text(item.name).fontSize(14).fontWeight(FontWeight.Bold).fontColor('#1F2733').width('100%').maxLines(2)
                  Text('报名截止：' + deadlineText(item.regEnd)).fontSize(14).fontWeight(FontWeight.Bold).fontColor('#A64B08').width('100%')
                }.width('100%').padding(16).backgroundColor('#FFF4EA').borderRadius(14).onClick(() => router.pushUrl({ url: 'pages/ContestDetail', params: { contestId: item.contestId } }))
              }, (item: ContestSummary) => item.contestId)
            }
            this.sectionTitle('赛事分类', '按分类找赛事')
            this.categoryGrid()
            if (this.appliedKeyword !== '' || this.selectedCategory !== null) {
              Row() {
                Text('找到 ' + this.total.toString() + ' 场赛事').fontSize(12).fontColor('#5A6573').layoutWeight(1)
                Button('清除筛选').fontSize(12).height(44).onClick(() => this.clearFilter())
              }.width('100%')
            }
            Row() {
              Text('最新赛事').fontSize(16).fontWeight(FontWeight.Bold).fontColor('#1F2733').layoutWeight(1)
              Button('查看全部').fontSize(12).height(44).onClick(() => this.openList())
            }.width('100%')
            if (this.latest.length === 0) {
              Column({ space: 12 }) {
                Text(this.appliedKeyword !== '' || this.selectedCategory !== null ? '没有找到符合条件的赛事' : '暂无公开赛事').fontSize(14).fontColor('#5A6573')
                Button('查看全部').onClick(() => this.openList())
              }.width('100%').padding(24).backgroundColor(Color.White).borderRadius(14)
            } else {
              ForEach(this.latest, (item: ContestSummary) => {
                ContestCard({ item: item, onOpen: (contestId: string) => router.pushUrl({ url: 'pages/ContestDetail', params: { contestId: contestId } }) })
              }, (item: ContestSummary) => item.contestId)
            }
            this.sectionTitle('重要公告', '平台说明')
            Column({ space: 8 }) {
              Text('信息由竞知项目团队整理').fontSize(14).fontWeight(FontWeight.Bold).fontColor('#1F2733').width('100%')
              Text('平台尚未取得学校官方授权；平台审核仅表示信息核对，不代表学校官方认证。').fontSize(12).fontColor('#5A6573').width('100%')
              Text('报名方式以原通知为准，平台不提供站内报名。').fontSize(12).fontColor('#5A6573').width('100%')
            }.padding(16).width('100%').backgroundColor(Color.White).borderRadius(14)
            Button('刷新赛事').fontSize(14).height(44).onClick(() => this.loadHome())
          }
        }.width('100%').padding(16)
      }.layoutWeight(1).width('100%').scrollBar(BarState.Off)
      Row() {
        ForEach(['首页', '赛事', '消息', '我的'], (label: string) => {
          Text(label).fontSize(14).fontWeight(label === '首页' ? FontWeight.Bold : FontWeight.Normal)
            .fontColor(label === '首页' || label === '赛事' ? '#2C7BE5' : '#9AA5B1').textAlign(TextAlign.Center).height(56).layoutWeight(1)
            .onClick(() => { if (label === '首页') this.clearFilter(); else if (label === '赛事') this.openList(); else if (label === '我的') router.pushUrl({ url: 'pages/My' }); else this.unavailable(label + '页'); })
        }, (label: string) => label)
      }.width('100%').backgroundColor(Color.White).border({ width: { top: 1 }, color: '#ECEFF3' })
    }.width('100%').height('100%').backgroundColor('#F4F6FA')
  }
}
