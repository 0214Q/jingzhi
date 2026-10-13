import { SearchField } from '../components/SearchField';
import { router, promptAction } from '@kit.ArkUI';
import { StudentSchool, StudentSchoolContext } from '../models/Contracts';
import { studentSchoolProvider, schoolErrorText } from '../services/StudentSchoolService';
import { sessionServiceProvider } from '../services/SessionProvider';
import { requireStudentSession, goToHome, goToLogin } from '../services/Navigation';
import { RepositoryError } from '../repository/RepositoryError';
@Entry
@Component
struct SchoolSelection {
  @State context: StudentSchoolContext | null = null;
  @State schools: StudentSchool[] = [];
  @State keyword: string = '';
  @State chosen: StudentSchool | null = null;
  @State total: number = 0;
  @State page: number = 1;
  @State loading: boolean = true;
  @State saving: boolean = false;
  @State error: string = '';
  private active: boolean = false;
  private requestId: number = 0;
  aboutToAppear(): void { this.active = true; }
  onPageShow(): void { this.active = true; this.initialize(); }
  onPageHide(): void { this.active = false; this.requestId += 1; }
  aboutToDisappear(): void { this.active = false; this.requestId += 1; }
  onBackPress(): boolean { return this.saving; }
  private async initialize(): Promise<void> {
    const id: number = ++this.requestId; this.loading = true; this.saving = false; this.error = ''; this.schools = []; this.chosen = null;
    try {
      if (!(await requireStudentSession(() => this.active && id === this.requestId))) return;
      const user = sessionServiceProvider.get().snapshot().user; if (user === null) return;
      const service = studentSchoolProvider.get(); service.bind(user.id);
      const context: StudentSchoolContext = await service.refresh();
      if (!this.active || id !== this.requestId) return;
      this.context = context; this.chosen = context.selectedSchool;
      await this.loadSchools(1, id);
    } catch (error) { if (this.active && id === this.requestId) { if (error instanceof Error) this.error = schoolErrorText(error as Error); else this.error = '高校读取失败，请重试'; } }
    finally { if (this.active && id === this.requestId) this.loading = false; }
  }
  private async loadSchools(page: number, expectedId: number): Promise<void> {
    const result = await studentSchoolProvider.get().listSchools({ keyword: this.keyword.trim(), page: page, pageSize: 20 });
    if (this.active && expectedId === this.requestId) { this.schools = result.list; this.total = result.total; this.page = page; }
  }
  private async search(page: number): Promise<void> {
    if (this.saving || this.loading || this.context === null) return;
    const id: number = ++this.requestId; this.loading = true; this.error = ''; this.schools = [];
    try { await this.loadSchools(page, id); }
    catch (error) { if (this.active && id === this.requestId) this.error = error instanceof Error ? schoolErrorText(error as Error) : '高校查询失败'; }
    finally { if (this.active && id === this.requestId) this.loading = false; }
  }
  private async confirm(): Promise<void> {
    if (this.saving || this.loading || this.chosen === null || this.context === null) return;
    const id: number = ++this.requestId; const target: string = this.chosen.id; this.saving = true; this.error = '';
    try {
      const next: StudentSchoolContext = await studentSchoolProvider.get().selectSchool(target);
      if (!this.active || id !== this.requestId) return;
      this.context = next; promptAction.showToast({ message: '当前浏览高校：' + (next.selectedSchool?.name || '') });
      await goToHome();
    } catch (error) {
      if (!this.active || id !== this.requestId) return;
      if (error instanceof RepositoryError && error.code === 401) { await goToLogin(); return; }
      this.error = error instanceof Error ? schoolErrorText(error as Error) : '高校切换失败，请重试';
      // Reload the concurrency token, but never silently retry a failed choice.
      try { const latest: StudentSchoolContext = await studentSchoolProvider.get().refresh(); if (this.active && id === this.requestId) { this.context = latest; this.chosen = latest.selectedSchool; await this.loadSchools(this.page, id); } } catch {}
    } finally { if (this.active && id === this.requestId) this.saving = false; }
  }
  build() {
    Column({ space: 14 }) {
      Row() {
        Text('选择浏览高校').fontColor('#172B46').fontSize(22).fontWeight(FontWeight.Bold).layoutWeight(1)
        if (this.context !== null && this.context.selectedSchool !== null) { Button('返回首页', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).enabled(!this.saving).onClick(() => goToHome()) }
      }.width('100%')
      Column({ space: 8 }) {
        Text('账号所属高校：' + (this.context?.homeSchool?.name || this.context?.homeSchoolId || '正在读取')).fontColor('#172B46').fontSize(14).width('100%')
        Text('当前浏览高校：' + (this.context?.selectedSchool?.name || '请选择启用高校')).fontColor('#172B46').fontSize(14).width('100%')
        Text('选择仅改变浏览范围，不修改账号所属高校或管理权限。能否参赛以赛事适用范围和当年官方通知为准。').fontSize(12).fontColor('#475569').width('100%')
      }.padding(16).width('100%').backgroundColor(Color.White).borderRadius(14)
      SearchField({ value: this.keyword, placeholder: '搜索高校名称或代码', busy: this.saving || this.loading || this.context === null, onChange: (value: string) => { this.keyword = value; }, onSearch: () => this.search(1) })
      if (this.error !== '') { Text(this.error).fontColor('#B42318').width('100%'); Button('重新读取', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).enabled(!this.loading && !this.saving).onClick(() => this.initialize()) }
      if (this.loading) { LoadingProgress().width(32).height(32) }
      if (!this.loading && this.error === '' && this.schools.length === 0) { Text('暂无匹配的启用高校，请调整搜索或联系管理员。').fontColor('#475569') }
      List({ space: 10 }) {
        ForEach(this.schools, (school: StudentSchool) => {
          ListItem() {
            Row({ space: 12 }) {
              Column({ space: 6 }) { Text(school.name).fontColor('#172B46').fontSize(17).fontWeight(FontWeight.Bold).width('100%'); Text(school.id === this.context?.homeSchoolId ? '账号所属高校' : '公开参赛目录').fontSize(12).fontColor('#475569').width('100%') }.layoutWeight(1)
              Text(this.chosen?.id === school.id ? '已选' : '选择').fontSize(14).fontColor('#1D4ED8')
            }.width('100%').padding(16).backgroundColor(this.chosen?.id === school.id ? '#EAF2FE' : Color.White).borderRadius(12)
              .enabled(!this.saving && !this.loading).onClick(() => { this.chosen = school; })
          }
        }, (school: StudentSchool) => school.id)
      }.layoutWeight(1).width('100%')
      Row({ space: 8 }) {
        Button('上一页', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).enabled(!this.loading && !this.saving && this.page > 1).onClick(() => this.search(this.page - 1))
        Text(this.page.toString() + '页 / 共' + this.total.toString() + '所').fontColor('#172B46').fontSize(12).layoutWeight(1).textAlign(TextAlign.Center)
        Button('下一页', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).enabled(!this.loading && !this.saving && this.page * 20 < this.total).onClick(() => this.search(this.page + 1))
      }.width('100%')
      Text('将浏览：' + (this.chosen?.name || '尚未选择')).fontColor('#172B46').fontSize(13).width('100%')
      Button(this.saving ? '切换中…' : '确认浏览高校', { type: ButtonType.Normal }).fontColor(Color.White).backgroundColor('#1D4ED8').borderRadius(11).border({ width: 1, color: '#1D4ED8' }).padding({ left: 12, right: 12 }).height(48).width('100%').backgroundColor('#1D4ED8')
        .enabled(!this.saving && !this.loading && this.error === '' && this.chosen !== null).onClick(() => this.confirm())
    }.padding(16).width('100%').height('100%').backgroundColor('#F3F6FC')
  }
}
