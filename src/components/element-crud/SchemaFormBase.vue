<template>
  <el-form
    ref="formRef"
    class="crud-schema-form"
    :class="{ 'crud-schema-form--inline': inline }"
    :inline="inline"
    :model="innerModel"
    :label-width="labelWidth"
    @submit.prevent
  >
    <slot
      name="formBefore"
      :model="innerModel"
      :submit="submit"
      :reset="reset"
      :toggleCollapsed="toggleCollapsed"
      :isCollapsed="isCollapsed"
    />

    <div
      ref="fieldsWrapperRef"
      class="crud-schema-form__fields-wrapper"
      :class="{ 'crud-schema-form__fields-wrapper--animating': isHeightAnimating }"
      :style="fieldsWrapperStyle"
      @transitionend="handleHeightTransitionEnd"
      @transitioncancel="resetHeightAnimation"
    >
      <div ref="fieldsContentRef" class="crud-schema-form__fields-content">
        <slot
          name="fieldsBefore"
          :model="innerModel"
          :submit="submit"
          :reset="reset"
          :toggleCollapsed="toggleCollapsed"
          :isCollapsed="isCollapsed"
        />

        <div
          class="crud-schema-form__fields"
          :class="{ 'crud-schema-form__fields--inline': inline }"
        >
          <el-form-item
            v-for="schema in displaySchemas"
            :key="String(schema.field)"
            :label="schema.label"
            :prop="String(schema.field)"
            :rules="schema.rules"
            :style="getItemStyle(schema)"
          >
            <RenderNode
              v-if="schema.render"
              :vnode="renderSchema(schema)"
            />

            <el-progress
              v-else-if="schema.component === 'Progress'"
              v-bind="getProgressProps(schema)"
              :percentage="getProgressValue(schema)"
            />

            <component
              :is="resolveComponent(schema)"
              v-else-if="isNativeComponent(schema)"
              v-model="innerModel[String(schema.field)]"
              v-bind="getComponentProps(schema)"
            >
              <template v-if="hasOptions(schema)">
                <el-option
                  v-for="option in schema.options || []"
                  :key="String(option.value)"
                  :label="option.label"
                  :value="option.value"
                  :disabled="option.disabled"
                />
              </template>

              <template v-if="schema.component === 'RadioGroup'">
                <el-radio
                  v-for="option in schema.options || []"
                  :key="String(option.value)"
                  :label="option.value"
                  :disabled="option.disabled"
                >
                  {{ option.label }}
                </el-radio>
              </template>

              <template v-if="schema.component === 'CheckboxGroup'">
                <el-checkbox
                  v-for="option in schema.options || []"
                  :key="String(option.value)"
                  :label="option.value"
                  :disabled="option.disabled"
                >
                  {{ option.label }}
                </el-checkbox>
              </template>
            </component>

            <component
              :is="schema.component"
              v-else
              v-model="innerModel[String(schema.field)]"
              v-bind="getComponentProps(schema)"
            />
          </el-form-item>
        </div>

        <slot
          name="fieldsAfter"
          :model="innerModel"
          :submit="submit"
          :reset="reset"
          :toggleCollapsed="toggleCollapsed"
          :isCollapsed="isCollapsed"
        />
      </div>
    </div>

    <el-form-item v-if="showActions" class="crud-schema-form__actions">
      <slot name="actions">
        <slot
          name="actionsBefore"
          :model="innerModel"
          :submit="submit"
          :reset="reset"
          :toggleCollapsed="toggleCollapsed"
          :isCollapsed="isCollapsed"
        />

        <slot
          name="advanceBefore"
          :model="innerModel"
          :submit="submit"
          :reset="reset"
          :toggleCollapsed="toggleCollapsed"
          :isCollapsed="isCollapsed"
        />
        <el-button
          v-if="showCollapseToggle"
          :icon="isCollapsed ? ArrowDown : ArrowUp"
          text
          type="primary"
          @click="toggleCollapsed"
        >
          {{ isCollapsed ? '展开' : '收起' }}
        </el-button>

        <slot
          name="submitBefore"
          :model="innerModel"
          :submit="submit"
          :reset="reset"
          :toggleCollapsed="toggleCollapsed"
          :isCollapsed="isCollapsed"
        />
        <el-button :icon="Search" type="primary" @click="submit">查询</el-button>

        <slot
          name="resetBefore"
          :model="innerModel"
          :submit="submit"
          :reset="reset"
          :toggleCollapsed="toggleCollapsed"
          :isCollapsed="isCollapsed"
        />
        <el-button :icon="RefreshLeft" @click="reset">重置</el-button>

        <slot
          name="actionsAfter"
          :model="innerModel"
          :submit="submit"
          :reset="reset"
          :toggleCollapsed="toggleCollapsed"
          :isCollapsed="isCollapsed"
        />
      </slot>
    </el-form-item>

    <slot
      name="formAfter"
      :model="innerModel"
      :submit="submit"
      :reset="reset"
      :toggleCollapsed="toggleCollapsed"
      :isCollapsed="isCollapsed"
    />
  </el-form>
