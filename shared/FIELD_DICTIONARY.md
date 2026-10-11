# DTO 字段字典

必填表示键必须出现，业务发布校验在实现层完成。

## ApplicableScope

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| colleges | `string[]` | 必需 |
| majors | `string[]` | 必需 |
| grades | `string[]` | 必需 |
| degrees | `string[]` | 必需 |
| campuses | `string[]` | 必需 |
| applicableNote | `string` | 必需 |

## ContestPayload

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| name | `string` | 必需 |
| category | `Category` | 必需 |
| scopeType | `ScopeType` | 必需 |
| edition | `string | null` | 必需 |
| level | `ContestLevel | null` | 必需 |
| applicableScope | `ApplicableScope` | 必需 |
| entryType | `EntryType` | 必需 |
| sourceTitle | `string | null` | 必需 |
| sourceOrg | `string | null` | 必需 |
| sourceUrl | `string | null` | 必需 |
| sourcePublishedAt | `string | null` | 必需 |
| collectedAt | `string` | 必需 |
| lastVerifiedAt | `string` | 必需 |
| completeness | `Completeness` | 必需 |
| regStart | `string | null` | 必需 |
| regEnd | `string | null` | 必需 |
| contestStart | `string | null` | 必需 |
| contestEnd | `string | null` | 必需 |
| publicityTime | `string | null` | 必需 |
| contestRequirement | `string | null` | 必需 |
| reviewRules | `string | null` | 必需 |
| awardSetting | `string | null` | 必需 |
| material | `string | null` | 必需 |
| entryMethod | `string` | 必需 |
| contact | `string | null` | 必需 |
| description | `string | null` | 必需 |
| creditApplicable | `CreditApplicable` | 必需 |
| creditBasis | `string | null` | 必需 |
| creditNote | `string | null` | 必需 |
| organizationId | `string` | 必需 |
| attachmentIds | `string[]` | 必需 |

## Takedown

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| reason | `string` | 必需 |
| at | `string` | 必需 |
| by | `string` | 必需 |

## Contest

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| contestId | `string` | 必需 |
| schoolId | `string` | 必需 |
| publishedVersionId | `string | null` | 必需 |
| contestStatus | `ContestStatus` | 必需 |
| takedown | `Takedown | null` | 必需 |
| createdBy | `string` | 必需 |
| updatedAt | `string` | 必需 |

## ContestVersion

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| versionId | `string` | 必需 |
| contestId | `string` | 必需 |
| versionNo | `number` | 必需 |
| status | `VersionStatus` | 必需 |
| etag | `string` | 必需 |
| isCurrent | `boolean` | 必需 |
| payload | `ContestPayload` | 必需 |
| operator | `string` | 必需 |
| operatorRole | `Role` | 必需 |
| entryType | `EntryType` | 必需 |
| changeType | `ChangeType | null` | 必需 |
| reason | `string` | 必需 |
| createdAt | `string` | 必需 |
| submittedAt | `string | null` | 必需 |
| reviewedAt | `string | null` | 必需 |
| reviewNote | `string | null` | 必需 |
| updatedAt | `string` | 必需 |

## AuditLog

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| id | `string` | 必需 |
| contestId | `string` | 必需 |
| versionId | `string` | 必需 |
| operator | `string` | 必需 |
| time | `string` | 必需 |
| field | `string` | 必需 |
| oldValue | `string | null` | 必需 |
| newValue | `string | null` | 必需 |
| reason | `string` | 必需 |
| changeType | `ChangeType` | 必需 |
| visibility | `Visibility` | 必需 |

## Publicity

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| id | `string` | 必需 |
| contestId | `string` | 必需 |
| type | `PublicityType` | 必需 |
| reviewStatus | `VersionStatus` | 必需 |
| versionNo | `number` | 必需 |
| content | `string | PublicityContent` | 必需 |
| operator | `string` | 必需 |
| etag | `string` | 必需 |
| reason | `string` | 必需 |
| reviewNote | `string | null` | 必需 |
| publishedAt | `string | null` | 必需 |

