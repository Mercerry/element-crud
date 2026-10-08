<template>
  <section class="dynamic-table" :class="{ 'dynamic-table--plain': plain }">
    <div v-if="search" class="dynamic-table__search">
      <slot name="searchBefore" :model="searchModel" :reload="reload" />

      <SchemaFormBase
        :model-value="searchModel"
        @update:model-value="(value) => replaceModel(searchModel, value)"
        :schemas="searchSchemas"
        :field-policy="searchFieldPolicy"
        inline
        :collapsible="searchCollapsible"
        :collapsed-item-count="searchCollapsedItemCount"
        :default-collapsed="searchDefaultCollapsed"
        :label-width="searchLabelWidth"
        :submit-on-enter="searchSubmitOnEnter"
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
      <div v-if="showToolbar" class="dynamic-table__toolbar">
        <div>
          <h2 v-if="title">{{ title }}</h2>
          <p v-if="description">{{ description }}</p>
        </div>
        <div class="dynamic-table__toolbar-actions">
          <slot name="toolbar-before" />
          <el-button
            v-if="showCreate && create"
            :icon="Plus"
            type="primary"
            @click="openCreate"
            >{{ locale.create }}</el-button
          >
          <el-button
            v-if="showRefresh"
            :icon="Refresh"
            @click="handlePageChange"
            >{{ locale.refresh }}</el-button
          >
          <slot name="toolbar-after" />
        </div>
      </div>

      <div class="dynamic-table__table-wrap">
        <slot name="tableBefore" :rows="displayRows" :reload="reload" />

        <el-table
          v-loading="loading"
          :ref="captureTable"
          :data="displayRows"
          :row-key="rowKey"
          border
          stripe
          :style="tableStyle"
          v-bind="resolvedTableProps"
          @sort-change="handleSort"
        >
          <template #empty>
            <slot name="tableEmpty" :reload="reload">
              <el-empty :description="locale.empty" />
            </slot>
          </template>

          <template #append>
            <slot name="tableAppend" :rows="displayRows" :reload="reload" />
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
            :type="column.type"
            v-bind="column.columnProps"
            show-overflow-tooltip
          >
            <template v-if="column.headerRender" #header="scope">
              <RenderNode
                :vnode="column.headerRender({ ...scope, index: scope.$index })"
              />
            </template>
            <template
              v-if="!column.type || column.type === 'expand'"
              #default="scope"
            >
              <slot
                v-if="scope.$index >= 0"
                :name="`cell-${String(column.prop)}`"
                :row="scope.row as T"
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
            v-if="hasActions"
            :label="locale.actions"
            :width="actionWidth"
            fixed="right"
            align="center"
          >
            <template #default="scope">
              <slot
                v-if="scope.$index >= 0"
                name="ACTIONS"
                :row="scope.row as T"
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
                  v-if="update && allowed(showEdit, scope.row)"
                  :disabled="allowed(editDisabled, scope.row)"
                  :icon="Edit"
                  @click="openEdit(scope.row)"
                  >{{ locale.edit }}</ElButton
                >
                <ElButton
                  link
                  type="danger"
                  v-if="remove && allowed(showDelete, scope.row)"
                  :disabled="
                    allowed(deleteDisabled, scope.row) ||
                    deleting.has(scope.row as T)
                  "
                  :icon="Delete"
                  @click="removeRow(scope.row)"
                  >{{ locale.remove }}</ElButton
                >
              </slot>
            </template>
          </el-table-column>
        </el-table>

        <slot name="tableAfter" :rows="displayRows" :reload="reload" />
      </div>

      <div v-if="pagination" class="dynamic-table__pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          background
          :layout="paginationLayout"
          :page-sizes="pageSizes"
          :total="request ? total : data.length"
          @size-change="page = 1"
        />
      </div>
    </div>

    <SchemaFormDialog
      v-model="dialogVisible"
      :title="
        dialogMode === 'create'
          ? locale.createTitle(entityName ?? locale.entity)
          : locale.editTitle(entityName ?? locale.entity)
      "
      :schemas="innerFormSchemas"
      :initial-values="dialogInitialValues"
      :width="dialogWidth"
      :label-width="formLabelWidth"
      :submit-on-enter="formSubmitOnEnter"
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
import { replaceModel } from './model';
import { useCrudLocale } from './config';
import {
  computed,
  shallowReactive,
  useSlots,
  defineComponent,
  onMounted,
  onBeforeUnmount,
  reactive,
  ref,
  shallowRef,
  watch,
  nextTick,
} from 'vue';
import {
  ElMessage,
  ElMessageBox,
  ElButton,
  ElTable,
  ElTableColumn,
  ElPagination,
  ElEmpty,
  vLoading,
} from 'element-plus';
import { Delete, Edit, Plus, Refresh } from '@element-plus/icons-vue';
import type { TableInstance } from 'element-plus';
import cloneDeep from 'lodash.clonedeep';
import {
  getField,
  setField,
  removeField,
  withDefaults as fillDefaults,
} from './model';
import SchemaFormBase from './SchemaFormBase.vue';
import SchemaFormDialog from './SchemaFormDialog.vue';
import type {
  CrudColumn,
  CrudCreate,
  CrudFormSchema,
  CrudRecord,
  CrudRemove,
  CrudRequest,
  CrudUpdate,
} from './types';

