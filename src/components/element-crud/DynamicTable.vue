<template>
  <section class="dynamic-table">
    <div v-if="search" class="dynamic-table__search">
      <slot name="searchBefore" :model="searchModel" :reload="reload" />

      <SchemaFormBase
        v-model="searchModel"
        :schemas="searchSchemas"
        inline
        :collapsible="searchCollapsible"
        :collapsed-item-count="searchCollapsedItemCount"
        :default-collapsed="searchDefaultCollapsed"
        :label-width="searchLabelWidth"
        @submit="handleSearch"
        @reset="handleSearchReset"
      >
        <template
          v-for="slotName in forwardedSearchSlotNames"
          #[slotName]="slotData"
          :key="slotName"
        >
          <slot :name="slotName" v-bind="slotData || {}" />
        </template>
      </SchemaFormBase>

      <slot name="searchAfter" :model="searchModel" :reload="reload" />
    </div>

    <div class="dynamic-table__panel">
      <div class="dynamic-table__toolbar">
        <div>
          <h2 v-if="title">{{ title }}</h2>
          <p v-if="description">{{ description }}</p>
        </div>
        <div class="dynamic-table__toolbar-actions">
          <slot name="toolbar-before" />
          <el-button
            v-if="showCreate"
            :icon="Plus"
            type="primary"
            @click="openCreate"
            >新增</el-button
          >
          <el-button :icon="Refresh" @click="reload">刷新</el-button>
          <slot name="toolbar-after" />
        </div>
      </div>

      <div class="dynamic-table__table-wrap">
        <slot name="tableBefore" :rows="tableData" :reload="reload" />

        <el-table
          v-loading="loading"
          :data="tableData"
          :row-key="rowKey"
          border
          stripe
          :style="tableStyle"
          v-bind="resolvedTableProps"
        >
          <template #empty>
            <slot name="tableEmpty" :reload="reload">
              <el-empty description="暂无数据" />
            </slot>
          </template>

          <template #append>
            <slot name="tableAppend" :rows="tableData" :reload="reload" />
          </template>

          <el-table-column
            v-if="showSelection"
            type="selection"
            width="48"
            fixed="left"
          />
          <el-table-column
            v-if="showIndex"
            type="index"
            label="#"
            width="64"
            fixed="left"
          />

          <el-table-column
            v-for="column in tableColumns"
            :key="String(column.prop)"
            :prop="String(column.prop)"
            :label="column.label"
            :width="column.width"
            :min-width="column.minWidth"
            :fixed="column.fixed"
            :align="column.align"
            :sortable="column.sortable"
            show-overflow-tooltip
          >
            <template #default="scope">
              <slot
                :name="`cell-${String(column.prop)}`"
                :row="scope.row"
                :value="getCellValue(column, scope.row)"
                :index="scope.$index"
              >
                <RenderNode
                  v-if="column.render"
                  :vnode="renderCell(column, scope.row, scope.$index)"
                />
                <template v-else>{{
                  formatCell(column, scope.row, scope.$index)
                }}</template>
              </slot>
            </template>
          </el-table-column>

          <el-table-column
            v-if="showActions"
            label="ACTIONS"
            width="198"
            fixed="right"
            align="center"
          >
            <template #default="scope">
              <slot
                name="ACTIONS"
                :row="scope.row"
                :index="scope.$index"
                :openEdit="openEdit"
                :removeRow="removeRow"
                :emitAction="
                  (actionName: string, payload?: unknown) =>
                    emitAction(actionName, scope.row, payload)
                "
              >
                <ElButton
                  link
                  type="primary"
                  :icon="Edit"
                  @click="openEdit(scope.row)"
                  >编辑</ElButton
                >
                <ElButton
                  link
                  type="danger"
                  :icon="Delete"
                  @click="removeRow(scope.row)"
                  >删除</ElButton>
              </slot>
            </template>
          </el-table-column>
        </el-table>

        <slot name="tableAfter" :rows="tableData" :reload="reload" />
      </div>

      <div v-if="pagination" class="dynamic-table__pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="pageSizes"
          :total="total"
          @change="reload"
        />
      </div>
    </div>

    <SchemaFormDialog
      v-model="dialogVisible"
      :title="
        dialogMode === 'create' ? `新增${entityName}` : `编辑${entityName}`
      "
      :schemas="innerFormSchemas"
      :initial-values="dialogInitialValues"
      :width="dialogWidth"
      :label-width="formLabelWidth"
      @submit="submitDialog"
    >
      <template
        v-for="slotName in forwardedDialogSlotNames"
        #[slotName]="slotData"
        :key="slotName"
      >
        <slot :name="`dialog-${slotName}`" v-bind="slotData || {}" />
      </template>
    </SchemaFormDialog>
  </section>
