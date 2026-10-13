import { ContestSummary } from '../models/Contracts';
import { deadlineText, scopeText } from '../services/HomeService';
import { statusColor } from '../common/Theme';
@Component
export struct ContestCard {
  @Prop item: ContestSummary;
  onOpen: (contestId: string) => void = () => {};
  build() {
    Column({ space: 10 }) {
      Row() {
        Text(this.item.category + ' · ' + this.item.scopeType).fontSize(11).fontColor('#5A6573').layoutWeight(1)
        Text(this.item.contestStatus === '未开始' && this.item.regEnd === null ? '时间待公布' : this.item.contestStatus).fontSize(11).fontWeight(FontWeight.Bold)
          .fontColor(statusColor(this.item.contestStatus)).padding({ left: 8, right: 8, top: 5, bottom: 5 }).backgroundColor('#F4F6FA').borderRadius(20)
      }.width('100%')
      Text(this.item.name).fontSize(14).fontWeight(FontWeight.Bold).fontColor('#1F2733').width('100%').maxLines(2).textOverflow({ overflow: TextOverflow.Ellipsis })
      Text('报名截止：' + deadlineText(this.item.regEnd)).fontSize(14).fontWeight(FontWeight.Bold).fontColor('#1F2733').width('100%')
      Text('主办方：' + this.item.organizationName).fontSize(12).fontColor('#5A6573').width('100%')
      Text('参赛对象：' + scopeText(this.item)).fontSize(12).fontColor('#5A6573').width('100%').maxLines(2)
    }.width('100%').padding(16).backgroundColor(Color.White).borderRadius(14)
      .border({ width: 1, color: '#ECEFF3' }).onClick(() => this.onOpen(this.item.contestId))
  }
}
