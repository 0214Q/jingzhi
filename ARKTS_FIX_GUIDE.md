# DevEco编译日志修复 1

本次依据上传日志修正6类源码兼容性问题。日志列出了54条具体诊断，末尾汇总55个错误；本地没有DevEco编译器，因此不宣称实际ArkTS编译已通过，也不能确认未列出的诊断。

## 替换步骤

1. 先把 C:\Users\16966\Jingzhi 工程备份到工程外的目录或压缩包。
2. 在本包 student-app/entry/src/main/ets 中，把 services、repository、models 三个目录的内容合并覆盖到你的工程 entry/src/main/ets 对应目录。模型Contracts.ets必须一起更新。
3. 只覆盖同名源码文件，不删除整个ets目录。保留IDE生成的entrybackupability及配套资源（如果已删除备份扩展注册，则保持当前module.json5即可）。
4. 保留当前工程的module.json5、AppScope、build-profile.json5、hvigor和签名配置；本包没有替换这些文件。
5. 清理构建缓存后重新构建。若有新错误，请保留第一批完整错误文本以及DevEco/SDK版本，继续按实际编译结果修复。

## 已修改

| 日志规则 | 修改 |
| --- | --- |
| arkts-no-ctor-prop-decls | 27个参数属性改为类字段，在普通构造函数内赋值 |
| arkts-no-obj-literals-as-types | 收藏列表和标准分页使用命名接口FavoriteViewPage/NormalizedPage |
| arkts-no-untyped-obj-literals | copy调用的对象先赋给明确DTO；收藏map回调返回Favorite；字段标签由Record字面量改为switch |
| arkts-no-spread | 收藏记录显式复制字段，不使用对象展开 |
| arkts-no-structural-typing | ContestFilter/FeedbackFilter显式继承PageQuery；UpdateDraftRequest继承CreateDraftRequest，字段及JSON不变 |
| arkts-limited-throw | 先识别Error，再以明确Error类型重抛；非Error转RepositoryError |

修复作用于shared源文件，再由同步脚本生成两端文件。新加入sync-error.py同步RepositoryError；重新运行同步不会恢复旧的构造函数参数属性。

## 验证结果及限制

- 常规业务回归：52项通过。
- 学生端生成的服务/Repository源码转为TS执行同一套回归：52项通过。这只验证生成副本的语义和普通TS类型，不等于ArkTS编译。
- 已知规则源扫描：20个非UI学生端文件通过；扫描仅针对本次日志的语法模式，不能替代ArkTS的全部检查。
- 全部生成文件同步检查及页面依赖边界检查通过。
- Vue/TypeScript检查和Web构建通过。
- 未执行DevEco/HarmonyOS SDK编译、模拟器或真机运行。需使用你的本地构建继续验收，UI及SDK相关诊断仍可能出现。

脚本：scripts/test-repositories.py、scripts/test-native-services.py、scripts/check-arkts-known-rules.cjs。