</template>

<script setup lang="ts" generic="T extends CrudRecord">
import { computed, defineComponent, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox, ElButton } from "element-plus";
import { Delete, Edit, Plus, Refresh } from "@element-plus/icons-vue";
import SchemaFormBase from "./SchemaFormBase.vue";
import SchemaFormDialog from "./SchemaFormDialog.vue";
import type {
  CrudColumn,
  CrudCreate,
  CrudFormSchema,
  CrudRecord,
  CrudRemove,
  CrudRequest,
  CrudUpdate,
} from "./types";

defineOptions({
  name: "DynamicTable",
});

const RenderNode = defineComponent({
  name: "RenderNode",
  props: {
    vnode: {
      type: [Object, String, Number],
      required: false,
    },
  },
  setup(renderProps) {
    return () => renderProps.vnode as any;
  },
});

const props = withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    entityName?: string;
    rowKey?: string;
    columns: CrudColumn<T>[];
    formSchemas?: CrudFormSchema<T>[];
    request?: CrudRequest<T>;
    create?: CrudCreate<T>;
    update?: CrudUpdate<T>;
    remove?: CrudRemove<T>;
    search?: boolean;
    pagination?: boolean;
    pageSizes?: number[];
    defaultPageSize?: number;
    immediate?: boolean;
    showCreate?: boolean;
    showActions?: boolean;
    showSelection?: boolean;
    showIndex?: boolean;
    dialogWidth?: string | number;
    searchLabelWidth?: string | number;
    formLabelWidth?: string | number;
    searchCollapsible?: boolean;
    searchDefaultCollapsed?: boolean;
    searchCollapsedItemCount?: number;
    tableProps?: Record<string, any>;
  }>(),
  {
    entityName: "数据",
    rowKey: "id",
    search: true,
    pagination: true,
    pageSizes: () => [10, 20, 50, 100],
    defaultPageSize: 10,
    immediate: true,
    showCreate: true,
    showActions: true,
    showSelection: false,
    showIndex: true,
    dialogWidth: 720,
    searchLabelWidth: 88,
    formLabelWidth: 96,
    searchCollapsible: true,
    searchDefaultCollapsed: true,
    searchCollapsedItemCount: 3,
    tableProps: () => ({}),
  },
);

const emit = defineEmits<{
  loaded: [rows: T[], total: number];
  created: [values: Partial<T>];
  updated: [values: Partial<T>, row: T];
  removed: [row: T];
  action: [actionName: string, row: T, payload?: unknown];
}>();

