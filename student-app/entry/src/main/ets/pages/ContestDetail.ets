import { studentSchoolProvider, studentCatalogNotice, studentScopeText } from '../services/StudentSchoolService';
import { interactionProvider } from '../services/InteractionProvider';
import { requireStudentSchool, goToLogin, goToHome } from '../services/Navigation';
import { router, promptAction } from '@kit.ArkUI';
import { common } from '@kit.AbilityKit';
import { PublicContest, PublicAuditLog, ChangeType, PublishedPublicity, ContestStatus } from '../models/Contracts';
import { contestRepositoryProvider } from '../services/Repositories';
import { ContestDetailController, DetailState, DetailRouteParams, DetailSection, initialDetailState, detailId, detailSections, displayText, timeText, incompleteText, publicLogs, fieldLabel, auditValue, safeSourceUrl, isDemoUrl, publicityTabText, historicalPublicityText } from '../services/ContestDetailService';
import { statusColor } from '../common/Theme';
@Entry
@Component
struct ContestDetail {
  @State schoolName: string = '';
  private viewedSchoolId: string = '';
  @State favorite: boolean = false;
  @State favoriteBusy: boolean = true;
  @State favoriteError: string = '';
  @State state: DetailState = initialDetailState();
  @State expandedKeys: string[] = ['basic', 'scope', 'schedule', 'requirement', 'award', 'entry'];
  @State logType: ChangeType | null = null;
  @State publicityOnly: boolean = false;
  @State publicityTab: string = 'winners';
  @State historySelected: boolean = false;
  private stages: ContestStatus[] = [ContestStatus.Value0, ContestStatus.Value1, ContestStatus.Value2, ContestStatus.Value3, ContestStatus.Value4, ContestStatus.Value5, ContestStatus.Value6];
  private controller: ContestDetailController | null = null;
  private active: boolean = false;
  private enterId: number = 0;
  private favoriteRequest: number = 0;
  aboutToAppear(): void { this.active = true; }
  onPageShow(): void { this.active = true; this.enter(); }
  onPageHide(): void { this.active = false; this.enterId += 1; this.favoriteRequest += 1; this.controller?.dispose(); }
  private async enter(): Promise<void> { const id: number = ++this.enterId; this.controller?.dispose(); this.favoriteRequest += 1; this.favorite = false; this.favoriteBusy = true; this.favoriteError = '';
    const blank: DetailState = initialDetailState(); blank.loading = true; this.state = blank;
    if (!(await requireStudentSchool(() => this.active && id === this.enterId))) return;
    try {
      const currentSchool: string = studentSchoolProvider.get().schoolHeader() || '';
      if (this.viewedSchoolId !== '' && this.viewedSchoolId !== currentSchool) { await goToHome(); return; }
      this.viewedSchoolId = currentSchool; this.schoolName = studentSchoolProvider.get().snapshot()?.selectedSchool?.name || '';
      const params: DetailRouteParams = router.getParams() as DetailRouteParams;
      this.controller = new ContestDetailController(contestRepositoryProvider.get(), (next: DetailState) => { if (this.active && id === this.enterId) this.state = next; });
      this.controller.load(detailId(params || {}));
      this.loadFavorite(detailId(params || {}));
    } catch {
      const next: DetailState = initialDetailState(); next.error = '暂时无法读取赛事详情，请返回列表。'; this.state = next;
    }
  }
  aboutToDisappear(): void { this.active = false; this.enterId += 1; this.favoriteRequest += 1; this.controller?.dispose(); }
  private async loadFavorite(id: string): Promise<void> {
    const request: number = ++this.favoriteRequest; this.favoriteBusy = true; this.favoriteError = '';
    try { const value: boolean = await interactionProvider.getService().isFavorite(id); if (this.active && request === this.favoriteRequest) this.favorite = value; }
    catch { if (this.active && request === this.favoriteRequest) this.favoriteError = '收藏状态加载失败，点击重试'; }
    finally { if (this.active && request === this.favoriteRequest) this.favoriteBusy = false; }
  }
  private async toggleFavorite(): Promise<void> {
    const detail: PublicContest | null = this.state.detail;
    if (detail === null || this.favoriteBusy) return;
    if (this.favoriteError !== '') { this.loadFavorite(detail.contestId); return; }
    const request: number = ++this.favoriteRequest; this.favoriteBusy = true;
    try {
      if (this.favorite) await interactionProvider.getFavorites().remove(detail.contestId);
      else await interactionProvider.getFavorites().add({ contestId: detail.contestId });
      if (this.active && request === this.favoriteRequest) this.favorite = !this.favorite;
    } catch { if (this.active && request === this.favoriteRequest) promptAction.showToast({ message: '收藏操作失败，请重试' }); }
    finally { if (this.active && request === this.favoriteRequest) this.favoriteBusy = false; }
  }
  private back(): void { if (this.publicityOnly) this.publicityOnly = false; else router.back(); }
  private toggle(key: string): void {
    this.expandedKeys = this.expandedKeys.includes(key) ? this.expandedKeys.filter((item: string) => item !== key) : this.expandedKeys.concat([key]);
  }
  private async openSource(value: string | null): Promise<void> {
    const url: string | null = safeSourceUrl(value);
    if (url === null) { promptAction.showToast({ message: '原通知链接尚未公布' }); return; }
    if (isDemoUrl(url)) { promptAction.showToast({ message: '当前为演示链接，未连接真实通知' }); return; }
    try {
      const context: common.UIAbilityContext = getContext(this) as common.UIAbilityContext;
      await context.startAbility({ action: 'ohos.want.action.viewData', uri: url, entities: ['entity.system.browsable'] });
    } catch { promptAction.showToast({ message: '无法打开浏览器，可长按链接复制后查看' }); }
  }
  @Builder
  hero(d: PublicContest) {
    Column({ space: 12 }) {
      Row() {
        Text(d.data.category + ' · ' + studentScopeText(d.data.scopeType)).fontSize(11).fontColor('#475569').layoutWeight(1)
        Text(d.contestStatus === '未开始' ? (d.data.regStart || d.data.regEnd || d.data.contestStart || d.data.schedule?.length ? '日程已公布' : '时间待公布') : d.contestStatus).fontSize(11).fontWeight(FontWeight.Bold).fontColor(statusColor(d.contestStatus)).padding(8).backgroundColor('#F3F6FC').borderRadius(20)
      }.width('100%')
      Text(d.data.name).fontSize(20).fontWeight(FontWeight.Bold).fontColor('#172B46').width('100%')
      if (d.data.edition) { Text(d.data.edition).fontSize(12).fontColor('#475569').width('100%') }
      Text('报名截止：' + timeText(d.data.regEnd)).fontSize(14).fontWeight(FontWeight.Bold).fontColor('#A64B08').width('100%')
      Text(studentCatalogNotice(this.schoolName)).fontSize(12).fontColor('#9B4D09').width('100%')
    }.padding(16).width('100%').backgroundColor(Color.White).borderRadius(14)
  }
  @Builder
  source(d: PublicContest) {
    Column({ space: 8 }) {
      Text('信息来源').fontSize(16).fontWeight(FontWeight.Bold).fontColor('#172B46').width('100%')
      Text('来源：' + displayText(d.source.sourceOrg)).fontSize(14).fontColor('#172B46').width('100%')
      Text(displayText(d.source.sourceTitle)).fontSize(14).fontColor('#172B46').width('100%')
      Text('原文发布时间：' + timeText(d.source.sourcePublishedAt)).fontSize(12).fontColor('#475569').width('100%')
      Text('信息采集：' + timeText(d.source.collectedAt)).fontSize(12).fontColor('#475569').width('100%')
      Text('最近核对：' + timeText(d.source.lastVerifiedAt)).fontSize(12).fontColor('#475569').width('100%')
      Text('原通知链接：' + displayText(d.source.sourceUrl)).fontSize(12).fontColor('#1D4ED8').width('100%').copyOption(CopyOptions.LocalDevice)
      Button('查看原通知', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).height(44).fontSize(14).enabled(safeSourceUrl(d.source.sourceUrl) !== null).onClick(() => this.openSource(d.source.sourceUrl))
      Text('平台由竞知项目团队维护，尚未取得学校官方授权；平台审核仅表示信息核对，不代表学校官方认证。').fontSize(12).fontColor('#475569').width('100%')
    }.padding(16).width('100%').backgroundColor(Color.White).borderRadius(14)
  }
  @Builder
  section(section: DetailSection, d: PublicContest) {
    Column({ space: 12 }) {
      Row() {
        Text(section.title).fontSize(16).fontWeight(FontWeight.Bold).fontColor('#172B46').layoutWeight(1)
        Button(this.expandedKeys.includes(section.key) ? '收起' : '展开', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).fontSize(12).height(44).onClick(() => this.toggle(section.key))
      }.width('100%')
      if (this.expandedKeys.includes(section.key)) {
        if (section.key === 'schedule') {
          Text('当前阶段：' + (d.contestStatus === '未开始' ? (d.data.regStart || d.data.regEnd || d.data.contestStart || d.data.schedule?.length ? '日程已公布' : '时间待公布') : d.contestStatus)).fontSize(12).fontColor('#475569').width('100%')
          Scroll() {
            Row({ space: 8 }) {
              ForEach(this.stages, (stage: ContestStatus) => {
                Text(stage === '未开始' && d.data.regStart === null && d.data.contestStart === null ? '时间待公布' : stage).fontSize(12).fontWeight(stage === d.contestStatus ? FontWeight.Bold : FontWeight.Normal).fontColor(stage === d.contestStatus ? statusColor(stage) : '#475569').padding(8).backgroundColor('#F3F6FC').borderRadius(12)
              }, (stage: ContestStatus) => stage)
            }
          }.scrollable(ScrollDirection.Horizontal).scrollBar(BarState.Off).width('100%')
        }
        Text(section.text).fontSize(14).fontColor('#172B46').lineHeight(24).width('100%').copyOption(CopyOptions.LocalDevice)
      }
    }.padding(16).width('100%').backgroundColor(Color.White).borderRadius(14)
  }
  @Builder
  logs(d: PublicContest) {
    Column({ space: 12 }) {
      Row() {
        Text('修改记录').fontSize(16).fontWeight(FontWeight.Bold).fontColor('#172B46').layoutWeight(1)
        Button(this.expandedKeys.includes('logs') ? '收起' : '展开', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).fontSize(12).height(44).onClick(() => this.toggle('logs'))
      }.width('100%')
      if (this.expandedKeys.includes('logs')) {
        Text('这里只记录平台自身更新过程，不代表主办方所有历史修改。').fontSize(12).fontColor('#475569').width('100%')
        Row({ space: 8 }) {
          Button('全部', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).fontSize(12).height(44).backgroundColor(this.logType === null ? '#1D4ED8' : '#EEF1F4').fontColor(this.logType === null ? Color.White : '#475569').onClick(() => { this.logType = null; })
          Button('原通知变更', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).fontSize(12).height(44).backgroundColor(this.logType === ChangeType.Value0 ? '#1D4ED8' : '#EEF1F4').fontColor(this.logType === ChangeType.Value0 ? Color.White : '#475569').onClick(() => { this.logType = ChangeType.Value0; })
          Button('平台纠错', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).fontSize(12).height(44).backgroundColor(this.logType === ChangeType.Value1 ? '#B42318' : '#EEF1F4').fontColor(this.logType === ChangeType.Value1 ? Color.White : '#475569').onClick(() => { this.logType = ChangeType.Value1; })
        }.width('100%')
        if (publicLogs(d, this.logType).length === 0) {
          Text('暂无该类型的公开修改记录').fontSize(14).fontColor('#475569').width('100%')
        } else {
          ForEach(publicLogs(d, this.logType), (log: PublicAuditLog) => {
            Column({ space: 8 }) {
              Text(log.changeType + ' · ' + fieldLabel(log.field)).fontSize(14).fontWeight(FontWeight.Bold).fontColor(log.changeType === ChangeType.Value0 ? '#1D4ED8' : '#B42318').width('100%')
              Text(timeText(log.time) + ' · 操作人：' + log.operator).fontSize(12).fontColor('#475569').width('100%')
              Text('修改前：' + auditValue(log.oldValue)).fontSize(14).fontColor('#475569').width('100%')
              Text('修改后：' + auditValue(log.newValue)).fontSize(14).fontColor('#172B46').width('100%')
              Text('原因：' + log.reason).fontSize(12).fontColor('#475569').width('100%')
            }.padding({ left: 12, bottom: 12, top: 8 }).width('100%').border({ width: { left: 2 }, color: log.changeType === ChangeType.Value0 ? '#1D4ED8' : '#B42318' })
          }, (log: PublicAuditLog) => log.id)
        }
      }
    }.padding(16).width('100%').backgroundColor(Color.White).borderRadius(14)
  }
  @Builder
  publicity(d: PublicContest) {
    Column({ space: 12 }) {
      Text('结果公示').fontSize(16).fontWeight(FontWeight.Bold).fontColor('#172B46').width('100%')
      Row({ space: 8 }) {
        Button('当前公示', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).fontSize(14).height(44).layoutWeight(1).backgroundColor(!this.historySelected ? '#1D4ED8' : '#EEF1F4').fontColor(!this.historySelected ? Color.White : '#475569').onClick(() => { this.historySelected = false; })
        Button('历史公示', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).fontSize(14).height(44).layoutWeight(1).backgroundColor(this.historySelected ? '#1D4ED8' : '#EEF1F4').fontColor(this.historySelected ? Color.White : '#475569').onClick(() => { this.historySelected = true; })
      }.width('100%')
      if (!this.historySelected) {
        Row({ space: 8 }) {
          Button('获奖名单', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).fontSize(12).height(44).layoutWeight(1).backgroundColor(this.publicityTab === 'winners' ? '#EAF2FE' : '#F3F6FC').fontColor('#1D4ED8').onClick(() => { this.publicityTab = 'winners'; })
          Button('评审办法', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).fontSize(12).height(44).layoutWeight(1).backgroundColor(this.publicityTab === 'rule' ? '#EAF2FE' : '#F3F6FC').fontColor('#1D4ED8').onClick(() => { this.publicityTab = 'rule'; })
          Button('评分标准', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).fontSize(12).height(44).layoutWeight(1).backgroundColor(this.publicityTab === 'standard' ? '#EAF2FE' : '#F3F6FC').fontColor('#1D4ED8').onClick(() => { this.publicityTab = 'standard'; })
        }.width('100%')
        Text(publicityTabText(d.publicity, this.publicityTab)).fontSize(14).fontColor('#172B46').lineHeight(24).width('100%')
      } else if (d.publicity.history.length === 0) {
        Text('暂无历史公示记录').fontSize(14).fontColor('#475569').width('100%')
      } else {
        ForEach(d.publicity.history, (item: PublishedPublicity) => {
          Column({ space: 8 }) {
            Text(item.type + ' · 第 ' + item.versionNo.toString() + ' 版').fontSize(14).fontWeight(FontWeight.Bold).fontColor('#172B46').width('100%')
            Text(timeText(item.publishedAt)).fontSize(12).fontColor('#475569').width('100%')
            Text(historicalPublicityText(item)).fontSize(14).fontColor('#172B46').lineHeight(24).width('100%')
          }.padding(12).width('100%').backgroundColor('#F3F6FC').borderRadius(12)
        }, (item: PublishedPublicity) => item.id)
      }
      Text('仅展示已公开公示；历史公示是当前赛事的历史版本，不混入其他届次。').fontSize(12).fontColor('#475569').width('100%')
    }.padding(16).width('100%').backgroundColor(Color.White).borderRadius(14)
  }
  @Builder
  content(d: PublicContest) {
    Column({ space: 12 }) {
      if (d.takedown !== null) {
        Text('该赛事已下架，内容仅供参考。\n原因：' + d.takedown.reason).fontSize(14).fontColor('#B32E34').padding(16).width('100%').backgroundColor('#FFF0F0').borderRadius(14)
      }
      if (this.publicityOnly) {
        this.publicity(d)
      } else {
        this.hero(d)
        if (incompleteText(d) !== '') {
          Text(incompleteText(d)).fontSize(12).fontColor('#A64B08').padding(16).width('100%').backgroundColor('#FFF4EA').borderRadius(14)
        }
        this.source(d)
        ForEach(detailSections(d), (section: DetailSection) => { this.section(section, d) }, (section: DetailSection) => section.key)
        this.logs(d)
        this.publicity(d)
      }
    }.padding(16).width('100%')
  }
  build() {
    Column() {
      Row({ space: 8 }) {
        Button('返回', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).fontSize(14).height(44).onClick(() => this.back())
        Text(this.publicityOnly ? '结果公示' : '赛事详情').fontSize(20).fontWeight(FontWeight.Bold).fontColor('#172B46').layoutWeight(1)
        Button('刷新', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).fontSize(14).height(44).enabled(!this.state.loading).onClick(() => this.enter())
      }.padding({ left: 16, right: 16, top: 12 }).width('100%').backgroundColor(Color.White)
      if (this.state.loading) {
        Column({ space: 12 }) { LoadingProgress().width(32).height(32); Text('正在读取赛事详情…').fontSize(14).fontColor('#475569') }.layoutWeight(1).width('100%').justifyContent(FlexAlign.Center)
      } else if (this.state.error !== '') {
        Column({ space: 12 }) {
          Text(this.state.error).fontSize(14).fontColor('#475569')
          if (this.state.errorCode === 500) { Button('重试', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).onClick(() => this.controller?.refresh()) }
          Button('返回', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).onClick(() => router.back())
        }.layoutWeight(1).width('100%').justifyContent(FlexAlign.Center).padding(24)
      } else if (this.state.detail !== null) {
        Scroll() { this.content(this.state.detail) }.layoutWeight(1).width('100%').scrollBar(BarState.Off)
        Row({ space: 12 }) {
          Button(this.favoriteBusy ? '加载中' : this.favoriteError !== '' ? '重试收藏' : this.favorite ? '取消收藏' : '收藏', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).fontSize(14).height(44).layoutWeight(1).enabled(!this.favoriteBusy).backgroundColor(this.favorite ? '#EFF4FF' : '#1D4ED8').fontColor(this.favorite ? '#1D4ED8' : Color.White).border({ width: 1, color: '#A5BDEE' }).onClick(() => this.toggleFavorite())
          Button('反馈', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).fontSize(14).height(44).layoutWeight(1).onClick(() => router.pushUrl({ url: 'pages/Feedback', params: { contestId: this.state.detail?.contestId } }))
          Button(this.publicityOnly ? '返回详情' : '看公示', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).fontSize(14).height(44).layoutWeight(1).onClick(() => { this.publicityOnly = !this.publicityOnly; })
        }.padding(16).width('100%').backgroundColor(Color.White)
      }
    }.width('100%').height('100%').backgroundColor('#F3F6FC')
  }
}
