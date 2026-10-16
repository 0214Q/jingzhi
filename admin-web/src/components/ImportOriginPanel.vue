<script setup lang="ts">
import { ref } from 'vue';
import type { ImportDraftReview } from '../models/contracts';
import ImportSourceViewer from './ImportSourceViewer.vue';
import { fieldLabel } from '../services/ContestDetailService';
defineProps<{review:ImportDraftReview;schoolId:string}>();
const emit=defineEmits<{'session-expired':[]}>();
const focus=ref<string[]>([]),active=ref<string[]>([]);
function showEvidence(ids:string[]){focus.value=ids.slice();if(!active.value.includes('files'))active.value.push('files');}
</script>
<template>
 <section class="origin-panel">
  <el-alert title="此版本来自文件导入。下面是确认时保存的材料与决定；并不代表上传文件已经获得官方认证。" type="info" :closable="false"/>
  <p class="muted">确认人：{{review.link.createdBy}} · {{new Date(review.link.createdAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})}} · 保留私有材料 {{review.files.length}} 份</p>
  <el-collapse v-model="active"><el-collapse-item title="查看原材料与识别片段" name="files"><ImportSourceViewer :files="review.files" :evidence="review.result.evidence" :school-id="schoolId" :focus-evidence-ids="focus" @session-expired="emit('session-expired')"/></el-collapse-item><el-collapse-item title="逐字段确认记录" name="decisions"><el-table :data="review.origin.decisions" max-height="360"><el-table-column label="字段" width="150"><template #default="{row}">{{fieldLabel(row.field)}}</template></el-table-column><el-table-column prop="decision" label="处理方式" width="110"/><el-table-column label="确认值" min-width="170"><template #default="{row}"><span class="text">{{row.value??'保留未知'}}</span></template></el-table-column><el-table-column prop="note" label="核对说明" min-width="180"/><el-table-column label="原文" width="100"><template #default="{row}"><el-button v-if="row.evidenceIds.length" link type="primary" @click="showEvidence(row.evidenceIds)">对照片段</el-button></template></el-table-column></el-table></el-collapse-item><el-collapse-item title="阶段与问题确认记录" name="stages"><el-table :data="review.origin.stageDecisions"><el-table-column prop="stage" label="阶段"/><el-table-column prop="decision" label="处理"/><el-table-column label="时间"><template #default="{row}">{{row.value??'未确定'}}</template></el-table-column><el-table-column prop="note" label="说明"/></el-table><ul><li v-for="issue in review.result.issues" :key="issue.issueId" class="text">{{issue.message}}<br/>处理：{{review.origin.issueResolutions.find(r=>r.issueId===issue.issueId)?.note||'提示项，无须单独说明'}}</li></ul></el-collapse-item></el-collapse>
 </section>
</template>
<style scoped>
.origin-panel{display:grid;gap:12px;padding:16px;background:#f8fbff;border:1px solid #cbdcf4;border-radius:12px;margin:14px 0}.muted{font-size:12px;color:#52657c;margin:0}.text{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px;line-height:1.7}li{margin:10px 0}
</style>