</template>

<script setup lang="ts">
import { computed, defineComponent, nextTick, reactive, ref, watch } from 'vue';
import {
  ElCascader,
  ElCheckbox,
  ElColorPicker,
  ElDatePicker,
  ElForm,
  ElInput,
  ElInputNumber,
  ElOption,
  ElProgress,
  ElRate,
  ElRadio,
  ElSelect,
  ElSlider,
  ElSwitch,
  ElTimePicker,
  ElTimeSelect,
  ElTreeSelect,
} from 'element-plus';
import { ArrowDown, ArrowUp, RefreshLeft, Search } from '@element-plus/icons-vue';
import type { FormInstance } from 'element-plus';
import type { CrudFormSchema, CrudRecord } from './types';

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

const props = withDefaults(
  defineProps<{
    modelValue?: CrudRecord;
    schemas: CrudFormSchema[];
    inline?: boolean;
    labelWidth?: string | number;
    showActions?: boolean;
    collapsible?: boolean;
    defaultCollapsed?: boolean;
    collapsedItemCount?: number;
  }>(),
  {
    modelValue: () => ({}),
    inline: false,
    labelWidth: 96,
    showActions: true,
    collapsible: false,
    defaultCollapsed: true,
    collapsedItemCount: 3,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: CrudRecord];
  submit: [value: CrudRecord];
  reset: [value: CrudRecord];
}>();

const formRef = ref<FormInstance>();
const fieldsWrapperRef = ref<HTMLElement>();
const fieldsContentRef = ref<HTMLElement>();
const innerModel = reactive<CrudRecord>({});
const collapsed = ref(props.defaultCollapsed);
const animatedHeight = ref<string>();
const isHeightAnimating = ref(false);
let animationFallbackTimer: ReturnType<typeof setTimeout> | undefined;

const nativeMap = {
  Input: ElInput,
  InputPassword: ElInput,
  InputNumber: ElInputNumber,
  Textarea: ElInput,
  Select: ElSelect,
  TreeSelect: ElTreeSelect,
  Cascader: ElCascader,
  DatePicker: ElDatePicker,
  TimePicker: ElTimePicker,
  TimeSelect: ElTimeSelect,
  RadioGroup: 'el-radio-group',
  CheckboxGroup: 'el-checkbox-group',
  Switch: ElSwitch,
  Slider: ElSlider,
  Rate: ElRate,
  ColorPicker: ElColorPicker,
};

const visibleSchemas = computed(() =>
  props.schemas.filter((schema) => {
    if (typeof schema.hidden === 'function') {
      return !schema.hidden(innerModel);
    }

    return !schema.hidden;
  }),
);

const showCollapseToggle = computed(
  () => props.collapsible && visibleSchemas.value.length > props.collapsedItemCount,
);

