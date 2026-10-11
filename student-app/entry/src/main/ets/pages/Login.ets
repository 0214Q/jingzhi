import { LoginController, LoginState } from '../services/SessionService';
import { sessionServiceProvider } from '../services/SessionProvider';
import { goToHome } from '../services/Navigation';
@Entry
@Component
struct Login {
  @State account: string = 'student';
  @State password: string = '';
  @State state: LoginState = { submitting: false, error: '' };
  @State initializing: boolean = true;
  private controller: LoginController | null = null;
  private active: boolean = true;
  aboutToAppear(): void { this.active = true; this.initialize(); }
  aboutToDisappear(): void { this.active = false; this.password = ''; this.controller?.dispose(); }
  private async initialize(): Promise<void> {
    try {
      const service = sessionServiceProvider.get();
      if (await service.check()) { if (this.active) await goToHome(); return; }
      if (!this.active) return;
      this.controller = new LoginController(service, (next: LoginState) => { this.state = next; });
    } catch { this.state = { submitting: false, error: '登录服务初始化失败，请重新启动应用。' }; }
    finally { if (this.active) this.initializing = false; }
  }
  private async login(): Promise<void> {
    if (this.controller === null || this.initializing) return;
    const success: boolean = await this.controller.submit(this.account, this.password);
    this.password = '';
    if (success && this.active) await goToHome();
  }
  build() {
    Scroll() {
      Column({ space: 20 }) {
        Text('竞知').fontSize(32).fontWeight(FontWeight.Bold).fontColor('#2C7BE5')
        Text('河南大学 · 校园赛事信息').fontSize(16).fontColor('#5A6573')
        Column({ space: 16 }) {
          Text('学生登录').fontSize(20).fontWeight(FontWeight.Bold).fontColor('#1F2733').width('100%')
          TextInput({ text: this.account, placeholder: '请输入账号' }).height(48).enabled(!this.state.submitting).onChange((value: string) => { this.account = value; })
          TextInput({ text: this.password, placeholder: '请输入密码' }).type(InputType.Password).height(48).enabled(!this.state.submitting).onChange((value: string) => { this.password = value; })
          if (this.state.error !== '') { Text(this.state.error).fontSize(14).fontColor('#E5484D').width('100%') }
          Button(this.initializing ? '正在准备…' : this.state.submitting ? '登录中…' : '登录').height(48).width('100%').backgroundColor('#2C7BE5').enabled(!this.initializing && !this.state.submitting && this.account.trim().length > 0 && this.password.length > 0).onClick(() => this.login())
          Text('演示账号：student\n演示密码：demo123').fontSize(12).fontColor('#5A6573').width('100%')
          Text('当前为本地演示模式，非学校统一身份认证。请勿输入真实学校账号或密码。').fontSize(12).fontColor('#9B4D09').width('100%')
        }.width('100%').padding(24).backgroundColor(Color.White).borderRadius(16)
        Text('平台由竞知项目团队维护，平台审核不代表学校官方认证。').fontSize(12).fontColor('#5A6573').width('100%')
      }.padding(24).width('100%')
    }.width('100%').height('100%').backgroundColor('#F4F6FA')
  }
}
