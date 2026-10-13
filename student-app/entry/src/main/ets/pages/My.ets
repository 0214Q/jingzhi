import { router, promptAction } from '@kit.ArkUI';
import { StudentSchoolContext } from '../models/Contracts';
import { studentSchoolProvider, schoolErrorText } from '../services/StudentSchoolService';
import { SessionSnapshot } from '../services/SessionService';
import { sessionServiceProvider } from '../services/SessionProvider';
import { requireStudentSession, goToLogin, goToHome } from '../services/Navigation';
@Entry
@Component
struct My {
  @State account: SessionSnapshot = { authenticated: false, user: null, expiresAt: null };
  @State school: StudentSchoolContext | null = null;
  @State error: string = '';
  @State loading: boolean = true;
  @State exiting: boolean = false;
  private active: boolean = false;
  private enterId: number = 0;
  aboutToAppear(): void { this.active = true; }
  onPageShow(): void { this.active = true; this.loadAccount(); }
  onPageHide(): void { this.active = false; this.enterId += 1; }
  aboutToDisappear(): void { this.active = false; this.enterId += 1; }
  private async loadAccount(): Promise<void> {
    const id: number = ++this.enterId; this.loading = true; this.error = ''; this.school = null;
    try {
      if (!(await requireStudentSession(() => this.active && id === this.enterId))) return;
      this.account = sessionServiceProvider.get().snapshot();
      if (this.account.user === null) return;
      const service = studentSchoolProvider.get(); service.bind(this.account.user.id);
      const next: StudentSchoolContext = await service.refresh();
      if (this.active && id === this.enterId) this.school = next;
    } catch (error) { if (this.active && id === this.enterId) this.error = error instanceof Error ? schoolErrorText(error as Error) : '高校读取失败'; }
    finally { if (this.active && id === this.enterId) this.loading = false; }
  }
  private async logout(): Promise<void> {
    if (this.exiting) return;
    this.exiting = true;
    try { await sessionServiceProvider.get().logout(); }
    catch { promptAction.showToast({ message: '本机已退出，服务端注销未完成' }); }
    finally { if (this.active) await goToLogin(); }
  }
  build() {
    Column({ space: 18 }) {
      Row() { Button('返回', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).fontSize(14).height(44).onClick(() => router.back()); Text('我的').fontColor('#172B46').fontSize(20).fontWeight(FontWeight.Bold).layoutWeight(1) }.width('100%')
      Column({ space: 12 }) {
        Text('当前账号：' + (this.account.user?.id || '正在读取')).fontColor('#172B46').fontSize(16).fontWeight(FontWeight.Bold).width('100%')
        Text('角色：' + (this.account.user?.role || '学生')).fontSize(14).fontColor('#475569').width('100%')
        Text('账号所属高校：' + (this.school?.homeSchool?.name || this.account.user?.schoolId || '正在读取')).fontColor('#172B46').fontSize(14).width('100%')
        Text('当前浏览高校：' + (this.school?.selectedSchool?.name || (this.loading ? '正在读取' : '请选择高校'))).fontColor('#172B46').fontSize(14).width('100%')
        Text('浏览选择不改变账号所属高校，也不代表参赛资格。').fontSize(12).fontColor('#475569').width('100%')
        if (this.error !== '') { Text(this.error).fontSize(12).fontColor('#B42318'); Button('重新读取', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).enabled(!this.loading).onClick(() => this.loadAccount()) }
      }.padding(20).width('100%').backgroundColor(Color.White).borderRadius(14)
      Button('选择 / 切换浏览高校', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).height(48).width('100%').enabled(!this.exiting).onClick(() => router.pushUrl({ url: 'pages/SchoolSelection' }))
      Button('返回首页', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).height(44).onClick(() => goToHome())
      Button('我的收藏', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).height(44).enabled(!this.loading && this.school?.selectedSchool !== null && this.school !== null).onClick(() => router.pushUrl({ url: 'pages/Favorites' }))
      Button('反馈与处理记录', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).height(44).enabled(!this.loading && this.school?.selectedSchool !== null && this.school !== null).onClick(() => router.pushUrl({ url: 'pages/Feedback' }))
      Button(this.exiting ? '退出中…' : '退出登录', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).height(48).width('100%').enabled(!this.exiting).fontColor('#B42318').backgroundColor('#FEF3F2').border({ width: 1, color: '#F4C7C3' }).onClick(() => this.logout())
    }.padding(16).width('100%').height('100%').backgroundColor('#F3F6FC')
  }
}
