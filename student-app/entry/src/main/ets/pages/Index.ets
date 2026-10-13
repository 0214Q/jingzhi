import { SearchField } from '../components/SearchField';
import { StudentBottomNav } from '../components/StudentBottomNav';
import { studentSchoolProvider, studentCatalogNotice } from '../services/StudentSchoolService';
import { requireStudentSchool, goToLogin } from '../services/Navigation';
import { router, promptAction } from '@kit.ArkUI';
import { Category, ContestSummary } from '../models/Contracts';
import { contestRepositoryProvider } from '../services/Repositories';
import { HomeService, HomeData, HomeQuery, HomeConfig, deadlineHint, deadlineText } from '../services/HomeService';
import { ContestCard } from '../components/ContestCard';
import { ListRouteParams } from '../services/ContestListService';
interface CategoryEntry { label: string; value: Category; symbol: string; }
@Entry
@Component
struct Index {
  @State schoolName: string = '';
  @State now: string = new Date().toISOString();
  @State keyword: string = '';
  @State appliedKeyword: string = '';
  @State selectedCategory: Category | null = null;
  @State loading: boolean = true;
  @State error: string = '';
  @State urgent: ContestSummary[] = [];
  @State latest: ContestSummary[] = [];
  @State total: number = 0;
  private requestId: number = 0;
  private scopeKey: string = '';
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
  private async enter(): Promise<void> { const id: number = ++this.enterId; this.requestId += 1; this.urgent = []; this.latest = []; this.total = 0; this.loading = true; this.error = ''; if (await requireStudentSchool(() => this.active && id === this.enterId)) { const key: string = studentSchoolProvider.get().scopeKey(); if (this.scopeKey !== key) { this.keyword = ''; this.appliedKeyword = ''; this.selectedCategory = null; } this.scopeKey = key; this.schoolName = studentSchoolProvider.get().snapshot()?.selectedSchool?.name || ''; this.loadHome(); } }
  aboutToDisappear(): void { this.active = false; this.enterId += 1; this.requestId += 1; }
  private async loadHome(): Promise<void> {
    const id = ++this.requestId;
    this.appliedKeyword = this.keyword.trim();
    this.loading = true; this.error = ''; this.urgent = []; this.latest = []; this.total = 0;
    try {
      this.now = new Date().toISOString();
      const config: HomeConfig = { title: '竞知', schoolName: this.schoolName, primaryColor: '#1D4ED8', demo: false, datedOnly: true, now: this.now };
      const service: HomeService = new HomeService(contestRepositoryProvider.get(), config);
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
      Text(title).fontSize(16).fontWeight(FontWeight.Bold).fontColor('#172B46').layoutWeight(1)
      Text(note).fontSize(12).fontColor('#475569')
    }.width('100%')
  }
  @Builder
  categoryGrid() {
    Row({ space: 8 }) {
      ForEach(this.categories, (entry: CategoryEntry) => {
        Column({ space: 8 }) {
          Text(entry.symbol).fontSize(18).fontWeight(FontWeight.Bold).fontColor('#1D4ED8').width(44).height(44).textAlign(TextAlign.Center).backgroundColor('#EAF2FE').borderRadius(12)
          Text(entry.label).fontSize(12).fontColor(this.selectedCategory === entry.value ? '#1D4ED8' : '#475569')
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
            SearchField({ value: this.keyword, busy: this.loading, onChange: (value: string) => { this.keyword = value; }, onSearch: () => this.openList({ keyword: this.keyword }) })
            Row() {
              Text('竞知').fontSize(20).fontWeight(FontWeight.Bold).fontColor('#1D4ED8').layoutWeight(1)
              Button((this.schoolName || '选择高校') + ' · 切换', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).fontSize(12).height(40).backgroundColor('#EAF2FE').fontColor('#1D4ED8').onClick(() => router.pushUrl({ url: 'pages/SchoolSelection' }))
            }.width('100%')
            Text(studentCatalogNotice(this.schoolName)).fontSize(12).fontColor('#9B4D09').width('100%')
          }.width('100%')
          if (this.loading) {
            Column({ space: 12 }) { LoadingProgress().width(32).height(32); Text('正在查找赛事…').fontSize(14).fontColor('#475569') }.width('100%').padding(24)
          } else if (this.error !== '') {
            Column({ space: 12 }) { Text(this.error).fontSize(14).fontColor('#B42318'); Button('重新加载', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).onClick(() => this.loadHome()) }.width('100%').padding(24).backgroundColor(Color.White).borderRadius(14)
          } else {
            this.sectionTitle('即将截止', '未来 7 天')
            if (this.urgent.length === 0) {
              Text('近期暂无即将截止的赛事').fontSize(14).fontColor('#475569').width('100%').padding(16).backgroundColor('#FFF4EA').borderRadius(14)
            } else {
              ForEach(this.urgent, (item: ContestSummary) => {
                Column({ space: 8 }) {
                  Text(deadlineHint(item.regEnd, this.now)).fontSize(12).fontWeight(FontWeight.Bold).fontColor('#A64B08').width('100%')
                  Text(item.name).fontSize(14).fontWeight(FontWeight.Bold).fontColor('#172B46').width('100%').maxLines(2)
                  Text('报名截止：' + deadlineText(item.regEnd)).fontSize(14).fontWeight(FontWeight.Bold).fontColor('#A64B08').width('100%')
                }.width('100%').padding(16).backgroundColor('#FFF4EA').borderRadius(14).onClick(() => router.pushUrl({ url: 'pages/ContestDetail', params: { contestId: item.contestId } }))
              }, (item: ContestSummary) => item.contestId)
            }
            this.sectionTitle('赛事分类', '按分类找赛事')
            this.categoryGrid()
            if (this.appliedKeyword !== '' || this.selectedCategory !== null) {
              Row() {
                Text('找到 ' + this.total.toString() + ' 场赛事').fontSize(12).fontColor('#475569').layoutWeight(1)
                Button('清除筛选', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).fontSize(12).height(44).onClick(() => this.clearFilter())
              }.width('100%')
            }
            Row() {
              Text('最新赛事').fontSize(16).fontWeight(FontWeight.Bold).fontColor('#172B46').layoutWeight(1)
              Button('查看全部', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).fontSize(12).height(44).onClick(() => this.openList())
            }.width('100%')
            if (this.latest.length === 0) {
              Column({ space: 12 }) {
                Text(this.appliedKeyword !== '' || this.selectedCategory !== null ? '没有找到符合条件的赛事' : '暂无公开赛事').fontSize(14).fontColor('#475569')
                Button('查看全部', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).onClick(() => this.openList())
              }.width('100%').padding(24).backgroundColor(Color.White).borderRadius(14)
            } else {
              ForEach(this.latest, (item: ContestSummary) => {
                ContestCard({ item: item, onOpen: (contestId: string) => router.pushUrl({ url: 'pages/ContestDetail', params: { contestId: contestId } }) })
              }, (item: ContestSummary) => item.contestId)
            }
            this.sectionTitle('重要公告', '平台说明')
            Column({ space: 8 }) {
              Text('信息由竞知项目团队整理').fontSize(14).fontWeight(FontWeight.Bold).fontColor('#172B46').width('100%')
              Text('平台尚未取得学校官方授权；平台审核仅表示信息核对，不代表学校官方认证。').fontSize(12).fontColor('#475569').width('100%')
              Text('报名方式以原通知为准，平台不提供站内报名。').fontSize(12).fontColor('#475569').width('100%')
            }.padding(16).width('100%').backgroundColor(Color.White).borderRadius(14)
            Button('刷新赛事', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).fontSize(14).height(44).onClick(() => this.loadHome())
          }
        }.width('100%').padding(16)
      }.layoutWeight(1).width('100%').scrollBar(BarState.Off)
      StudentBottomNav({ selected: '首页' }).backgroundColor(Color.White).border({ width: { top: 1 }, color: '#ECEFF3' })
    }.width('100%').height('100%').backgroundColor('#F3F6FC')
  }
}