## Attachment

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| id | `string` | 必需 |
| contestId | `string` | 必需 |
| type | `string` | 必需 |
| name | `string` | 必需 |
| url | `string` | 必需 |
| uploader | `string` | 必需 |
| time | `string` | 必需 |

## Favorite

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| userId | `string` | 必需 |
| contestId | `string` | 必需 |
| createdAt | `string` | 必需 |
| available | `boolean` | 必需 |

## Notification

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| id | `string` | 必需 |
| userId | `string` | 必需 |
| type | `NotificationType` | 必需 |
| title | `string` | 必需 |
| content | `string` | 必需 |
| read | `boolean` | 必需 |
| link | `string` | 必需 |
| createdAt | `string` | 必需 |

## NotificationSetting

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| userId | `string` | 必需 |
| subscribedCategories | `Category[]` | 必需 |
| enabledTypes | `NotificationType[]` | 必需 |
| pushEnabled | `boolean` | 必需 |

## Feedback

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| id | `string` | 必需 |
| userId | `string` | 必需 |
| contestId | `string | null` | 必需 |
| type | `string` | 必需 |
| desc | `string` | 必需 |
| status | `FeedbackStatus` | 必需 |
| handler | `string | null` | 必需 |
| note | `string | null` | 必需 |
| time | `string` | 必需 |

## User

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| id | `string` | 必需 |
| role | `Role` | 必需 |
| schoolId | `string` | 必需 |
| openid | `string | null` | 必需 |
| subscribes | `Category[]` | 必需 |
| devices | `string[]` | 必需 |

## Organization

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| id | `string` | 必需 |
| schoolId | `string` | 必需 |
| name | `string` | 必需 |
| type | `string` | 必需 |
| contact | `string | null` | 必需 |
| intro | `string | null` | 必需 |
| owners | `string[]` | 必需 |

## School

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| id | `string` | 必需 |
| name | `string` | 必需 |
| config | `SchoolConfig` | 必需 |

## ImportError

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| row | `number` | 必需 |
| field | `string` | 必需 |
| msg | `string` | 必需 |

## ReviewRecord

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| id | `string` | 必需 |
| contestId | `string` | 必需 |
| versionId | `string` | 必需 |
| reviewer | `string` | 必需 |
| time | `string` | 必需 |
| result | `ReviewResult` | 必需 |
| rejectReason | `string | null` | 必需 |

## SchoolConfig

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| title | `string` | 必需 |
| primaryColor | `string` | 必需 |
| defaultApplicableNote | `string` | 必需 |

## SourceBlock

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| sourceTitle | `string | null` | 必需 |
| sourceOrg | `string | null` | 必需 |
| sourceUrl | `string | null` | 必需 |
| sourcePublishedAt | `string | null` | 必需 |
| collectedAt | `string` | 必需 |
| lastVerifiedAt | `string` | 必需 |

## Winner

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| name | `string` | 必需 |
| award | `string` | 必需 |
| workTitle | `string | null` | 必需 |
| organizationName | `string | null` | 必需 |

## PublicityContent

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| text | `string | null` | 必需 |
| winners | `Winner[]` | 必需 |

## PublishedPublicity

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| id | `string` | 必需 |
| contestId | `string` | 必需 |
| type | `PublicityType` | 必需 |
| versionNo | `number` | 必需 |
| content | `string | PublicityContent` | 必需 |
| publishedAt | `string` | 必需 |

## CurrentPublicity

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| winners | `Winner[]` | 必需 |
| rule | `string | null` | 必需 |
| standard | `string | null` | 必需 |

## PublicityResult

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| current | `CurrentPublicity | null` | 必需 |
| history | `PublishedPublicity[]` | 必需 |

## PublicAuditLog

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| id | `string` | 必需 |
| contestId | `string` | 必需 |
| versionId | `string` | 必需 |
| operator | `string` | 必需 |
| time | `string` | 必需 |
| field | `string` | 必需 |
| oldValue | `string | null` | 必需 |
| newValue | `string | null` | 必需 |
| reason | `string` | 必需 |
| changeType | `ChangeType` | 必需 |
| visibility | `PublicVisibility` | 必需 |

