<script setup lang="ts">
import { ref } from 'vue';
import { adminServices } from '../services/AdminServices';
const status = ref('已接入 HTTP 后端，数据保存于 SQLite。');
async function checkDataSource(): Promise<void> {
  status.value = '正在读取…';
  try {
    const result = await adminServices.getContests().listPublished({ page: 1, pageSize: 20 });
    status.value = `读取成功，共 ${result.total} 条公开赛事。`;
  } catch (error) {
    status.value = error instanceof Error ? error.message : '读取失败，请重试';
  }
}
</script>
<template>
  <el-container class="shell">
    <el-aside width="220px"><h1>竞知</h1><p>管理端 / 主办方</p><el-menu default-active="0"><el-menu-item index="0">项目就绪</el-menu-item><el-menu-item index="1" disabled>赛事管理（待开发）</el-menu-item><el-menu-item index="2" disabled>审核管理（待开发）</el-menu-item><el-menu-item index="3" disabled>操作日志（待开发）</el-menu-item></el-menu></el-aside>
    <el-main><el-card><el-tag>第 4 步 · 后端数据与实现</el-tag><h2>管理端环境已就绪</h2><p>Vue 3 + TypeScript + Vite + Element Plus</p><el-alert title="使用后端项目账号登录，数据库保留已提交的数据。" type="info" :closable="false"/><p>{{ status }}</p><el-button type="primary" @click="checkDataSource">检查数据源</el-button></el-card></el-main>
  </el-container>
</template>
