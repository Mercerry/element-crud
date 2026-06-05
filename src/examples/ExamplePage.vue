<template>
  <ElementCrud
    title="用户管理"
    description="使用本地 mock 数据模拟真实 CRUD，分页和搜索参数会传入 request。"
    entity-name="用户"
    :columns="columns"
    :form-schemas="formSchemas"
    :request="queryUsers"
    :create="createUser"
    :update="updateUser"
    :remove="removeUser"
    :default-page-size="10"
    show-selection
    @action="handleTableAction"
  >
    <template #submitBefore="{ model }">
      <el-tag type="info">关键词：{{ model.username || '全部' }}</el-tag>
    </template>

    <!-- 插槽模板示例：使用 cell-{prop} 覆盖 columns 的默认渲染。 -->
    <template #cell-deptId="{ row }">
      {{ formatDeptCell(row) }}
    </template>

    <template #cell-status="{ row }">
      <el-tag :type="row.status === 'enabled' ? 'success' : 'danger'">
        {{ formatStatusCell(row) }}
      </el-tag>
    </template>

    <template #ACTIONS="{ row, ElButtonTSX, openEdit, removeRow, emitAction }">
      <component :is="ElButtonTSX" link type="primary" @click="openEdit(row)">编辑</component>
      <component :is="ElButtonTSX" link type="danger" @click="removeRow(row)">删除</component>
      <component :is="ElButtonTSX" link @click="emitAction('detail', { id: row.id })">详情</component>
    </template>

    <template #toolbar-after>
      <el-button @click="openStandaloneDialog">独立弹窗表单</el-button>
    </template>
  </ElementCrud>

  <SchemaFormDialog
    v-model="standaloneVisible"
    title="独立弹窗表单示例"
    :schemas="formSchemas"
    :initial-values="standaloneInitialValues"
    @submit="handleStandaloneSubmit"
  >
    <template #dialogBefore>
      <el-alert title="这是一个可独立使用的弹窗表单。" type="info" :closable="false" />
    </template>
  </SchemaFormDialog>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { SchemaFormDialog } from '@/components/element-crud';
import { columns, formatDeptCell, formatStatusCell } from './columns';
import { formSchemas } from './formSchemas';
import {
  createUser,
  queryUsers,
  removeUser,
  updateUser,
  type MockUser,
} from './mockUserService';

const standaloneVisible = ref(false);
const standaloneInitialValues = reactive<Partial<MockUser>>({
  status: 'enabled',
  role: 'operator',
  deptId: 1,
  profileProgress: 80,
});

function openStandaloneDialog() {
  standaloneVisible.value = true;
}

function handleTableAction(actionName: string, row: MockUser, payload?: unknown) {
  if (actionName !== 'detail') {
    return;
  }

  ElMessage.info(`查看详情: ${row.username} (${JSON.stringify(payload)})`);
}

async function handleStandaloneSubmit(
  values: Partial<MockUser>,
  done: (shouldClose?: boolean) => void,
) {
  try {
    await createUser(values);
    done(true);
    ElMessage.success('独立弹窗表单提交成功');
  } catch (error) {
    done(false);
    throw error;
  }
}
</script>
