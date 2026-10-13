import { router, promptAction } from '@kit.ArkUI';
import { goToHome } from '../services/Navigation';
interface NavEntry { label: string; icon: Resource; activeIcon: Resource; }
@Component
export struct StudentBottomNav {
  @Prop selected: string = '首页';
  private entries: NavEntry[] = [
    { label: '首页', icon: $r('app.media.jingzhi_home'), activeIcon: $r('app.media.jingzhi_home_active') },
    { label: '赛事', icon: $r('app.media.jingzhi_contests'), activeIcon: $r('app.media.jingzhi_contests_active') },
    { label: '消息', icon: $r('app.media.jingzhi_messages'), activeIcon: $r('app.media.jingzhi_messages_active') },
    { label: '我的', icon: $r('app.media.jingzhi_user'), activeIcon: $r('app.media.jingzhi_user_active') }
  ];
  private open(label: string): void {
    if (label === this.selected) return;
    if (label === '首页') goToHome();
    else if (label === '赛事') router.pushUrl({ url: 'pages/ContestList' });
    else if (label === '我的') router.pushUrl({ url: 'pages/My' });
    else promptAction.showToast({ message: '消息页暂未开放' });
  }
  build() {
    Row() {
      ForEach(this.entries, (entry: NavEntry) => {
        Column({ space: 5 }) {
          Image(entry.label === this.selected ? entry.activeIcon : entry.icon).width(23).height(23)
          Text(entry.label).fontSize(12).fontWeight(entry.label === this.selected ? FontWeight.Bold : FontWeight.Normal)
            .fontColor(entry.label === this.selected ? '#1D4ED8' : '#475569')
        }.layoutWeight(1).height(62).justifyContent(FlexAlign.Center)
          .backgroundColor(entry.label === this.selected ? '#EFF4FF' : Color.White).borderRadius(12)
          .onClick(() => this.open(entry.label))
      }, (entry: NavEntry) => entry.label)
    }.width('100%').padding({ top: 6, bottom: 6 }).backgroundColor(Color.White)
      .border({ width: { top: 1 }, color: '#E2E8F0' })
  }
}
