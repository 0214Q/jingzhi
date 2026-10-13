import { requireStudentSession, goToLogin } from '../services/Navigation';
import { router, promptAction } from '@kit.ArkUI';
import { Category, ContestStatus, ContestSummary, MonthMode } from '../models/Contracts';
import { contestRepositoryProvider } from '../services/Repositories';
import { ContestListController, ListQuery, ListState, ListRouteParams, initialListState, defaultListQuery, copyQuery, routeQuery, listTitle, emptyText } from '../services/ContestListService';
import { ContestCard } from '../components/ContestCard';
import { MonthPickerDialog } from '../components/MonthPickerDialog';
interface CategoryChoice { label: string; value: Category | null; }
interface StatusChoice { label: string; value: ContestStatus | null; }
@Entry
@Component
struct ContestList {
  @State state: ListState = initialListState();
  @State searchText: string = '';
  private controller: ContestListController | null = null;
  private monthDialog: CustomDialogController | null = null;
  private categories: CategoryChoice[] = [
    { label: '全部', value: null }, { label: '学科', value: Category.Value0 }, { label: '双创', value: Category.Value1 },
    { label: '文体', value: Category.Value2 }, { label: '技能', value: Category.Value3 }, { label: '综合', value: Category.Value4 }
  ];
  private statuses: StatusChoice[] = [
    { label: '全部状态', value: null }, { label: '未开始/时间待公布', value: ContestStatus.Value0 }, { label: '报名中', value: ContestStatus.Value1 },
    { label: '报名截止', value: ContestStatus.Value2 }, { label: '比赛中', value: ContestStatus.Value3 },
    { label: '评审中', value: ContestStatus.Value4 }, { label: '公示中', value: ContestStatus.Value5 }, { label: '已结束', value: ContestStatus.Value6 }
  ];
  private active: boolean = false;
  private enterId: number = 0;
  aboutToAppear(): void { this.active = true; }
  onPageShow(): void { this.active = true; this.enter(); }
  onPageHide(): void { this.active = false; this.enterId += 1; this.controller?.dispose(); this.monthDialog?.close(); }
  private async enter(): Promise<void> { const id: number = ++this.enterId;
    if (!(await requireStudentSession(() => this.active && id === this.enterId))) return;
    try {
      const params: ListRouteParams = router.getParams() as ListRouteParams;
      const query: ListQuery = this.controller === null ? routeQuery(params || {}) : this.state.query;
      this.searchText = query.keyword;
      this.controller = new ContestListController(contestRepositoryProvider.get(), (next: ListState) => { this.state = next; });
      this.controller.setQuery(query);
    } catch {
      const next: ListState = initialListState(); next.error = '暂时无法读取赛事，请返回首页重试。'; this.state = next;
    }
  }
  aboutToDisappear(): void { this.active = false; this.enterId += 1; this.controller?.dispose(); this.monthDialog?.close(); }
  private apply(query: ListQuery): void { this.controller?.setQuery(query); }
  private clearAll(): void { this.searchText = ''; this.apply(defaultListQuery()); }
  private openMonth(): void {
    this.monthDialog = new CustomDialogController({
      builder: MonthPickerDialog({ initialMonth: this.state.query.month, initialMode: this.state.query.monthMode,
        onConfirm: (month: string, mode: MonthMode) => { const q: ListQuery = copyQuery(this.state.query); q.month = month; q.monthMode = mode; this.apply(q); },
        onClear: () => { const q: ListQuery = copyQuery(this.state.query); q.month = null; this.apply(q); }
      }), autoCancel: true
    });
    this.monthDialog.open();
  }
  build() {
    Column({ space: 12 }) {
      Row({ space: 8 }) {
        Button('返回').fontSize(14).height(44).onClick(() => router.back())
        Text(listTitle(this.state.query)).fontSize(20).fontWeight(FontWeight.Bold).fontColor('#1F2733').layoutWeight(1)
        Button('刷新').fontSize(12).height(44).onClick(() => this.controller?.refresh())
        Button('月份').fontSize(14).height(44).onClick(() => this.openMonth())
      }.width('100%')
      Search({ value: this.searchText, placeholder: '搜索赛事名称或主办方' }).height(48).searchButton('搜索')
        .onChange((value: string) => { this.searchText = value; })
        .onSubmit(() => { const q: ListQuery = copyQuery(this.state.query); q.keyword = this.searchText; this.apply(q); })
      Scroll() {
        Row({ space: 8 }) {
          ForEach(this.categories, (choice: CategoryChoice) => {
            Button(choice.label).fontSize(12).height(44).backgroundColor(this.state.query.category === choice.value ? '#2C7BE5' : '#EEF1F4').fontColor(this.state.query.category === choice.value ? Color.White : '#5A6573')
              .onClick(() => { const q: ListQuery = copyQuery(this.state.query); q.category = choice.value; this.apply(q); })
          }, (choice: CategoryChoice) => choice.label)
        }
      }.scrollable(ScrollDirection.Horizontal).scrollBar(BarState.Off).width('100%')
      Scroll() {
        Row({ space: 8 }) {
          ForEach(this.statuses, (choice: StatusChoice) => {
            Button(choice.label).fontSize(12).height(44).backgroundColor(this.state.query.status === choice.value ? '#2C7BE5' : '#EEF1F4').fontColor(this.state.query.status === choice.value ? Color.White : '#5A6573')
              .onClick(() => { const q: ListQuery = copyQuery(this.state.query); q.status = choice.value; this.apply(q); })
          }, (choice: StatusChoice) => choice.label)
        }
      }.scrollable(ScrollDirection.Horizontal).scrollBar(BarState.Off).width('100%')
      Row({ space: 8 }) {
        Button(this.state.query.sort === 'regEnd' ? '截止时间优先' : '最近更新优先').fontSize(12).height(44)
          .onClick(() => { const q: ListQuery = copyQuery(this.state.query); q.sort = q.sort === 'regEnd' ? '-updatedAt' : 'regEnd'; this.apply(q); })
        if (this.state.query.month !== null) {
          Text(this.state.query.month + (this.state.query.monthMode === MonthMode.Value0 ? ' · 报名期' : ' · 比赛期')).fontSize(12).fontColor('#2C7BE5').layoutWeight(1)
        } else { Blank().layoutWeight(1) }
        Button('清除筛选').fontSize(12).height(44).onClick(() => this.clearAll())
      }.width('100%')
      Text('河南大学参赛目录 · 具体安排以当年官方通知为准').fontSize(12).fontColor('#9B4D09').width('100%')
      if (this.state.loading) {
        Column({ space: 12 }) { LoadingProgress().width(32).height(32); Text('正在查找赛事…').fontSize(14).fontColor('#5A6573') }.layoutWeight(1).width('100%').justifyContent(FlexAlign.Center)
      } else if (this.state.error !== '') {
        Column({ space: 12 }) { Text(this.state.error).fontSize(14).fontColor('#E5484D'); Button('重试').onClick(() => this.controller?.refresh()) }.layoutWeight(1).width('100%').justifyContent(FlexAlign.Center)
      } else if (this.state.items.length === 0) {
        Column({ space: 12 }) { Text(emptyText(this.state.query)).fontSize(14).fontColor('#5A6573'); Button('返回全部').onClick(() => this.clearAll()) }.layoutWeight(1).width('100%').justifyContent(FlexAlign.Center)
      } else {
        Text('共 ' + this.state.total.toString() + ' 场赛事').fontSize(12).fontColor('#5A6573').width('100%')
        List({ space: 12 }) {
          ForEach(this.state.items, (item: ContestSummary) => {
            ListItem() { ContestCard({ item: item, onOpen: (contestId: string) => router.pushUrl({ url: 'pages/ContestDetail', params: { contestId: contestId } }) }) }
          }, (item: ContestSummary) => item.contestId)
          ListItem() {
            Column({ space: 8 }) {
              if (this.state.moreError !== '') { Text(this.state.moreError).fontSize(12).fontColor('#E5484D') }
              if (this.state.hasMore) {
                Button(this.state.loadingMore ? '加载中…' : this.state.moreError !== '' ? '重试加载' : '加载更多').fontSize(14).height(44).enabled(!this.state.loadingMore).onClick(() => this.controller?.loadMore())
              } else { Text('已显示全部赛事').fontSize(12).fontColor('#5A6573') }
            }.width('100%').padding(16)
          }
        }.layoutWeight(1).width('100%').scrollBar(BarState.Off)
      }
      Row() {
        Button('首页').fontSize(14).height(48).layoutWeight(1).onClick(() => router.back())
        Text('赛事').fontSize(14).fontWeight(FontWeight.Bold).fontColor('#2C7BE5').textAlign(TextAlign.Center).height(48).layoutWeight(1)
        Button('消息').fontSize(14).height(48).layoutWeight(1).onClick(() => promptAction.showToast({ message: '消息页暂未开放' }))
        Button('我的').fontSize(14).height(48).layoutWeight(1).onClick(() => router.pushUrl({ url: 'pages/My' }))
      }.width('100%')
    }.padding({ left: 16, right: 16, top: 12 }).width('100%').height('100%').backgroundColor('#F4F6FA')
  }
}
