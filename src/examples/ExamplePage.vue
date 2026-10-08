<template>
  <DynamicTable
    ref="tableRef"
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
    <template #submitBefore>
      <el-tag type="info">模板插槽示例</el-tag>
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

    <template #ACTIONS="{ row, openEdit, removeRow, emitAction }">
      <ElButton link type="primary" @click="openEdit(row)">编辑</ElButton>
      <ElButton link type="danger" @click="removeRow(row)">删除</ElButton>
      <ElButton link @click="emitAction('detail', { id: row.id })"
        >详情</ElButton
      >
    </template>

    <template #toolbar-after>
      <ElButton @click="reloadTable">Hook 刷新</ElButton>
      <ElButton @click="() => openStandaloneDialog()">独立弹窗表单</ElButton>
    </template>
  </DynamicTable>

  <el-dialog v-model="detailVisible" title="用户详情" width="760px">
    <DynamicDetail :record="detailRecord" :columns="columns" :column="2" border>
      <template #detail-deptId="{ record }">
        {{ formatDeptCell(record) }}
      </template>

      <template #detail-status="{ record }">
        <el-tag :type="record.status === 'enabled' ? 'success' : 'danger'">
          {{ formatStatusCell(record) }}
        </el-tag>
      </template>

      <template #detail-profileProgress="{ value }">
        <el-progress :percentage="value" :stroke-width="8" />
      </template>
    </DynamicDetail>

    <template #footer>
      <ElButton @click="closeDetailDialog">关闭</ElButton>
    </template>
  </el-dialog>

  <SchemaFormDialog
    v-model="standaloneVisible"
    title="独立弹窗表单示例"
    :schemas="formSchemas"
    :initial-values="standaloneInitialValues"
    @submit="handleStandaloneSubmit"
  >
    <template #dialogBefore>
      <el-alert
        title="这是一个可独立使用的弹窗表单。"
        type="info"
        :closable="false"
      />
    </template>
  </SchemaFormDialog>
</template>

<script setup lang="ts">
import { ElButton, ElMessage } from 'element-plus';
import {
  DynamicDetail,
  DynamicTable,
  SchemaFormDialog,
  useDialog,
  useTable,
} from '@/components/element-crud';
import { columns, formatDeptCell, formatStatusCell } from './columns';
import { formSchemas } from './formSchemas';
import {
  createUser,
  queryUsers,
  removeUser,
  updateUser,
  type MockUser,
} from './mockUserService';

const { tableRef, reload: reloadTable } = useTable<MockUser>();
const {
  visible: detailVisible,
  record: detailRecord,
  openDetail: openDetailDialog,
  close: closeDetailDialog,
} = useDialog<MockUser>();
const {
  visible: standaloneVisible,
  initialValues: standaloneInitialValues,
  openCreate: openStandaloneDialog,
} = useDialog<MockUser>({
  status: 'enabled',
  role: 'operator',
  deptId: 1,
  profileProgress: 80,
});

function handleTableAction(actionName: string, row: MockUser) {
  if (actionName !== 'detail') {
    return;
  }

  openDetailDialog(row);
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
