<script setup lang="ts">
import { computed } from 'vue';
import type { FieldReview,ReviewMode } from '../services/ImportReviewService';
import { optionsFor,isDate,setReviewMode,setCandidate } from '../services/ImportReviewService';
import type { ImportEvidence } from '../models/contracts';
const props=defineProps<{row:FieldReview;evidence:ImportEvidence[];disabled?:boolean}>();
const emit=defineEmits<{changed:[];evidence:[ids:string[]]}>();
const options=computed(()=>optionsFor(props.row.field));
const candidate=computed(()=>props.row.candidates.find(c=>c.candidateId===props.row.candidateId));
const needsNote=computed(()=>props.row.mode!=='unknown');
function mode(value:ReviewMode){setReviewMode(props.row,value);emit('changed');}
function choose(value:string){setCandidate(props.row,value);emit('changed');}
function edit(){props.row.verified=false;emit('changed');}
</script>
<template>
 <article class="field-review" :class="{'verified':row.verified}">
  <div class="field-heading"><strong>{{row.label}}</strong><el-tag v-if="isDate(row.field)" size="small" type="warning">日期须逐项核对</el-tag><el-tag v-if="row.candidates.length>1" size="small" type="warning">{{row.candidates.length}} 个候选</el-tag><el-checkbox v-model="row.verified" :disabled="disabled" @change="emit('changed')">已核对</el-checkbox></div>
  <p v-if="row.existingValue!==null" class="existing">当前公开内容：{{row.existingValue}}</p>
  <div class="field-controls">
   <el-select :model-value="row.mode" :disabled="disabled" aria-label="字段确认方式" @change="mode"><el-option label="采用识别候选" value="candidate" :disabled="!row.candidates.some(c=>c.value!==null)"/><el-option label="人工填写 / 保留原值" value="manual"/><el-option label="保留未知（留空）" value="unknown"/></el-select>
   <el-select v-if="row.mode==='candidate'" :model-value="row.candidateId" :disabled="disabled" placeholder="选择原文候选" aria-label="识别候选" @change="choose"><el-option v-for="c in row.candidates" :key="c.candidateId" :value="c.candidateId" :label="(c.value||'无法确定')+' · '+c.rawText.slice(0,48)" :disabled="c.value===null"/></el-select>
  </div>
  <template v-if="row.mode!=='unknown'">
   <el-select v-if="options&&row.mode==='manual'" v-model="row.value" :disabled="disabled" :aria-label="row.label" @change="edit"><el-option v-for="value in options" :key="value" :label="value==='面向河大学生的校外赛事'?'校外赛事（兼容原有枚举）':value" :value="value"/></el-select>
   <el-input v-else v-model="row.value" :readonly="row.mode==='candidate'" :disabled="disabled" :aria-label="row.label" :type="isDate(row.field)?'text':'textarea'" :autosize="{minRows:1,maxRows:5}" :placeholder="isDate(row.field)?'YYYY-MM-DD 或 YYYY-MM-DDTHH:mm:ss+08:00':'填写经核对的内容'" @input="edit"/>
   <p v-if="isDate(row.field)" class="tip">仅日期不补时刻；精确时刻统一为北京时间并保留 +08:00。初赛和作品截止请放在独立阶段。</p>
   <el-input v-model="row.note" :disabled="disabled" :aria-label="row.label+'核对说明'" placeholder="核对说明：依据哪页、年份 / 时区如何确认；原值需说明保留依据" maxlength="2000" :required="needsNote" @input="emit('changed')"/>
  </template>
  <p v-else class="tip">该字段将明确留空。若原版本有值，留空会删除该值，请确认。</p>
  <div v-if="candidate" class="candidate-source"><span>识别片段：{{candidate.rawText}}</span><span>置信度：{{candidate.confidence===null?'未知':Math.round(candidate.confidence*100)+'%'}}{{candidate.datePrecision?' · '+candidate.datePrecision:''}}{{candidate.sourceTimeZone?' · 原时区 '+candidate.sourceTimeZone:''}}</span></div>
  <el-select v-if="row.mode==='manual'&&evidence.length" v-model="row.evidenceIds" multiple clearable collapse-tags :disabled="disabled" placeholder="可选：关联原文片段" aria-label="关联原文证据" @change="edit"><el-option v-for="e in evidence" :key="e.evidenceId" :value="e.evidenceId" :label="'页 '+e.pageNumber+' · '+e.snippet.slice(0,65)"/></el-select>
  <el-button v-if="row.evidenceIds.length" link type="primary" @click="emit('evidence',row.evidenceIds)">对照关联原文（{{row.evidenceIds.length}}）</el-button>
  <details v-if="row.candidates.length&&row.mode!=='candidate'"><summary>查看识别片段与未采用候选</summary><p v-for="c in row.candidates" :key="c.candidateId" class="source-text">{{c.rawText}}<br/>候选：{{c.value||'未确定具体值'}}{{c.datePrecision?' · '+c.datePrecision:''}}</p></details>
 </article>
</template>
<style scoped>
.field-review{padding:16px;border:1px solid #dbe3ef;border-radius:12px;background:#fff;display:grid;gap:10px}.field-review.verified{border-color:#9acbb1;background:#fbfefc}.field-heading{display:flex;align-items:center;gap:8px;flex-wrap:wrap;color:#172b46}.field-heading .el-checkbox{margin-left:auto}.field-controls{display:grid;grid-template-columns:minmax(160px,1fr) 2fr;gap:10px}.existing,.tip{font-size:12px;line-height:1.6;color:#52657c;margin:0;white-space:pre-wrap;overflow-wrap:anywhere}.existing{border-left:3px solid #a5bdee;padding-left:9px;max-height:120px;overflow:auto}.candidate-source{display:grid;gap:5px;font-size:12px;color:#475569;background:#f1f5f9;border-radius:8px;padding:10px;white-space:pre-wrap;overflow-wrap:anywhere}.source-text{font-size:12px;white-space:pre-wrap;overflow-wrap:anywhere;color:#52657c}summary{font-size:12px;color:#1d4ed8;cursor:pointer}.el-select{width:100%}@media(max-width:700px){.field-controls{grid-template-columns:1fr}}
</style>
