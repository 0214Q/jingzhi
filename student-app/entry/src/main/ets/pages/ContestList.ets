import { SearchField } from '../components/SearchField';
import { StudentBottomNav } from '../components/StudentBottomNav';
import { studentSchoolProvider, studentCatalogNotice } from '../services/StudentSchoolService';
import { requireStudentSchool, goToLogin } from '../services/Navigation';
import { router, promptAction } from '@kit.ArkUI';
import { Category, ContestStatus, ContestSummary, MonthMode } from '../models/Contracts';
import { contestRepositoryProvider } from '../services/Repositories';
import { ContestListController, ListQuery, ListState, ListRouteParams, initialListState, defaultListQuery, copyQuery, routeQuery, listTitle, emptyText, visiblePageNumbers } from '../services/ContestListService';
import { ContestCard } from '../components/ContestCard';
import { MonthPickerDialog } from '../components/MonthPickerDialog';
interface CategoryChoice { label: string; value: Category | null; }
interface StatusChoice { label: string; value: ContestStatus | null; }
@Entry
@Component
struct ContestList {
  @State filtersExpanded: boolean = false;
  @State schoolName: string = '';
  private scopeKey: string = '';
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
    const previousQuery: ListQuery = this.state.query; const previousPage: number = Math.max(1, this.state.page); const first: boolean = this.controller === null;
    this.controller?.dispose(); const blank: ListState = initialListState(); blank.loading = true; this.state = blank;
    if (!(await requireStudentSchool(() => this.active && id === this.enterId))) return;
    try {
      const params: ListRouteParams = router.getParams() as ListRouteParams;
      const key: string = studentSchoolProvider.get().scopeKey();
      const query: ListQuery = first ? routeQuery(params || {}) : key === this.scopeKey ? previousQuery : defaultListQuery();
      const sameScope: boolean = key === this.scopeKey;
      this.scopeKey = key; this.schoolName = studentSchoolProvider.get().snapshot()?.selectedSchool?.name || '';
      if (first || !sameScope) query.datedOnly = true;
      this.searchText = query.keyword;
      this.controller = new ContestListController(contestRepositoryProvider.get(), (next: ListState) => { if (this.active && id === this.enterId) this.state = next; });
      this.controller.setQuery(query, !first && sameScope ? previousPage : 1);
    } catch {
      const next: ListState = initialListState(); next.error = '暂时无法读取赛事，请返回首页重试。'; this.state = next;
    }
  }
  aboutToDisappear(): void { this.active = false; this.enterId += 1; this.controller?.dispose(); this.monthDialog?.close(); }
  private apply(query: ListQuery): void { if (!this.state.loading) this.controller?.setQuery(query); }
  private clearAll(): void { this.searchText = ''; this.apply(defaultListQuery()); }
  private openMonth(): void {
    if (this.state.loading) return;
    this.monthDialog = new CustomDialogController({
      builder: MonthPickerDialog({ initialMonth: this.state.query.month, initialMode: this.state.query.monthMode,
        onConfirm: (month: string, mode: MonthMode) => { const q: ListQuery = copyQuery(this.state.query); q.month = month; q.monthMode = mode; this.apply(q); },
        onClear: () => { const q: ListQuery = copyQuery(this.state.query); q.month = null; this.apply(q); }
      }), autoCancel: true
    });
    this.monthDialog.open();
  }
  private search(): void { const q: ListQuery = copyQuery(this.state.query); q.keyword = this.searchText; this.apply(q); }
  build() {
    Column({ space: 12 }) {
      Row({ space: 12 }) {
        Button({ type: ButtonType.Normal }) { Image($r('app.media.jingzhi_back')).width(20).height(20) }
          .width(40).height(40).backgroundColor(Color.White).borderRadius(12).border({ width: 1, color: '#D8E2EF' }).onClick(() => router.back())
        Column({ space: 3 }) {
          Text(listTitle(this.state.query)).fontSize(22).fontWeight(FontWeight.Bold).fontColor('#172B46').width('100%')
          Text(this.schoolName || '正在读取高校').fontSize(12).fontColor('#475569').width('100%')
        }.layoutWeight(1)
        Button({ type: ButtonType.Normal }) { Image($r('app.media.jingzhi_refresh')).width(20).height(20) }
          .width(40).height(40).backgroundColor(Color.White).borderRadius(12).border({ width: 1, color: '#D8E2EF' })
          .enabled(!this.state.loading).onClick(() => this.enter())
      }.width('100%')
      Row({ space: 8 }) {
        Button('明确日程', { type: ButtonType.Normal }).height(36).fontSize(13).borderRadius(10)
          .backgroundColor(this.state.query.datedOnly ? '#1D4ED8' : '#EAF1FF').fontColor(this.state.query.datedOnly ? Color.White : '#1D4ED8')
          .enabled(!this.state.loading).onClick(() => { const q: ListQuery = copyQuery(this.state.query); q.datedOnly = true; this.apply(q); })
        Button('全部参赛目录', { type: ButtonType.Normal }).height(36).fontSize(13).borderRadius(10)
          .backgroundColor(this.state.query.datedOnly ? '#EAF1FF' : '#1D4ED8').fontColor(this.state.query.datedOnly ? '#1D4ED8' : Color.White)
          .enabled(!this.state.loading).onClick(() => { const q: ListQuery = copyQuery(this.state.query); q.datedOnly = false; this.apply(q); })
      }.width('100%')
      Text(this.state.query.datedOnly ? '已公布至少一个具体日期；未公布阶段仍会标明。' : '包含年度安排尚未公布的长期参赛目录。').fontSize(11).fontColor('#475569').width('100%')
      SearchField({ value: this.searchText, busy: this.state.loading, onChange: (value: string) => { this.searchText = value; }, onSearch: () => this.search() })
      Column({ space: 10 }) {
        Row() {
          Text('赛事分类').fontSize(13).fontWeight(FontWeight.Medium).fontColor('#334155').layoutWeight(1)
          Button(this.state.query.status === null ? (this.filtersExpanded ? '收起筛选' : '更多筛选') : this.state.query.status + ' · 筛选', { type: ButtonType.Normal })
            .fontSize(12).fontColor('#1D4ED8').backgroundColor('#EFF4FF').height(32).borderRadius(8).padding({ left: 10, right: 10 })
            .enabled(!this.state.loading).onClick(() => { this.filtersExpanded = !this.filtersExpanded; })
        }.width('100%')
        Scroll() {
          Row({ space: 6 }) {
            ForEach(this.categories, (choice: CategoryChoice) => {
              Button(choice.label, { type: ButtonType.Normal }).fontSize(13).fontWeight(FontWeight.Medium).height(34).borderRadius(10)
                .padding({ left: 12, right: 12 }).backgroundColor(this.state.query.category === choice.value ? '#EAF1FF' : '#F8FAFC')
                .fontColor(this.state.query.category === choice.value ? '#1D4ED8' : '#334155')
                .border({ width: 1, color: this.state.query.category === choice.value ? '#A5BDEE' : '#E2E8F0' }).enabled(!this.state.loading)
                .onClick(() => { const q: ListQuery = copyQuery(this.state.query); q.category = choice.value; this.apply(q); })
            }, (choice: CategoryChoice) => choice.label)
          }
        }.scrollable(ScrollDirection.Horizontal).scrollBar(BarState.Off).width('100%')
        if (this.filtersExpanded) {
          Text('赛事状态').fontSize(12).fontColor('#475569').width('100%')
          Scroll() {
            Row({ space: 6 }) {
              ForEach(this.statuses, (choice: StatusChoice) => {
                Button(choice.label, { type: ButtonType.Normal }).fontSize(12).height(34).borderRadius(10).padding({ left: 12, right: 12 })
                  .backgroundColor(this.state.query.status === choice.value ? '#EAF1FF' : '#F8FAFC').fontColor(this.state.query.status === choice.value ? '#1D4ED8' : '#334155')
                  .border({ width: 1, color: this.state.query.status === choice.value ? '#A5BDEE' : '#E2E8F0' }).enabled(!this.state.loading)
                  .onClick(() => { const q: ListQuery = copyQuery(this.state.query); q.status = choice.value; this.filtersExpanded = false; this.apply(q); })
              }, (choice: StatusChoice) => choice.label)
            }
          }.scrollable(ScrollDirection.Horizontal).scrollBar(BarState.Off).width('100%')
        }
        Row({ space: 8 }) {
          Button(this.state.query.sort === 'regEnd' ? '截止优先' : '最近更新', { type: ButtonType.Normal }).fontSize(12).fontColor('#334155')
            .backgroundColor('#F1F5F9').height(34).borderRadius(9).layoutWeight(1).enabled(!this.state.loading)
            .onClick(() => { const q: ListQuery = copyQuery(this.state.query); q.sort = q.sort === 'regEnd' ? '-updatedAt' : 'regEnd'; this.apply(q); })
          Button({ type: ButtonType.Normal }) {
            Row({ space: 5 }) { Image($r('app.media.jingzhi_calendar')).width(16).height(16); Text(this.state.query.month || '选择月份').fontSize(12).fontColor('#334155') }
          }.backgroundColor('#F1F5F9').height(34).borderRadius(9).layoutWeight(1).enabled(!this.state.loading).onClick(() => this.openMonth())
          Button('重置', { type: ButtonType.Normal }).fontSize(12).fontColor('#475569').backgroundColor(Color.Transparent).height(34)
            .borderRadius(9).padding({ left: 10, right: 10 }).enabled(!this.state.loading).onClick(() => this.clearAll())
        }.width('100%')
      }.width('100%').padding(12).backgroundColor(Color.White).borderRadius(16).border({ width: 1, color: '#E2E8F0' })
      Text(studentCatalogNotice(this.schoolName)).fontSize(11).lineHeight(16).fontColor('#475569').width('100%')
      if (this.state.loading) {
        Column({ space: 12 }) { LoadingProgress().width(32).height(32); Text('正在查找赛事…').fontSize(14).fontColor('#475569') }.layoutWeight(1).width('100%').justifyContent(FlexAlign.Center)
      } else if (this.state.error !== '') {
        Column({ space: 12 }) { Text(this.state.error).fontSize(14).fontColor('#B42318'); Button('重新读取', { type: ButtonType.Normal }).height(40).fontSize(14).fontColor('#1D4ED8').backgroundColor('#EAF1FF').borderRadius(11).onClick(() => this.enter()) }.layoutWeight(1).width('100%').justifyContent(FlexAlign.Center)
      } else if (this.state.items.length === 0) {
        Column({ space: 12 }) { Text(emptyText(this.state.query)).fontSize(14).fontColor('#475569'); Button('查看全部赛事', { type: ButtonType.Normal }).height(40).fontSize(14).fontColor('#1D4ED8').backgroundColor('#EAF1FF').borderRadius(11).onClick(() => this.clearAll()) }.layoutWeight(1).width('100%').justifyContent(FlexAlign.Center)
      } else {
        Row() { Text('赛事目录').fontSize(15).fontWeight(FontWeight.Bold).fontColor('#172B46').layoutWeight(1); Text('共 ' + this.state.total.toString() + ' 项').fontSize(12).fontColor('#475569') }.width('100%')
        List({ space: 12 }) {
          ForEach(this.state.items, (item: ContestSummary) => {
            ListItem() { ContestCard({ item: item, onOpen: (contestId: string) => router.pushUrl({ url: 'pages/ContestDetail', params: { contestId: contestId } }) }) }
          }, (item: ContestSummary) => item.contestId)
        }.layoutWeight(1).width('100%').scrollBar(BarState.Off)
      }
      if (this.state.page > 0 && this.state.totalPages > 0) {
        Column({ space: 8 }) {
          if (this.state.moreError !== '') { Text(this.state.moreError).fontSize(12).fontColor('#B42318').width('100%') }
          Row({ space: 8 }) {
            Button('上一页', { type: ButtonType.Normal }).fontSize(13).fontColor('#334155').backgroundColor(Color.White).height(36).borderRadius(9)
              .border({ width: 1, color: '#CBD5E1' }).enabled(!this.state.loading && this.state.page > 1).onClick(() => this.controller?.previousPage())
            Text('第 ' + this.state.page.toString() + ' / ' + this.state.totalPages.toString() + ' 页').fontSize(12).fontColor('#475569').layoutWeight(1).textAlign(TextAlign.Center)
            Button('下一页', { type: ButtonType.Normal }).fontSize(13).fontColor('#334155').backgroundColor(Color.White).height(36).borderRadius(9)
              .border({ width: 1, color: '#CBD5E1' }).enabled(!this.state.loading && this.state.page < this.state.totalPages).onClick(() => this.controller?.nextPage())
          }.width('100%')
          Row({ space: 6 }) {
            ForEach(visiblePageNumbers(this.state.page, this.state.totalPages), (page: number) => {
              Button(page.toString(), { type: ButtonType.Normal }).fontSize(13).width(34).height(32).borderRadius(8).padding({ left: 0, right: 0 })
                .backgroundColor(page === this.state.page ? '#1D4ED8' : '#F1F5F9').fontColor(page === this.state.page ? Color.White : '#334155')
                .enabled(!this.state.loading).onClick(() => this.controller?.goToPage(page))
            }, (page: number) => page.toString())
          }.width('100%').justifyContent(FlexAlign.Center)
        }.width('100%').padding(10).backgroundColor(Color.White).borderRadius(14)
      }
      StudentBottomNav({ selected: '赛事' })
    }.padding({ left: 16, right: 16, top: 14, bottom: 8 }).width('100%').height('100%').backgroundColor('#F3F6FC')
  }
}
