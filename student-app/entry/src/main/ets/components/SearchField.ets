@Component
export struct SearchField {
  @Prop value: string = '';
  @Prop placeholder: string = '搜索赛事名称或主办方';
  @Prop busy: boolean = false;
  onChange: (value: string) => void = () => {};
  onSearch: () => void = () => {};
  build() {
    Row({ space: 8 }) {
      Image($r('app.media.jingzhi_search_active')).width(24).height(24).margin({ left: 6 })
      TextInput({ text: this.value, placeholder: this.placeholder })
        .layoutWeight(1).height(44).fontSize(14).fontColor('#172B46').placeholderColor('#52657C')
        .backgroundColor(Color.Transparent).padding({ left: 0, right: 0 }).borderRadius(8)
        .enterKeyType(EnterKeyType.Search).enabled(!this.busy)
        .onChange((value: string) => this.onChange(value))
        .onSubmit(() => { if (!this.busy) this.onSearch(); })
      Button('搜索', { type: ButtonType.Normal }).fontSize(14).fontWeight(FontWeight.Medium)
        .fontColor(Color.White).backgroundColor('#1D4ED8').height(40).borderRadius(10)
        .padding({ left: 16, right: 16 }).enabled(!this.busy).onClick(() => this.onSearch())
    }.width('100%').height(56).padding({ left: 8, right: 6 }).backgroundColor(Color.White)
      .border({ width: 1.5, color: '#AFC3E1' }).borderRadius(14)
  }
}
