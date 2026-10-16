<script setup lang="ts">
import { ref,watch,onBeforeUnmount } from 'vue';
import type { ImportFile,ImportFilePage,ImportEvidence } from '../models/contracts';
import { adminServices } from '../services/AdminServices';
import { RepositoryError } from '../repository/RepositoryError';
const props=defineProps<{files:ImportFile[];evidence:ImportEvidence[];schoolId:string;focusEvidenceIds?:string[]}>();
const emit=defineEmits<{'session-expired':[]}>();
const fileId=ref(''),page=ref(1),pages=ref<ImportFilePage[]>([]),busy=ref(false),error=ref(''),blobUrl=ref(''),blobBusy=ref(false);
let generation=0,alive=true,controller:AbortController|null=null;
const selected=()=>props.files.find(f=>f.fileId===fileId.value);
function revoke(){if(blobUrl.value)URL.revokeObjectURL(blobUrl.value);blobUrl.value='';}
function failure(e:unknown){if(e instanceof RepositoryError&&e.code===401)emit('session-expired');return e instanceof Error?e.message:'原材料读取失败';}
async function loadFile(id:string){const g=++generation;controller?.abort();controller=new AbortController();revoke();blobBusy.value=false;pages.value=[];error.value='';busy.value=true;try{const result=await adminServices.getImports().getPages(id);if(!alive||g!==generation)return;pages.value=result;if(page.value>result.length)page.value=1;}catch(e){if(g===generation)error.value=failure(e);}finally{if(g===generation)busy.value=false;}}
async function preview(){const file=selected();if(!file||blobBusy.value)return;const g=generation;const signal=controller?.signal||new AbortController().signal;blobBusy.value=true;error.value='';try{const blob=await adminServices.getImportFiles().download(file,props.schoolId,signal);if(!alive||g!==generation)return;revoke();blobUrl.value=URL.createObjectURL(blob);}catch(e){if(g===generation)error.value=failure(e);}finally{if(g===generation)blobBusy.value=false;}}
async function download(){const g=generation;const file=selected();if(!blobUrl.value)await preview();if(!blobUrl.value||!alive||g!==generation||file!==selected())return;const a=document.createElement('a');a.href=blobUrl.value;a.download=file?.originalName||'原材料';a.click();}
watch(()=>props.files.map(f=>f.fileId).join(','),()=>{if(!props.files.some(f=>f.fileId===fileId.value))fileId.value=props.files[0]?.fileId||'';},{immediate:true});
watch(fileId,id=>{page.value=props.evidence.find(e=>e.fileId===id&&props.focusEvidenceIds?.includes(e.evidenceId))?.pageNumber||1;blobBusy.value=false;if(id)void loadFile(id);},{immediate:true});
watch(()=>props.focusEvidenceIds?.join(','),()=>{const e=props.evidence.find(e=>props.focusEvidenceIds?.includes(e.evidenceId));if(e){if(fileId.value!==e.fileId)fileId.value=e.fileId;page.value=e.pageNumber;}},{immediate:true});
onBeforeUnmount(()=>{alive=false;generation++;controller?.abort();revoke();});
</script>
<template>
 <aside class="source-viewer">
  <div class="source-title"><strong>原材料对照</strong><el-tag size="small">仅管理端可见</el-tag></div>
  <el-select v-model="fileId" placeholder="选择原文件" aria-label="原文件"><el-option v-for="f in files" :key="f.fileId" :label="f.originalName" :value="f.fileId"/></el-select>
  <p v-if="selected()" class="hint">{{selected()?.pageLabel||'原材料页码'}} · {{selected()?.pageCount}} 页 · {{((selected()?.byteSize||0)/1024).toFixed(1)}} KiB</p>
  <el-alert v-if="error" :title="error" type="error" :closable="false"/>
  <div class="source-actions"><el-button :loading="blobBusy" :disabled="!selected()" @click="preview">加载原件预览</el-button><el-button :loading="blobBusy" :disabled="!selected()" @click="download">下载原文件</el-button><el-button :disabled="busy||!fileId" @click="loadFile(fileId)">重读文字</el-button></div>
  <template v-if="blobUrl">
   <img v-if="selected()?.detectedMediaType?.startsWith('image/')" :src="blobUrl" class="original-image" alt="上传原图，请对照文字和日期"/>
   <iframe v-else-if="selected()?.detectedMediaType==='application/pdf'" :src="blobUrl" sandbox="" title="上传PDF原件预览" class="original-pdf"/>
   <p v-else class="hint">Word原件请下载查看排版；下方为规范化文本页。</p>
   <p v-if="selected()?.detectedMediaType==='application/pdf'" class="hint">浏览器若限制PDF预览，请下载原文件核对。文字层和扫描内容可能不同。</p>
  </template>
  <el-select v-if="pages.length" v-model="page" aria-label="原文页码"><el-option v-for="p in pages" :key="p.pageNumber" :value="p.pageNumber" :label="'第 '+p.pageNumber+' 页'"/></el-select>
  <pre v-loading="busy" class="page-text">{{pages.find(p=>p.pageNumber===page)?.text||'此页没有可读取文字层，请查看原图或下载原文件。'}}</pre>
  <section v-if="evidence.some(e=>e.fileId===fileId&&e.pageNumber===page)" class="evidence-section"><h4>该页识别片段</h4><article v-for="e in evidence.filter(e=>e.fileId===fileId&&e.pageNumber===page)" :key="e.evidenceId" :class="{'focused':focusEvidenceIds?.includes(e.evidenceId)}"><span>{{e.textOrigin||'识别片段（待核对）'}}</span><pre>{{e.snippet}}</pre></article></section>
 </aside>
</template>
<style scoped>
.source-viewer{display:grid;gap:12px;padding:18px;border:1px solid #dbe3ef;border-radius:14px;background:#fff;min-width:0}.source-title,.source-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.source-title{justify-content:space-between;color:#172b46}.source-actions .el-button+.el-button{margin-left:0}.hint{font-size:12px;color:#52657c;line-height:1.7;margin:0}.page-text{white-space:pre-wrap;overflow-wrap:anywhere;font-family:inherit;line-height:1.8;font-size:13px;max-height:440px;overflow:auto;padding:14px;background:#f4f7fb;border-radius:8px;min-height:100px}.original-image{max-width:100%;height:auto;max-height:600px;object-fit:contain;background:#f4f7fb}.original-pdf{width:100%;height:500px;border:1px solid #dbe3ef}.evidence-section h4{font-size:13px;margin:8px 0}.evidence-section article{padding:10px;margin:8px 0;border:1px solid #e2e8f0;border-radius:8px}.evidence-section article.focused{border-color:#1d4ed8;background:#eff6ff}.evidence-section span{font-size:11px;color:#52657c}.evidence-section pre{white-space:pre-wrap;overflow-wrap:anywhere;font-family:inherit;font-size:12px;margin:6px 0}.el-select{width:100%}
</style>