## ContestSummary

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| contestId | `string` | 必需 |
| name | `string` | 必需 |
| category | `Category` | 必需 |
| scopeType | `ScopeType` | 必需 |
| contestStatus | `ContestStatus` | 必需 |
| regEnd | `string | null` | 必需 |
| regEndHasTime | `boolean` | 必需 |
| organizationName | `string` | 必需 |
| applicableScope | `ApplicableScope` | 必需 |
| completeness | `Completeness` | 必需 |
| level | `ContestLevel | null` | 必需 |

## PublicContest

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| contestId | `string` | 必需 |
| schoolId | `string` | 必需 |
| publishedVersionId | `string` | 必需 |
| contestStatus | `ContestStatus` | 必需 |
| takedown | `Takedown | null` | 必需 |
| data | `ContestPayload` | 必需 |
| source | `SourceBlock` | 必需 |
| publicity | `PublicityResult` | 必需 |
| auditLogs | `PublicAuditLog[]` | 必需 |
| completeness | `Completeness` | 必需 |
| incompleteFields | `string[]` | 必需 |
| regEndHasTime | `boolean` | 必需 |
| organizationName | `string` | 必需 |
| updatedAt | `string` | 必需 |

## ManagedContest

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| contest | `Contest` | 必需 |
| workingVersion | `ContestVersion | null` | 必需 |
| publishedVersion | `ContestVersion | null` | 必需 |

## ContestFilter

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| keyword | `string` | 可省略 |
| category | `Category` | 可省略 |
| scopeType | `ScopeType` | 可省略 |
| entryType | `EntryType` | 可省略 |
| contestStatus | `ContestStatus` | 可省略 |
| year | `number` | 可省略 |
| month | `string` | 可省略 |
| monthMode | `MonthMode` | 可省略 |
| page | `number` | 可省略 |
| pageSize | `number` | 可省略 |
| sort | `string` | 可省略 |

## LoginRequest

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| account | `string` | 可省略 |
| password | `string` | 可省略 |
| agcToken | `string` | 可省略 |

## LoginResult

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| token | `string` | 必需 |
| tokenType | `string` | 必需 |
| expiresAt | `string` | 必需 |
| user | `User` | 必需 |

## CreateDraftRequest

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| name | `string` | 可省略 |
| category | `Category` | 可省略 |
| scopeType | `ScopeType` | 可省略 |
| edition | `string | null` | 可省略 |
| level | `ContestLevel | null` | 可省略 |
| applicableScope | `ApplicableScope` | 可省略 |
| entryType | `EntryType` | 可省略 |
| sourceTitle | `string | null` | 可省略 |
| sourceOrg | `string | null` | 可省略 |
| sourceUrl | `string | null` | 可省略 |
| sourcePublishedAt | `string | null` | 可省略 |
| collectedAt | `string` | 可省略 |
| lastVerifiedAt | `string` | 可省略 |
| completeness | `Completeness` | 可省略 |
| regStart | `string | null` | 可省略 |
| regEnd | `string | null` | 可省略 |
| contestStart | `string | null` | 可省略 |
| contestEnd | `string | null` | 可省略 |
| publicityTime | `string | null` | 可省略 |
| contestRequirement | `string | null` | 可省略 |
| reviewRules | `string | null` | 可省略 |
| awardSetting | `string | null` | 可省略 |
| material | `string | null` | 可省略 |
| entryMethod | `string` | 可省略 |
| contact | `string | null` | 可省略 |
| description | `string | null` | 可省略 |
| creditApplicable | `CreditApplicable` | 可省略 |
| creditBasis | `string | null` | 可省略 |
| creditNote | `string | null` | 可省略 |
| organizationId | `string` | 可省略 |
| attachmentIds | `string[]` | 可省略 |
| changeType | `ChangeType` | 必需 |
| reason | `string` | 必需 |

