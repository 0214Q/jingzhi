import { MonthMode } from '../models/Contracts';
@CustomDialog
export struct MonthPickerDialog {
  controller?: CustomDialogController;
  initialMonth: string | null = null;
  initialMode: MonthMode = MonthMode.Value0;
  @State year: number = 2026;
  @State month: number = 10;
  @State mode: MonthMode = MonthMode.Value0;
  onConfirm: (month: string, mode: MonthMode) => void = () => {};
  onClear: () => void = () => {};
  aboutToAppear(): void {
    const value: string = this.initialMonth || '2026-10';
    this.year = Math.max(2000, Math.min(2100, Number(value.slice(0, 4)))); this.month = Number(value.slice(5, 7)); this.mode = this.initialMode;
  }
  private moveMonth(delta: number): void {
    this.month += delta;
    if (this.year === 2100 && this.month > 12) { this.month = 12; return; }
    if (this.year === 2000 && this.month < 1) { this.month = 1; return; }
    if (this.month > 12) { this.month = 1; this.year += 1; }
    if (this.month < 1) { this.month = 12; this.year -= 1; }
  }
  build() {
    Column({ space: 16 }) {
      Text('按月份查看').fontSize(20).fontWeight(FontWeight.Bold).fontColor('#172B46')
      Row({ space: 12 }) {
        Button('上一年', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).fontSize(12).height(44).enabled(this.year > 2000).onClick(() => { this.year -= 1; })
        Text(this.year.toString() + ' 年').fontColor('#172B46').fontSize(16).layoutWeight(1).textAlign(TextAlign.Center)
        Button('下一年', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).fontSize(12).height(44).enabled(this.year < 2100).onClick(() => { this.year += 1; })
      }.width('100%')
      Row({ space: 12 }) {
        Button('上一月', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).fontSize(12).height(44).onClick(() => this.moveMonth(-1))
        Text(this.month.toString() + ' 月').fontColor('#172B46').fontSize(18).fontWeight(FontWeight.Bold).layoutWeight(1).textAlign(TextAlign.Center)
        Button('下一月', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).fontSize(12).height(44).onClick(() => this.moveMonth(1))
      }.width('100%')
      Row({ space: 8 }) {
        Button('报名时间', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).fontSize(14).height(44).layoutWeight(1).backgroundColor(this.mode === MonthMode.Value0 ? '#1D4ED8' : '#EEF1F4').fontColor(this.mode === MonthMode.Value0 ? Color.White : '#475569').onClick(() => { this.mode = MonthMode.Value0; })
        Button('比赛时间', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).fontSize(14).height(44).layoutWeight(1).backgroundColor(this.mode === MonthMode.Value1 ? '#1D4ED8' : '#EEF1F4').fontColor(this.mode === MonthMode.Value1 ? Color.White : '#475569').onClick(() => { this.mode = MonthMode.Value1; })
      }.width('100%')
      Text('按所选月份与时间区间相交筛选；未知时间不推测。').fontSize(12).fontColor('#475569')
      Row({ space: 8 }) {
        Button('取消', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).fontSize(14).height(44).layoutWeight(1).onClick(() => this.controller?.close())
        Button('清除月份', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).fontSize(14).height(44).layoutWeight(1).onClick(() => { this.onClear(); this.controller?.close(); })
        Button('确认', { type: ButtonType.Normal }).fontColor('#334155').backgroundColor(Color.White).borderRadius(11).border({ width: 1, color: '#D8E2EF' }).padding({ left: 12, right: 12 }).fontSize(14).height(44).layoutWeight(1).backgroundColor('#1D4ED8').fontColor(Color.White).border({ width: 1, color: '#1D4ED8' }).onClick(() => {
          const value: string = this.year.toString() + '-' + (this.month < 10 ? '0' : '') + this.month.toString();
          this.onConfirm(value, this.mode); this.controller?.close();
        })
      }.width('100%')
    }.padding(24).width('100%').backgroundColor(Color.White).borderRadius(20)
  }
}