defineOptions({
  name: 'DynamicTable',
});

const RenderNode = defineComponent({
  name: 'RenderNode',
  props: {
    vnode: {
      type: [Object, String, Number, Array, Boolean] as import('vue').PropType<
        import('vue').VNodeChild
      >,
      required: false,
    },
  },
  setup(renderProps) {
    return () => renderProps.vnode as any;
  },
});

const locale = useCrudLocale();

const props = withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    entityName?: string;
    rowKey?: string | ((row: T) => string);
    data?: T[];
    plain?: boolean;
    showToolbar?: boolean;
    fitContainer?: boolean;
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
    showRefresh?: boolean;
    showEdit?: boolean | ((row: T) => boolean);
    showDelete?: boolean | ((row: T) => boolean);
    editDisabled?: boolean | ((row: T) => boolean);
    deleteDisabled?: boolean | ((row: T) => boolean);
    actionWidth?: string | number;
    paginationLayout?: string;
    remoteSort?: boolean;
    searchFieldPolicy?: 'preserve' | 'remove';
    showActions?: boolean;
    showSelection?: boolean;
    showIndex?: boolean;
    dialogWidth?: string | number;
    searchLabelWidth?: string | number;
    searchSubmitOnEnter?: boolean;
    formSubmitOnEnter?: boolean;
    formLabelWidth?: string | number;
    searchCollapsible?: boolean;
    searchDefaultCollapsed?: boolean;
    searchCollapsedItemCount?: number | 'auto';
    tableProps?: Record<string, any>;
  }>(),
  {
    data: () => [],
    plain: false,
    showToolbar: true,
    fitContainer: false,
    rowKey: 'id',
    search: true,
    pagination: true,
    pageSizes: () => [10, 20, 50, 100],
    defaultPageSize: 10,
    immediate: true,
    showCreate: true,
    showRefresh: true,
    showEdit: true,
    showDelete: true,
    editDisabled: false,
    deleteDisabled: false,
    actionWidth: 198,
    paginationLayout: 'total, sizes, prev, pager, next, jumper',
    remoteSort: false,
    searchFieldPolicy: 'preserve',
    showActions: true,
    showSelection: false,
    showIndex: true,
    dialogWidth: 720,
    searchLabelWidth: 88,
    formLabelWidth: 96,
    searchCollapsible: true,
    searchDefaultCollapsed: true,
    searchCollapsedItemCount: 'auto',
    searchSubmitOnEnter: true,
    formSubmitOnEnter: true,
    tableProps: () => ({}),
  },
);

const emit = defineEmits<{
  loaded: [rows: T[], total: number];
  loadError: [error: unknown];
  operationError: [
    context: {
      action: 'create' | 'update' | 'remove';
      error: unknown;
      row?: T;
    },
  ];
  created: [values: Partial<T>];
  updated: [values: Partial<T>, row: T];
  removed: [row: T];
  action: [actionName: string, row: T, payload?: unknown];
}>();

const slots = useSlots();
const hasActions = computed(
  () =>
    props.showActions && Boolean(slots.ACTIONS || props.update || props.remove),
);
const deleting = shallowReactive(new Set<T>());
const sort = ref<{ sortBy?: string; sortOrder?: 'ascending' | 'descending' }>(
  {},
);
function allowed(value: boolean | ((row: T) => boolean), row: T) {
  return typeof value === 'function' ? value(row) : value;
}
function handleSort(value: {
  prop?: string | null;
  order?: 'ascending' | 'descending' | null;
}) {
  if (!props.remoteSort) return;
  sort.value = value.order
    ? { sortBy: value.prop ?? undefined, sortOrder: value.order }
    : {};
  if (page.value === 1) void handlePageChange();
  else page.value = 1;
}