## UpdateDraftRequest

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| name | `string` | 可省略 |
| category | `Category` | 可省略 |
| scopeType | `ScopeType` | 可省略 |
| edition | `string | null` | 可省略 |
| level | `ContestLevel | null` | 可省略 |
| applicableScope | `ApplicableScope` | 可省略 |
| entryType | `EntryType` | 可省略 |
| sourceTitle | `string | null` | 可省略 |
| sourceOrg | `string | null` | 可省略 |
| sourceUrl | `string | null` | 可省略 |
| sourcePublishedAt | `string | null` | 可省略 |
| collectedAt | `string` | 可省略 |
| lastVerifiedAt | `string` | 可省略 |
| completeness | `Completeness` | 可省略 |
| regStart | `string | null` | 可省略 |
| regEnd | `string | null` | 可省略 |
| contestStart | `string | null` | 可省略 |
| contestEnd | `string | null` | 可省略 |
| publicityTime | `string | null` | 可省略 |
| contestRequirement | `string | null` | 可省略 |
| reviewRules | `string | null` | 可省略 |
| awardSetting | `string | null` | 可省略 |
| material | `string | null` | 可省略 |
| entryMethod | `string` | 可省略 |
| contact | `string | null` | 可省略 |
| description | `string | null` | 可省略 |
| creditApplicable | `CreditApplicable` | 可省略 |
| creditBasis | `string | null` | 可省略 |
| creditNote | `string | null` | 可省略 |
| organizationId | `string` | 可省略 |
| attachmentIds | `string[]` | 可省略 |
| changeType | `ChangeType` | 必需 |
| reason | `string` | 必需 |

## DraftResult

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| contestId | `string` | 必需 |
| versionId | `string` | 必需 |
| versionNo | `number` | 必需 |
| status | `VersionStatus` | 必需 |
| etag | `string` | 必需 |

## SubmitReviewResult

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| versionId | `string` | 必需 |
| status | `VersionStatus` | 必需 |

## DeriveVersionRequest

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| changeType | `ChangeType` | 必需 |
| reason | `string` | 必需 |

## ApproveReviewRequest

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| versionId | `string` | 必需 |
| etag | `string` | 必需 |

## RejectReviewRequest

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| versionId | `string` | 必需 |
| etag | `string` | 必需 |
| rejectReason | `string` | 必需 |

## ApproveReviewResult

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| publishedVersionId | `string` | 必需 |
| contestStatus | `ContestStatus` | 必需 |
| previousVersionId | `string | null` | 必需 |
| previousIsCurrent | `boolean` | 必需 |

## RejectReviewResult

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| versionId | `string` | 必需 |
| status | `VersionStatus` | 必需 |
| publishedVersionId | `string | null` | 必需 |

## ConcurrencyHeaders

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| ifMatch | `string` | 必需 |

## CreatePublicityRequest

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| contestId | `string` | 必需 |
| type | `PublicityType` | 必需 |
| content | `string | PublicityContent` | 必需 |
| reason | `string` | 必需 |

## CreateFeedbackRequest

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| contestId | `string | null` | 必需 |
| type | `string` | 必需 |
| desc | `string` | 必需 |

## CreateFavoriteRequest

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| contestId | `string` | 必需 |

## RegisterDeviceRequest

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| deviceToken | `string` | 必需 |
| platform | `string` | 必需 |

## FieldError

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| field | `string` | 必需 |
| message | `string` | 必需 |

## FieldDifference

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| field | `string` | 必需 |
| oldValue | `string | null` | 必需 |
| newValue | `string | null` | 必需 |

## ImportDuplicate

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| row | `number` | 必需 |
| contestId | `string` | 必需 |
| name | `string` | 必需 |
| differences | `FieldDifference[]` | 必需 |

## ImportTask

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| taskId | `string` | 必需 |
| ownerId | `string` | 必需 |
| schoolId | `string` | 必需 |
| state | `ImportState` | 必需 |
| rowCount | `number` | 必需 |
| contentFrozen | `boolean` | 必需 |
| errors | `ImportError[]` | 必需 |
| createdAt | `string` | 必需 |
| submittedAt | `string | null` | 必需 |

