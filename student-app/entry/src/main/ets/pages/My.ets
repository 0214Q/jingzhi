import { router, promptAction } from '@kit.ArkUI';
import { SessionSnapshot } from '../services/SessionService';
import { sessionServiceProvider } from '../services/SessionProvider';
import { requireStudentSession, goToLogin, goToHome } from '../services/Navigation';
@Entry
@Component
struct My {
  @State account: SessionSnapshot = { authenticated: false, user: null, expiresAt: null };
  @State exiting: boolean = false;
  private active: boolean = true;
  aboutToAppear(): void { this.active = true; }
 onPageShow(): void { this.active = true; this.loadAccount(); }
 onPageHide(): void { this.active = false; }
  aboutToDisappear(): void { this.active = false; }
  private async loadAccount(): Promise<void> {
    if (!(await requireStudentSession(() => this.active)) || !this.active) return;
    this.account = sessionServiceProvider.get().snapshot();
  }
  private async logout(): Promise<void> {
    if (this.exiting) return;
    this.exiting = true;
    try { await sessionServiceProvider.get().logout(); }
    catch { promptAction.showToast({ message: '本机已退出，服务端注销未完成' }); }
    finally { if (this.active) await goToLogin(); }
  }
  build() {
    Column({ space: 20 }) {
      Row() { Button('返回').fontSize(14).height(44).onClick(() => router.back()); Text('我的').fontSize(20).fontWeight(FontWeight.Bold).layoutWeight(1) }.width('100%')
      Column({ space: 12 }) {
        Text('当前账号：' + (this.account.user?.id || '未登录')).fontSize(16).fontWeight(FontWeight.Bold).width('100%')
        Text('角色：' + (this.account.user?.role || '学生')).fontSize(14).fontColor('#5A6573').width('100%')
        Text('本地演示账号，非学校统一身份认证。').fontSize(12).fontColor('#9B4D09').width('100%')
      }.padding(20).width('100%').backgroundColor(Color.White).borderRadius(14)
      Button(this.exiting ? '退出中…' : '退出登录').height(48).width('100%').enabled(!this.exiting).onClick(() => this.logout())
      Button('返回首页').height(44).onClick(() => goToHome())
      Button('我的收藏').height(44).onClick(() => router.pushUrl({ url: 'pages/Favorites' }))
      Button('反馈与处理记录').height(44).onClick(() => router.pushUrl({ url: 'pages/Feedback' }))
    }.padding(16).width('100%').height('100%').backgroundColor('#F4F6FA')
  }
}