const isCollapsed = computed(() => showCollapseToggle.value && collapsed.value);

const displaySchemas = computed(() => {
  if (!isCollapsed.value) {
    return visibleSchemas.value;
  }

  return visibleSchemas.value.slice(0, props.collapsedItemCount);
});

const fieldsWrapperStyle = computed(() => {
  if (!animatedHeight.value) {
    return undefined;
  }

  return {
    height: animatedHeight.value,
  };
});

watch(
  () => props.modelValue,
  (value) => {
    Object.keys(innerModel).forEach((key) => delete innerModel[key]);
    Object.assign(innerModel, value || {});
  },
  { immediate: true, deep: true },
);

watch(
  innerModel,
  (value) => {
    emit('update:modelValue', { ...value });
  },
  { deep: true },
);

watch(showCollapseToggle, (value) => {
  if (!value) {
    collapsed.value = false;
  }
});

function isNativeComponent(schema: CrudFormSchema) {
  return typeof (schema.component || 'Input') === 'string' && String(schema.component || 'Input') in nativeMap;
}

function resolveComponent(schema: CrudFormSchema) {
  const key = String(schema.component || 'Input') as keyof typeof nativeMap;
  return nativeMap[key] || ElInput;
}

function hasOptions(schema: CrudFormSchema) {
  return schema.component === 'Select';
}

function renderSchema(schema: CrudFormSchema) {
  return schema.render?.({
    model: innerModel,
    schema,
    field: String(schema.field),
  });
}

function getComponentProps(schema: CrudFormSchema) {
  if (['RadioGroup', 'CheckboxGroup', 'Switch', 'Slider', 'Rate', 'ColorPicker'].includes(String(schema.component))) {
    return {
      style: { width: '100%' },
      ...(schema.props || {}),
    };
  }

  const placeholderPrefix = ['Select', 'TreeSelect', 'Cascader', 'DatePicker', 'TimePicker', 'TimeSelect'].includes(
    String(schema.component),
  )
    ? '请选择'
    : '请输入';

  const commonProps = {
    clearable: true,
    placeholder: schema.placeholder || `${placeholderPrefix}${schema.label}`,
    style: { width: '100%' },
    ...(schema.props || {}),
  };

  if (schema.component === 'Textarea') {
    return {
      ...commonProps,
      type: 'textarea',
      rows: schema.props?.rows || 3,
    };
  }

  if (schema.component === 'InputPassword') {
    return {
      ...commonProps,
      type: 'password',
      showPassword: true,
    };
  }

  return commonProps;
}

function getProgressProps(schema: CrudFormSchema) {
  const { percentage, ...restProps } = schema.props || {};

  return {
    style: { width: '100%' },
    ...restProps,
  };
}

function getProgressValue(schema: CrudFormSchema) {
  const value = innerModel[String(schema.field)];

  if (typeof schema.props?.percentage === 'number') {
    return schema.props.percentage;
  }

  return Number(value || 0);
}

function normalizeSize(value: string | number) {
  return typeof value === 'number' ? `${value}px` : value;
}

function getInlineItemWidth(schema: CrudFormSchema) {
  const controlWidth = normalizeSize(schema.width || 224);
  const labelWidthValue = props.labelWidth === 'auto' ? 0 : props.labelWidth;
  const labelWidth = normalizeSize(labelWidthValue || 0);

  // schema.width 表示控件宽度，外层 form-item 需要额外加上 label 宽度。
  return `calc(${controlWidth} + ${labelWidth})`;
}

function getItemStyle(schema: CrudFormSchema) {
  if (props.inline) {
    return {
      width: getInlineItemWidth(schema),
    };
  }

  const span = schema.span || 24;
  return {
    width: `${(Math.min(span, 24) / 24) * 100}%`,
  };
}