## ImportUploadResult

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| taskId | `string` | 必需 |
| rows | `number` | 必需 |
| errors | `ImportError[]` | 必需 |

## ImportPreviewResult

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| taskId | `string` | 必需 |
| add | `number` | 必需 |
| skip | `number` | 必需 |
| duplicates | `ImportDuplicate[]` | 必需 |

## ImportSubmitResult

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| taskId | `string` | 必需 |
| imported | `number` | 必需 |

## ImportReportRow

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| row | `number` | 必需 |
| contestId | `string | null` | 必需 |
| success | `boolean` | 必需 |
| message | `string` | 必需 |

## ImportReport

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| taskId | `string` | 必需 |
| rows | `ImportReportRow[]` | 必需 |

## ApiErrorData

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| fieldErrors | `Record<string, string>` | 可省略 |
| currentEtag | `string` | 可省略 |
| differences | `FieldDifference[]` | 可省略 |

## ContestPage

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| list | `ContestSummary[]` | 必需 |
| total | `number` | 必需 |
| page | `number` | 必需 |
| pageSize | `number` | 必需 |

## VersionPage

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| list | `ContestVersion[]` | 必需 |
| total | `number` | 必需 |
| page | `number` | 必需 |
| pageSize | `number` | 必需 |

## FeedbackPage

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| list | `Feedback[]` | 必需 |
| total | `number` | 必需 |
| page | `number` | 必需 |
| pageSize | `number` | 必需 |

## NotificationPage

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| list | `Notification[]` | 必需 |
| total | `number` | 必需 |
| page | `number` | 必需 |
| pageSize | `number` | 必需 |

## PageQuery

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| page | `number` | 可省略 |
| pageSize | `number` | 可省略 |

## ManagedContestPage

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| list | `ManagedContest[]` | 必需 |
| total | `number` | 必需 |
| page | `number` | 必需 |
| pageSize | `number` | 必需 |

## PendingReviewItem

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| contestId | `string` | 必需 |
| name | `string` | 必需 |
| organizationName | `string` | 必需 |
| versionId | `string` | 必需 |
| etag | `string` | 必需 |
| submittedAt | `string` | 必需 |
| incompleteFields | `string[]` | 必需 |

## PendingReviewPage

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| list | `PendingReviewItem[]` | 必需 |
| total | `number` | 必需 |
| page | `number` | 必需 |
| pageSize | `number` | 必需 |

## ReasonRequest

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| reason | `string` | 必需 |

## RejectReasonRequest

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| rejectReason | `string` | 必需 |

## UpdatePublicityRequest

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| content | `string | PublicityContent` | 必需 |
| reason | `string` | 必需 |

## FavoritePage

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| list | `Favorite[]` | 必需 |
| total | `number` | 必需 |
| page | `number` | 必需 |
| pageSize | `number` | 必需 |

## FeedbackFilter

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| status | `FeedbackStatus` | 可省略 |
| page | `number` | 可省略 |
| pageSize | `number` | 可省略 |

## HandleFeedbackRequest

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| status | `FeedbackStatus` | 必需 |
| note | `string` | 必需 |

## NotificationFilter

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| type | `NotificationType` | 可省略 |
| page | `number` | 可省略 |
| pageSize | `number` | 可省略 |

## UpdateNotificationSettings

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| subscribedCategories | `Category[]` | 必需 |
| enabledTypes | `NotificationType[]` | 必需 |
| pushEnabled | `boolean` | 必需 |

## UploadFile

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| name | `string` | 必需 |
| mimeType | `string` | 必需 |
| bytes | `ArrayBuffer` | 必需 |

## FileResource

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| name | `string` | 必需 |
| mimeType | `string` | 必需 |
| bytes | `ArrayBuffer` | 必需 |

## TakedownRequest

| 字段 | 类型 | 键是否必需 |
|---|---|---|
| reason | `string` | 必需 |
| scope | `TakedownScope` | 必需 |