const loading = ref(false);
const tableData = ref<T[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(props.defaultPageSize);
const dialogVisible = ref(false);
const dialogMode = ref<"create" | "edit">("create");
const editingRow = ref<T>();
const searchModel = reactive<CrudRecord>({});

const forwardedSearchSlotNames = [
  "formBefore",
  "fieldsBefore",
  "fieldsAfter",
  "actions",
  "actionsBefore",
  "advanceBefore",
  "submitBefore",
  "resetBefore",
  "actionsAfter",
  "formAfter",
] as const;

const forwardedDialogSlotNames = [
  "header",
  "dialogBefore",
  "formBefore",
  "fieldsBefore",
  "fieldsAfter",
  "actions",
  "actionsBefore",
  "advanceBefore",
  "submitBefore",
  "resetBefore",
  "actionsAfter",
  "formAfter",
  "dialogAfter",
  "footer",
] as const;

const tableColumns = computed(() =>
  props.columns.filter((column) => !column.hideInTable),
);
const resolvedTableProps = computed(() => props.tableProps);
const tableStyle = computed(() => ({
  width: "100%",
  minWidth: `${tableMinWidth.value}px`,
}));
const tableMinWidth = computed(() => {
  const selectionWidth = props.showSelection ? 48 : 0;
  const indexWidth = props.showIndex ? 64 : 0;
  const actionWidth = props.showActions ? 198 : 0;
  const columnWidth = tableColumns.value.reduce((totalWidth, column) => {
    const width = Number(column.width || column.minWidth || 140);
    return totalWidth + (Number.isFinite(width) ? width : 140);
  }, 0);

  // 给表格一个稳定的横向宽度，避免列较多时被容器强行压窄。
  return Math.max(selectionWidth + indexWidth + actionWidth + columnWidth, 960);
});

const searchSchemas = computed<CrudFormSchema<T>[]>(() =>
  props.columns
    .filter((column) => !column.hideInSearch && column.search !== false)
    .map((column) => ({
      field: column.prop,
      label: column.label,
      component: "Input",
      ...(typeof column.search === "object" ? column.search : {}),
    })),
);

const innerFormSchemas = computed<CrudFormSchema<T>[]>(() => {
  if (props.formSchemas?.length) {
    return props.formSchemas;
  }

  return props.columns
    .filter((column) => column.form !== false && !column.hideInTable)
    .map((column) => ({
      field: column.prop,
      label: column.label,
      component: "Input",
      ...(typeof column.form === "object" ? column.form : {}),
    }));
});

const dialogInitialValues = computed(() =>
  dialogMode.value === "edit" ? editingRow.value || {} : {},
);

initModel(searchModel, searchSchemas.value);

onMounted(() => {
  if (props.immediate) {
    reload();
  }
});

function initModel(model: CrudRecord, schemas: CrudFormSchema[]) {
  schemas.forEach((schema) => {
    model[String(schema.field)] = schema.defaultValue ?? undefined;
  });
}

function resetObject(target: CrudRecord, next: CrudRecord = {}) {
  Object.keys(target).forEach((key) => delete target[key]);
  Object.assign(target, next);
}

function formatCell(column: CrudColumn<T>, row: T, index: number) {
  const value = getCellValue(column, row);

  if (column.formatter) {
    return column.formatter(row, value, index);
  }

  return value ?? "-";
}

function renderCell(column: CrudColumn<T>, row: T, index: number) {
  return column.render?.({
    row,
    value: getCellValue(column, row),
    index,
  });
}

function getCellValue(column: CrudColumn<T>, row: T) {
  return row[String(column.prop)];
}

function emitAction(actionName: string, row: T, payload?: unknown) {
  emit("action", actionName, row, payload);
}

async function reload() {
  if (!props.request) {
    tableData.value = [];
    total.value = 0;
    return;
  }

  loading.value = true;
  try {
    // 请求参数保留 page/pageSize，后续替换真实接口时不用改组件调用方式。
    const result = await props.request({
      page: page.value,
      pageSize: pageSize.value,
      ...searchModel,
    });
    tableData.value = result.list;
    total.value = result.total;
    emit("loaded", result.list, result.total);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  page.value = 1;
  reload();
}

function handleSearchReset(value: CrudRecord) {
  resetObject(searchModel, value);
  page.value = 1;
  reload();
}

function openCreate() {
  dialogMode.value = "create";
  editingRow.value = undefined;
  dialogVisible.value = true;
}

function openEdit(row: T) {
  dialogMode.value = "edit";
  editingRow.value = row;
  dialogVisible.value = true;
}

async function submitDialog(
  values: Partial<T>,
  done: (shouldClose?: boolean) => void,
) {
  let shouldClose = false;

  try {
    if (dialogMode.value === "create") {
      await props.create?.(values);
      emit("created", values);
      ElMessage.success("新增成功");
      shouldClose = true;
    } else if (editingRow.value) {
      await props.update?.(values, editingRow.value);
      emit("updated", values, editingRow.value);
      ElMessage.success("编辑成功");
      shouldClose = true;
    }

    done(shouldClose);
    await reload();
  } finally {
    if (!shouldClose) {
      done(false);
    }
  }
}

async function removeRow(row: T) {
  await ElMessageBox.confirm("确定要删除这条数据吗？", "删除确认", {
    type: "warning",
    confirmButtonText: "删除",
    cancelButtonText: "取消",
  });

  await props.remove?.(row);
  emit("removed", row);
  ElMessage.success("删除成功");
  await reload();
}

defineExpose({
  reload,
  openCreate,
  openEdit,
  getSearchModel: () => ({ ...searchModel }),
});
</script>

<style lang="less" scoped>
.dynamic-table {
  display: grid;
  gap: 14px;
}

.dynamic-table__search,
.dynamic-table__panel {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.dynamic-table__search {
  padding: 18px 18px 0;
}

.dynamic-table__panel {
  padding: 18px;
  min-width: 0;
}

.dynamic-table__toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;

  h2 {
    margin: 0;
    font-size: 18px;
    letter-spacing: 0;
  }

  p {
    margin: 6px 0 0;
    color: #64748b;
    font-size: 13px;
  }
}

.dynamic-table__toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.dynamic-table__table-wrap {
  min-width: 0;
  overflow-x: auto;
}

:deep(.el-table) {
  min-width: 960px;
}

.dynamic-table__pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

@media (max-width: 760px) {
  .dynamic-table__toolbar {
    display: block;
  }

  .dynamic-table__toolbar-actions {
    justify-content: flex-start;
    margin-top: 12px;
  }
}
</style>