async function toggleCollapsed() {
  const wrapper = fieldsWrapperRef.value;
  const content = fieldsContentRef.value;

  if (!wrapper) {
    collapsed.value = !collapsed.value;
    return;
  }

  const nextCollapsed = !collapsed.value;
  resetAnimationFallback();
  const startHeight = content?.getBoundingClientRect().height || wrapper.getBoundingClientRect().height;
  animatedHeight.value = `${startHeight}px`;
  isHeightAnimating.value = true;

  // 先把起始高度写入，再触发折叠状态变更，避免动画丢帧。
  void wrapper.offsetHeight;
  collapsed.value = nextCollapsed;

  await nextTick();

  const endHeight = fieldsContentRef.value?.getBoundingClientRect().height || wrapper.scrollHeight;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      animatedHeight.value = `${endHeight}px`;

      if (startHeight === endHeight) {
        resetHeightAnimation();
        return;
      }

      // 某些场景不会触发 transitionend，这里给一个兜底，避免 height 卡住。
      animationFallbackTimer = setTimeout(() => {
        resetHeightAnimation();
      }, 320);
    });
  });
}

function handleHeightTransitionEnd(event: TransitionEvent) {
  if (event.propertyName !== 'height') {
    return;
  }

  resetAnimationFallback();
  resetHeightAnimation();
}

function resetAnimationFallback() {
  if (!animationFallbackTimer) {
    return;
  }

  clearTimeout(animationFallbackTimer);
  animationFallbackTimer = undefined;
}

function resetHeightAnimation() {
  resetAnimationFallback();
  animatedHeight.value = undefined;
  isHeightAnimating.value = false;
}

async function submit() {
  await formRef.value?.validate();
  emit('submit', { ...innerModel });
}

async function reset() {
  await formRef.value?.resetFields();
  props.schemas.forEach((schema) => {
    innerModel[String(schema.field)] = schema.defaultValue ?? undefined;
  });
  emit('reset', { ...innerModel });
}

function setFieldsValue(value: CrudRecord) {
  Object.assign(innerModel, value);
}

function getFieldsValue() {
  return { ...innerModel };
}

defineExpose({
  validate: () => formRef.value?.validate(),
  resetFields: () => reset(),
  setFieldsValue,
  getFieldsValue,
});
</script>

<style lang="less" scoped>
.crud-schema-form {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -8px;

  :deep(.el-form-item) {
    padding: 0 8px;
    min-width: 0;
    box-sizing: border-box;
  }

  :deep(.el-form-item__content) {
    min-width: 0;
  }

  :deep(.el-input),
  :deep(.el-input-number),
  :deep(.el-select),
  :deep(.el-tree-select),
  :deep(.el-cascader),
  :deep(.el-date-editor),
  :deep(.el-time-select),
  :deep(.el-slider),
  :deep(.el-rate),
  :deep(.el-color-picker),
  :deep(.el-progress) {
    width: 100%;
    max-width: 100%;
  }

  :deep(.el-select__wrapper),
  :deep(.el-tree-select__wrapper),
  :deep(.el-input__wrapper) {
    width: 100%;
    max-width: 100%;
  }
}

.crud-schema-form__fields {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
}

.crud-schema-form__fields-content {
  width: 100%;
}

.crud-schema-form__fields-wrapper {
  width: 100%;
  transition: height 0.24s ease;
}

.crud-schema-form__fields-wrapper--animating {
  overflow: hidden;
  will-change: height;
}

.crud-schema-form--inline {
  flex-wrap: nowrap;
  display: flex;
  align-items: flex-start;
  gap: 0;
  margin: 0;

  .crud-schema-form__fields {
    flex: 1 1 auto;
    width: auto;
    min-width: 0;
  }

  :deep(.el-form-item) {
    padding: 0;
    margin-right: 12px;
  }

  :deep(.el-form-item__content) {
    width: 100%;
    min-width: 0;
  }
}

.crud-schema-form__actions {
  margin-left: auto;
  flex: 0 0 auto;
  min-width: 296px;

  :deep(.el-form-item__content) {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    white-space: nowrap;
  }
}
</style>
