import { studentScopeText } from '../services/StudentSchoolService';
import { ContestSummary } from '../models/Contracts';
import { deadlineText, scopeText } from '../services/HomeService';
import { statusColor } from '../common/Theme';
@Component
export struct ContestCard {
  @Prop item: ContestSummary;
  onOpen: (contestId: string) => void = () => {};
  build() {
    Column({ space: 12 }) {
      Row({ space: 8 }) {
        Text(this.item.category).fontSize(11).fontWeight(FontWeight.Medium).fontColor('#1D4ED8').padding({ left: 8, right: 8, top: 4, bottom: 4 }).backgroundColor('#EFF4FF').borderRadius(7)
        Blank().layoutWeight(1)
        Text(this.item.contestStatus === '未开始' && this.item.regEnd === null ? (this.item.scheduleCaption ? '日程已公布' : '时间待公布') : this.item.contestStatus).fontSize(11).fontWeight(FontWeight.Medium)
          .fontColor(statusColor(this.item.contestStatus)).padding({ left: 8, right: 8, top: 4, bottom: 4 }).backgroundColor('#F1F5F9').borderRadius(7)
      }.width('100%')
      Text(this.item.name).fontSize(17).lineHeight(24).fontWeight(FontWeight.Bold).fontColor('#172B46').width('100%').maxLines(2).textOverflow({ overflow: TextOverflow.Ellipsis })
      if (this.item.edition) { Text(this.item.edition).fontSize(11).fontColor('#475569').width('100%') }
      Text(studentScopeText(this.item.scopeType)).fontSize(11).fontColor('#475569').width('100%')
      Row({ space: 6 }) {
        Image($r('app.media.jingzhi_calendar')).width(15).height(15)
        Text(this.item.regEnd ? '报名截止' : '已知日程').fontSize(12).fontColor('#475569')
        Text(this.item.regEnd ? deadlineText(this.item.regEnd) : (this.item.scheduleCaption || '正式日期待公布').replace('T', ' ').replace(':00+08:00', '（北京时间）')).fontSize(12).fontWeight(FontWeight.Medium).fontColor('#172B46').layoutWeight(1)
      }.width('100%')
      Text('主办方：' + this.item.organizationName).fontSize(12).fontColor('#475569').width('100%').maxLines(1).textOverflow({ overflow: TextOverflow.Ellipsis })
      Text('参赛对象：' + scopeText(this.item)).fontSize(12).fontColor('#475569').width('100%').maxLines(2)
      Divider().color('#E5EBF3').strokeWidth(1)
      Row() { Text('查看赛事详情').fontSize(12).fontWeight(FontWeight.Medium).fontColor('#1D4ED8').layoutWeight(1); Image($r('app.media.jingzhi_chevron')).width(16).height(16) }.width('100%')
    }.width('100%').padding(16).backgroundColor(Color.White).borderRadius(16)
      .border({ width: 1, color: '#DCE5F0' }).onClick(() => this.onOpen(this.item.contestId))
  }
}