const loading = ref(false);
const tableData = shallowRef<T[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(props.defaultPageSize);
const dialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const editingRow = ref<T>();
const searchModel = reactive<CrudRecord>({});

const forwardedSearchSlotNames = [
  'formBefore',
  'fieldsBefore',
  'fieldsAfter',
  'actions',
  'actionsBefore',
  'advanceBefore',
  'submitBefore',
  'resetBefore',
  'actionsAfter',
  'formAfter',
] as const;

const forwardedDialogSlotNames = [
  'header',
  'dialogBefore',
  'formBefore',
  'fieldsBefore',
  'fieldsAfter',
  'actions',
  'actionsBefore',
  'advanceBefore',
  'submitBefore',
  'resetBefore',
  'actionsAfter',
  'formAfter',
  'dialogAfter',
  'footer',
] as const;

const tableColumns = computed(() =>
  props.columns.filter((column) => !column.hideInTable),
);
const resolvedTableProps = computed(() => {
  const { ref: _ref, ...rest } = props.tableProps;
  return rest;
});
const tableStyle = computed(() => ({
  width: '100%',
  minWidth: props.fitContainer ? '0' : `${tableMinWidth.value}px`,
}));
const tableMinWidth = computed(() => {
  const selectionWidth = props.showSelection ? 48 : 0;
  const indexWidth = props.showIndex ? 64 : 0;
  const actionWidth = hasActions.value ? Number(props.actionWidth) || 198 : 0;
  const columnWidth = tableColumns.value.reduce((totalWidth, column) => {
    const width = Number(column.width || column.minWidth || 140);
    return totalWidth + (Number.isFinite(width) ? width : 140);
  }, 0);

  // 给表格一个稳定的横向宽度，避免列较多时被容器强行压窄。
  return Math.max(selectionWidth + indexWidth + actionWidth + columnWidth, 960);
});

const searchSchemas = computed<CrudFormSchema<T>[]>(() =>
  props.columns
    .filter(
      (column) =>
        !column.type && !column.hideInSearch && column.search !== false,
    )
    .map((column) => ({
      field: column.prop,
      label: column.label,
      component: 'Input',
      ...(typeof column.search === 'object' ? column.search : {}),
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
      component: 'Input',
      ...(typeof column.form === 'object' ? column.form : {}),
    }));
});

const dialogInitialValues = computed(() =>
  dialogMode.value === 'edit' ? editingRow.value || {} : {},
);

initModel(searchModel, searchSchemas.value);
const appliedSearch = ref(cloneDeep({ ...searchModel }));
watch(searchSchemas, (schemas, previous) => {
  if (props.searchFieldPolicy === 'remove') {
    const fields = new Set(schemas.map((schema) => String(schema.field)));
    previous
      .filter((schema) => !fields.has(String(schema.field)))
      .forEach((schema) => {
        removeField(searchModel, String(schema.field));
        removeField(appliedSearch.value, String(schema.field));
      });
  }
  Object.assign(searchModel, fillDefaults(searchModel, schemas));
});
const displayRows = computed(() =>
  props.request
    ? tableData.value
    : props.pagination
      ? props.data.slice(
          (page.value - 1) * pageSize.value,
          page.value * pageSize.value,
        )
      : props.data,
);
watch(
  () => props.data.length,
  () => {
    if (!props.request)
      page.value = Math.min(
        page.value,
        Math.max(1, Math.ceil(props.data.length / pageSize.value)),
      );
  },
);
const nativeTable = ref<TableInstance>();
function captureTable(instance: unknown) {
  nativeTable.value = instance as TableInstance | undefined;
  const callback = props.tableProps.ref;
  if (typeof callback === 'function') callback(instance);
}
let requestVersion = 0;
onBeforeUnmount(() => {
  requestVersion++;
});
watch(
  () => props.request,
  () => {
    requestVersion++;
    loading.value = false;
    page.value = 1;
    if (props.request && props.immediate) void handlePageChange();
  },
);
// 模板事件消费错误；公开 reload 保留拒绝语义，供业务决定后续处理。
async function handlePageChange() {
  try {
    await reload();
  } catch {
    /* 错误已通过 loadError 交给调用方展示。 */
  }
}

onMounted(() => {
  if (props.immediate) {
    void handlePageChange();
  }
});

