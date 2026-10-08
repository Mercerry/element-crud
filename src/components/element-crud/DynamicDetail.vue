<template>
  <div class="dynamic-detail">
    <el-empty v-if="!record" :description="emptyText ?? locale.emptyDetail" />

    <el-descriptions
      v-else
      :title="title"
      :column="column"
      :border="border"
      :label-width="labelWidth"
      v-bind="descriptionProps"
    >
      <el-descriptions-item
        v-for="(schema, index) in visibleSchemas"
        :key="String(schema.field)"
        :label="schema.label"
        :span="schema.span"
        :width="schema.width"
        :label-width="schema.labelWidth ?? labelWidth"
        v-bind="schema.props"
      >
        <slot
          :name="`detail-${String(schema.field)}`"
          :record="record"
          :value="getDetailValue(schema)"
          :index="index"
          :schema="schema"
        >
          <RenderNode
            v-if="schema.render"
            :vnode="renderDetail(schema, index)"
          />
          <template v-else>{{ formatDetail(schema, index) }}</template>
        </slot>
      </el-descriptions-item>
    </el-descriptions>
  </div>
</template>

<script setup lang="ts" generic="T extends CrudRecord">
import { useCrudLocale } from './config';
import { getField } from './model';
import { ElEmpty, ElDescriptions, ElDescriptionsItem } from 'element-plus';
import { computed, defineComponent } from 'vue';
import type { CrudColumn, CrudDetailSchema, CrudRecord } from './types';

defineOptions({
  name: 'DynamicDetail',
});

const RenderNode = defineComponent({
  name: 'RenderNode',
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

const locale = useCrudLocale();

const props = withDefaults(
  defineProps<{
    record?: T | null;
    columns?: CrudColumn<T>[];
    schemas?: CrudDetailSchema<T>[];
    title?: string;
    column?: number;
    border?: boolean;
    labelWidth?: string | number;
    emptyText?: string;
    reuseTableRender?: boolean;
    descriptionProps?: Record<string, any>;
  }>(),
  {
    record: null,
    columns: () => [],
    schemas: () => [],
    column: 2,
    border: true,
    labelWidth: 120,
    reuseTableRender: true,
    descriptionProps: () => ({}),
  },
);

const detailSchemas = computed<CrudDetailSchema<T>[]>(() => {
  if (props.schemas.length) {
    return props.schemas;
  }

  // 不额外写详情配置时，默认复用当前表格列，保证示例和业务页面都能快速打开详情。
  return props.columns
    .filter((column) => !column.hideInTable && column.detail !== false)
    .map((column) => ({
      field: column.prop,
      label: column.label,
      formatter: column.formatter,
      render:
        props.reuseTableRender && column.render
          ? ({ record, value, index }) =>
              column.render!({ row: record, value, index })
          : undefined,
      ...(typeof column.detail === 'object' ? column.detail : {}),
    }));
});

const visibleSchemas = computed(() =>
  detailSchemas.value.filter((schema) => {
    if (typeof schema.hidden === 'function') {
      return !schema.hidden(props.record || {});
    }

    return !schema.hidden;
  }),
);

function getDetailValue(schema: CrudDetailSchema<T>) {
  return getField(props.record, String(schema.field));
}

function formatDetail(schema: CrudDetailSchema<T>, index: number) {
  const value = getDetailValue(schema);

  if (props.record && schema.formatter) {
    return schema.formatter(props.record, value, index);
  }

  return value ?? '-';
}

function renderDetail(schema: CrudDetailSchema<T>, index: number) {
  return schema.render?.({
    record: props.record as T,
    value: getDetailValue(schema),
    index,
    schema,
    field: String(schema.field),
  });
}
</script>

<style lang="less" scoped>
.dynamic-detail {
  width: 100%;
  min-width: 0;
  overflow-x: hidden;

  :deep(.el-descriptions__body) {
    background: var(--crud-background, var(--el-bg-color, #fff));
    max-width: 100%;
    overflow-x: hidden;
  }

  :deep(.el-descriptions) {
    width: 100%;
    min-width: 0;
    max-width: 100%;
  }

  :deep(.el-descriptions__table) {
    width: 100% !important;
    min-width: 0;
    max-width: 100%;
    table-layout: fixed;
    border-spacing: 0;
  }

  :deep(.el-descriptions__label) {
    color: var(--crud-text-secondary, var(--el-text-color-regular, #475569));
    font-weight: 600;
    white-space: nowrap;
  }

  :deep(.el-descriptions__content) {
    color: var(--crud-text-primary, var(--el-text-color-primary, #0f172a));
    min-width: 0;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  :deep(.el-progress) {
    width: 100%;
    min-width: 0;
  }
}
</style>