function initModel(model: CrudRecord, schemas: CrudFormSchema[]) {
  schemas.forEach((schema) => {
    setField(model, String(schema.field), cloneDeep(schema.defaultValue));
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

  return value ?? '-';
}

function renderCell(column: CrudColumn<T>, row: T, index: number) {
  return column.render?.({
    row,
    value: getCellValue(column, row),
    index,
  });
}

function getCellValue(column: CrudColumn<T>, row: T) {
  return getField(row, String(column.prop));
}

function emitAction(actionName: string, row: T, payload?: unknown) {
  emit('action', actionName, row, payload);
}

async function reload() {
  if (!props.request) {
    await nextTick();
    return;
  }
  const version = ++requestVersion;
  loading.value = true;
  try {
    // 查询条件在点击查询时冻结；分页不会悄悄提交尚未确认的输入。
    const result = await props.request({
      ...cloneDeep(appliedSearch.value),
      ...(props.remoteSort
        ? { sortBy: sort.value.sortBy, sortOrder: sort.value.sortOrder }
        : {}),
      page: page.value,
      pageSize: pageSize.value,
    });
    if (version !== requestVersion) return;
    const lastPage = Math.max(1, Math.ceil(result.total / pageSize.value));
    if (props.pagination && page.value > lastPage) {
      page.value = lastPage;
      await nextTick();
      return;
    }
    tableData.value = result.list;
    total.value = result.total;
    emit('loaded', result.list, result.total);
  } catch (error) {
    if (version !== requestVersion) return;
    emit('loadError', error);
    throw error;
  } finally {
    if (version === requestVersion) loading.value = false;
  }
}
function handleSearch(values: CrudRecord) {
  appliedSearch.value = cloneDeep(values);
  if (page.value === 1) void handlePageChange();
  else page.value = 1;
}
// 页码和页大小同一轮更新只加载一次，查询回到首页也走这一入口。
watch(
  [page, pageSize],
  () => {
    if (props.request) void handlePageChange();
  },
  { flush: 'post' },
);
function handleSearchReset(value: CrudRecord) {
  resetObject(searchModel, value);
  handleSearch(value);
}

function openCreate() {
  if (!props.create) throw new Error('CRUD create handler is not configured');
  dialogMode.value = 'create';
  editingRow.value = undefined;
  dialogVisible.value = true;
}

function openEdit(row: T) {
  if (!props.update) throw new Error('CRUD update handler is not configured');
  if (!allowed(props.showEdit, row) || allowed(props.editDisabled, row)) return;
  dialogMode.value = 'edit';
  editingRow.value = row;
  dialogVisible.value = true;
}

async function submitDialog(
  values: Partial<T>,
  done: (shouldClose?: boolean) => void,
) {
  const mode = dialogMode.value;
  const row = editingRow.value;
  try {
    if (mode === 'create') {
      if (!props.create)
        throw new Error('CRUD create handler is not configured');
      await props.create(values);
      emit('created', values);
      ElMessage.success(locale.value.createSuccess);
    } else {
      if (!props.update || !row)
        throw new Error('CRUD update handler is not configured');
      await props.update(values, row);
      emit('updated', values, row);
      ElMessage.success(locale.value.editSuccess);
    }
    done(true);
  } catch (error) {
    done(false);
    emit('operationError', {
      action: mode === 'create' ? 'create' : 'update',
      error,
      row,
    });
    return;
  }
  // 保存已成功但刷新失败时只报告加载错误，不误报保存失败。
  await handlePageChange();
}

async function removeRow(row: T) {
  if (
    !props.remove ||
    !allowed(props.showDelete, row) ||
    allowed(props.deleteDisabled, row) ||
    deleting.has(row)
  )
    return;
  deleting.add(row);
  try {
    await ElMessageBox.confirm(
      locale.value.removeConfirm,
      locale.value.removeTitle,
      {
        type: 'warning',
        confirmButtonText: locale.value.remove,
        cancelButtonText: locale.value.cancel,
        distinguishCancelAndClose: true,
      },
    );
  } catch (error) {
    deleting.delete(row);
    if (error !== 'cancel' && error !== 'close')
      emit('operationError', { action: 'remove', error, row });
    return;
  }
  try {
    await props.remove(row);
    emit('removed', row);
    ElMessage.success(locale.value.removeSuccess);
  } catch (error) {
    emit('operationError', { action: 'remove', error, row });
    return;
  } finally {
    deleting.delete(row);
  }
  await handlePageChange();
}

defineExpose({
  reload,
  openCreate,
  openEdit,
  getSearchModel: () => cloneDeep({ ...searchModel }),
  getElTableInstance: () => nativeTable.value,
  clearSelection: () => nativeTable.value?.clearSelection(),
  toggleRowSelection: (
    ...args: Parameters<TableInstance['toggleRowSelection']>
  ) => nativeTable.value?.toggleRowSelection(...args),
});
</script>

<style lang="less" scoped>
.dynamic-table {
  display: grid;
  gap: var(--crud-panel-gap, 14px);
}

.dynamic-table__search,
.dynamic-table__panel {
  border: 1px solid
    var(--crud-border-color, var(--el-border-color-light, #e2e8f0));
  border-radius: var(--crud-radius, 8px);
  background: var(--crud-background, var(--el-bg-color, #fff));
}

.dynamic-table__search {
  padding: var(--crud-panel-padding, 18px);
}

.dynamic-table__panel {
  padding: var(--crud-panel-padding, 18px);
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
    color: var(--crud-text-secondary, var(--el-text-color-secondary, #64748b));
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

.dynamic-table--plain {
  display: block;
  .dynamic-table__panel {
    padding: 0;
    border: 0;
    background: transparent;
    box-shadow: none;
  }
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
