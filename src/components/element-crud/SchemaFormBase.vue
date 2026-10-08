<template>
  <el-form
    ref="formRef"
    class="crud-schema-form"
    :class="{
      'crud-schema-form--inline': inline,
      'crud-schema-form--contents': fieldsLayout === 'contents',
      'crud-schema-form--grid': useGrid,
    }"
    :inline="inline"
    :model="innerModel"
    :label-width="labelWidth"
    @keydown="handleEnter"
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
      :class="{
        'crud-schema-form__fields-wrapper--animating': isHeightAnimating,
      }"
      :style="fieldsWrapperStyle"
      @transitionend="handleHeightTransitionEnd"
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

        <component
          :is="useGrid ? ElRow : 'div'"
          :gutter="useGrid ? gutter : undefined"
          class="crud-schema-form__fields"
          :class="{ 'crud-schema-form__fields--inline': inline }"
        >
          <LayoutColumn
            v-for="(schema, index) in visibleSchemas"
            :grid="useGrid"
            :column="{
              span: schema.span ?? (schema.kind === 'content' ? 24 : 12),
              xs: 24,
              ...schema.colProps,
            }"
            :hidden="
              schema.visible === false ||
              (isCollapsed && index >= effectiveCollapsedCount)
            "
            :key="String(schema.field)"
          >
            <RenderNode
              v-if="schema.kind === 'content'"
              :vnode="renderSchema(schema)"
            />
            <el-form-item
              v-else
              v-bind="schema.itemProps"
              :class="schema.class"
              v-show="
                schema.visible !== false &&
                (!isCollapsed || index < effectiveCollapsedCount)
              "
              :key="String(schema.field)"
              :label="schema.label"
              :prop="String(schema.field)"
              :rules="schema.rules"
              :style="getItemStyle(schema)"
            >
              <template v-if="schema.labelRender" #label>
                <RenderNode :vnode="schema.labelRender()" />
              </template>
              <RenderNode v-if="schema.render" :vnode="renderSchema(schema)" />

              <el-progress
                v-else-if="schema.component === 'Progress'"
                v-bind="getProgressProps(schema)"
                :percentage="getProgressValue(schema)"
              />

              <component
                :is="resolveComponent(schema)"
                v-else-if="isNativeComponent(schema)"
                :model-value="getField(innerModel, String(schema.field))"
                @update:model-value="
                  setField(innerModel, String(schema.field), $event)
                "
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
                :model-value="getField(innerModel, String(schema.field))"
                @update:model-value="
                  setField(innerModel, String(schema.field), $event)
                "
                v-bind="getComponentProps(schema)"
              />
            </el-form-item>
          </LayoutColumn>
        </component>

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
          v-if="showCollapseToggle || autoCollapse"
          :style="!showCollapseToggle ? { visibility: 'hidden' } : undefined"
          :disabled="!showCollapseToggle"
          :aria-hidden="!showCollapseToggle"
          :aria-expanded="!isCollapsed"
          :icon="isCollapsed ? ArrowDown : ArrowUp"
          text
          type="primary"
          @click="toggleCollapsed"
        >
          {{ isCollapsed ? locale.expand : locale.collapse }}
        </el-button>

        <slot
          name="submitBefore"
          :model="innerModel"
          :submit="submit"
          :reset="reset"
          :toggleCollapsed="toggleCollapsed"
          :isCollapsed="isCollapsed"
        />
        <el-button :icon="Search" type="primary" @click="submit">{{
          locale.search
        }}</el-button>

        <slot
          name="resetBefore"
          :model="innerModel"
          :submit="submit"
          :reset="reset"
          :toggleCollapsed="toggleCollapsed"
          :isCollapsed="isCollapsed"
        />
        <el-button :icon="RefreshLeft" @click="reset">{{
          locale.reset
        }}</el-button>

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
import { useCrudLocale } from './config';
import {
  computed,
  h,
  defineComponent,
  nextTick,
  onMounted,
  onActivated,
  onBeforeUnmount,
  reactive,
  ref,
  watch,
} from 'vue';
import {
  ElCascader,
  ElCheckbox,
  ElColorPicker,
  ElDatePicker,
  ElForm,
  ElRow,
  ElCol,
  ElFormItem,
  ElButton,
  ElCheckboxGroup,
  ElRadioGroup,
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
import {
  ArrowDown,
  ArrowUp,
  RefreshLeft,
  Search,
} from '@element-plus/icons-vue';
import type { FormInstance, ColProps } from 'element-plus';
import cloneDeep from 'lodash.clonedeep';
import {
  getField,
  setField,
  hasField,
  removeField,
  withDefaults as fillDefaults,
  CrudNotReadyError,
} from './model';
import type { CrudFormSchema, CrudRecord } from './types';

// 搜索和编辑表单统一使用 Element Layout；contents 留给宿主复合布局。
const LayoutColumn = defineComponent({
  props: {
    grid: Boolean,
    hidden: Boolean,
    column: Object as import('vue').PropType<Partial<ColProps>>,
  },
  setup(columnProps, { slots }) {
    return () =>
      columnProps.grid
        ? h(
            ElCol,
            {
              ...columnProps.column,
              class: 'crud-schema-form__column',
              style: { display: columnProps.hidden ? 'none' : undefined },
            },
            slots,
          )
        : slots.default?.();
  },
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
    modelValue?: CrudRecord;
    resetValues?: CrudRecord;
    resetMode?: 'defaults' | 'initial' | 'empty';
    fieldPolicy?: 'preserve' | 'remove';
    schemas: CrudFormSchema[];
    inline?: boolean;
    fieldsLayout?: 'wrapped' | 'contents';
    gutter?: number;
    labelWidth?: string | number;
    /** 单行输入框回车提交，默认启用。 */
    submitOnEnter?: boolean;
    showActions?: boolean;
    collapsible?: boolean;
    defaultCollapsed?: boolean;
    collapsedItemCount?: number | 'auto';
  }>(),
  {
    modelValue: () => ({}),
    resetMode: 'defaults',
    fieldPolicy: 'preserve',
    inline: false,
    fieldsLayout: 'wrapped',
    gutter: 16,
    labelWidth: 96,
    submitOnEnter: true,
    showActions: true,
    collapsible: false,
    defaultCollapsed: true,
    collapsedItemCount: 'auto',
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
  RadioGroup: ElRadioGroup,
  CheckboxGroup: ElCheckboxGroup,
  Switch: ElSwitch,
  Slider: ElSlider,
  Rate: ElRate,
  ColorPicker: ElColorPicker,
};

const useGrid = computed(() => props.fieldsLayout !== 'contents');

const visibleSchemas = computed(() =>
  props.schemas.filter((schema) => {
    if (typeof schema.hidden === 'function') {
      return !schema.hidden(innerModel);
    }

    return !schema.hidden;
  }),
);

// 显式数字沿用固定数量；inline 搜索默认按实际字段和操作区宽度折叠。
const autoCollapse = computed(
  () =>
    props.inline && props.collapsible && props.collapsedItemCount === 'auto',
);
// 首次测量完成前不展示折叠入口，避免切页时先闪出按钮再隐藏。
const measuredCount = ref<number>();
const effectiveCollapsedCount = computed(() =>
  autoCollapse.value
    ? (measuredCount.value ?? visibleSchemas.value.length)
    : props.collapsedItemCount === 'auto'
      ? 3
      : Math.max(0, Math.floor(props.collapsedItemCount)),
);
const showCollapseToggle = computed(
  () =>
    props.collapsible &&
    visibleSchemas.value.length > effectiveCollapsedCount.value,
);
// 全部字段放得下时不改变用户的折叠意图，缩窄后无需业务层额外同步状态。
const isCollapsed = computed(() => showCollapseToggle.value && collapsed.value);
let resizeObserver: ResizeObserver | undefined;
let measureFrame = 0;
let animationFrame = 0;
let animationVersion = 0;

function measureFields() {
  const wrapper = fieldsWrapperRef.value;
  if (!autoCollapse.value || !wrapper?.clientWidth) return;
  const fields = wrapper.querySelector<HTMLElement>(
    '.crud-schema-form__fields',
  );
  if (!fields) return;
  const gap = Number.parseFloat(getComputedStyle(fields).columnGap) || 0;
  let used = 0;
  let count = 0;
  for (const item of Array.from(fields.children) as HTMLElement[]) {
    if (visibleSchemas.value[count]?.visible === false) {
      count++;
      continue;
    }
    // 同一帧临时恢复隐藏项以测量真实 CSS 宽度，不复制控件或丢失其内部状态。
    const display = item.style.display;
    item.style.display = '';
    const style = getComputedStyle(item);
    const width =
      item.getBoundingClientRect().width +
      (Number.parseFloat(style.marginLeft) || 0) +
      (Number.parseFloat(style.marginRight) || 0);
    item.style.display = display;
    used += width + (count ? gap : 0);
    if (used > (fields.clientWidth || wrapper.clientWidth) + 0.5) break;
    count++;
  }
  measuredCount.value = count;
}
function scheduleMeasure() {
  cancelAnimationFrame(measureFrame);
  measureFrame = requestAnimationFrame(measureFields);
}
onMounted(() => {
  if (typeof ResizeObserver !== 'undefined')
    resizeObserver = new ResizeObserver(scheduleMeasure);
  if (fieldsWrapperRef.value) resizeObserver?.observe(fieldsWrapperRef.value);
  measureFields();
});
// KeepAlive 页面重新进入时，使用当前容器宽度更新，不能沿用离开前的布局。
onActivated(measureFields);
watch(
  [visibleSchemas, autoCollapse, () => props.labelWidth],
  () => {
    measuredCount.value = undefined;
    resetHeightAnimation();
  },
  { flush: 'pre' },
);
watch([visibleSchemas, autoCollapse, () => props.labelWidth], measureFields, {
  deep: true,
  flush: 'post',
});
onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  cancelAnimationFrame(measureFrame);
  resetHeightAnimation();
});

const fieldsWrapperStyle = computed(() => {
  if (!animatedHeight.value) {
    return undefined;
  }

  return {
    height: animatedHeight.value,
  };
});

const initialModel = cloneDeep(normalizeModelValue(props.modelValue));
watch(
  () =>
    props.schemas
      .filter((schema) => schema.kind !== 'content')
      .map((schema) => String(schema.field)),
  (fields, previous = []) => {
    if (props.fieldPolicy === 'remove') {
      previous
        .filter((field) => !fields.includes(field))
        .forEach((field) => {
          removeField(innerModel, field);
          removeField(initialModel, field);
        });
    }
    const next = fillDefaults(innerModel, props.schemas);
    Object.assign(innerModel, next);
    fields
      .filter((field) => !previous.includes(field))
      .forEach((field) => {
        if (hasField(next, field))
          setField(initialModel, field, cloneDeep(getField(next, field)));
      });
  },
);

watch(
  () => props.modelValue,
  (value) => {
    const nextValue = normalizeModelValue(value || {});

    if (isSameModel(innerModel, nextValue)) {
      return;
    }

    Object.keys(innerModel).forEach((key) => delete innerModel[key]);
    Object.assign(innerModel, nextValue);
    if (!isSameModel(nextValue, value || {}))
      emit('update:modelValue', { ...nextValue });
  },
  { immediate: true, deep: true },
);

watch(
  innerModel,
  (value) => {
    const nextValue = { ...value };

    // 父子表单都使用深度监听时，只有值真正变化才回传，避免相互赋值形成更新循环。
    if (!isSameModel(nextValue, props.modelValue || {})) {
      emit('update:modelValue', nextValue);
    }
  },
  { deep: true },
);

function isNativeComponent(schema: CrudFormSchema) {
  return (
    typeof (schema.component || 'Input') === 'string' &&
    String(schema.component || 'Input') in nativeMap
  );
}

function resolveComponent(schema: CrudFormSchema) {
  const key = String(schema.component || 'Input') as keyof typeof nativeMap;
  return nativeMap[key] || ElInput;
}

function hasOptions(schema: CrudFormSchema) {
  return schema.component === 'Select';
}

function normalizeInputNumber(value: unknown) {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : undefined;
}

function normalizeModelValue(value: CrudRecord) {
  const nextValue = fillDefaults(value, props.schemas);

  // 接口或表格数据可能把数字序列化为字符串，统一转换后再交给 el-input-number。
  props.schemas.forEach((schema) => {
    const field = String(schema.field);
    if (schema.component === 'InputNumber' && hasField(nextValue, field)) {
      const current = getField(nextValue, field);
      const normalized = normalizeInputNumber(current);
      if (normalized !== current) setField(nextValue, field, normalized);
    }
  });

  return nextValue;
}

function isSameModel(left: CrudRecord, right: CrudRecord) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every((key) => left[key] === right[key])
  );
}

function renderSchema(schema: CrudFormSchema) {
  return schema.render?.({
    model: innerModel,
    schema,
    field: String(schema.field),
  });
}

function getComponentProps(schema: CrudFormSchema) {
  if (
    [
      'RadioGroup',
      'CheckboxGroup',
      'Switch',
      'Slider',
      'Rate',
      'ColorPicker',
    ].includes(String(schema.component))
  ) {
    return {
      style: { width: '100%' },
      ...(schema.props || {}),
    };
  }

  const placeholderPrefix = [
    'Select',
    'TreeSelect',
    'Cascader',
    'DatePicker',
    'TimePicker',
    'TimeSelect',
  ].includes(String(schema.component))
    ? locale.value.selectPlaceholder
    : locale.value.inputPlaceholder;

  const commonProps = {
    clearable: true,
    placeholder: schema.placeholder || placeholderPrefix(schema.label),
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
  const { percentage, ...restProps } =
    (schema.component === 'Progress' ? schema.props : undefined) || {};
  void percentage;

  return {
    style: { width: '100%' },
    ...restProps,
  };
}

function getProgressValue(schema: CrudFormSchema) {
  const value = getField(innerModel, String(schema.field));

  if (
    schema.component === 'Progress' &&
    typeof schema.props?.percentage === 'number'
  ) {
    return schema.props.percentage;
  }

  return Number(value || 0);
}

function getItemStyle(schema: CrudFormSchema) {
  if (props.fieldsLayout === 'contents') return schema.style;
  return { ...schema.style, width: '100%' };
}

async function toggleCollapsed() {
  if (!props.collapsible) return;
  const wrapper = fieldsWrapperRef.value;
  const startHeight = wrapper?.getBoundingClientRect().height || 0;
  resetHeightAnimation();
  const version = animationVersion;
  if (
    !wrapper ||
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  ) {
    collapsed.value = !collapsed.value;
    return;
  }
  animatedHeight.value = `${startHeight}px`;
  isHeightAnimating.value = true;
  await nextTick();
  if (version !== animationVersion) return;
  // 起始高度必须先落到 DOM，快速反向点击从当前可见高度继续。
  void wrapper.offsetHeight;
  collapsed.value = !collapsed.value;
  await nextTick();
  if (version !== animationVersion) return;
  const endHeight = fieldsContentRef.value?.getBoundingClientRect().height || 0;
  animationFrame = requestAnimationFrame(() => {
    animatedHeight.value = `${endHeight}px`;
    if (Math.abs(startHeight - endHeight) < 0.5) resetHeightAnimation();
    else animationFallbackTimer = setTimeout(resetHeightAnimation, 320);
  });
}

// 动画中关闭折叠时立即释放固定高度，避免已展开字段仍被裁切。
watch(
  () => props.collapsible,
  (enabled) => {
    if (!enabled) resetHeightAnimation();
  },
);

function handleHeightTransitionEnd(event: TransitionEvent) {
  if (
    event.target === fieldsWrapperRef.value &&
    event.propertyName === 'height'
  )
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
  animationVersion++;
  cancelAnimationFrame(animationFrame);
  resetAnimationFallback();
  animatedHeight.value = undefined;
  isHeightAnimating.value = false;
}

async function revealErrors(error: unknown) {
  if (!error || typeof error !== 'object') return;
  const field = Object.keys(error)[0];
  if (!field) return;
  // 校验仍包含折叠字段，先展开再滚动，避免用户只看到失败却看不到原因。
  collapsed.value = false;
  resetHeightAnimation();
  await nextTick();
  if (
    typeof Element !== 'undefined' &&
    typeof Element.prototype.scrollIntoView === 'function'
  ) {
    formRef.value?.scrollToField(field);
  }
}
const validate: FormInstance['validate'] = async (callback) => {
  if (!formRef.value) throw new CrudNotReadyError();
  try {
    await formRef.value.validate();
  } catch (error) {
    await revealErrors(error);
    if (callback) {
      await callback(false, error as never);
      return false;
    }
    throw error;
  }
  // 宿主回调异常直接向外传播，不应再次按校验失败调用同一回调。
  if (callback) await callback(true);
  return true;
};
const validateField: FormInstance['validateField'] = async (
  fields,
  callback,
) => {
  if (!formRef.value) throw new CrudNotReadyError();
  try {
    await formRef.value.validateField(fields);
  } catch (error) {
    await revealErrors(error);
    if (callback) {
      await callback(false, error as never);
      return false;
    }
    throw error;
  }
  // 宿主回调异常直接向外传播，不应再次按校验失败调用同一回调。
  if (callback) await callback(true);
  return true;
};
// 仅处理普通单行输入，保留下拉确认、文本换行和输入法候选确认。
function handleEnter(event: KeyboardEvent) {
  if (
    !props.submitOnEnter ||
    event.key !== 'Enter' ||
    event.defaultPrevented ||
    event.isComposing ||
    event.keyCode === 229 ||
    event.repeat ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    event.shiftKey
  )
    return;
  const target = event.target;
  if (
    !(target instanceof HTMLInputElement) ||
    target.disabled ||
    target.readOnly ||
    !['text', 'password', 'search', 'email', 'url', 'tel', 'number'].includes(
      target.type,
    ) ||
    target.closest(
      '[role="combobox"], .el-select, .el-autocomplete, .el-cascader, .el-date-editor, .el-input-tag',
    )
  )
    return;
  event.preventDefault();
  void submit();
}

let validatingSubmit = false;
async function submit() {
  if (validatingSubmit) return;
  validatingSubmit = true;
  try {
    await validate();
    emit('submit', cloneDeep({ ...innerModel }));
  } catch {
    /* 错误已呈现在字段上，模板事件不产生未处理拒绝。 */
  } finally {
    validatingSubmit = false;
  }
}

async function reset() {
  if (props.resetValues || props.resetMode === 'initial') {
    // 组合字段与嵌套模型按调用方提供的初始快照一次恢复。
    Object.keys(innerModel).forEach((key) => delete innerModel[key]);
    Object.assign(innerModel, cloneDeep(props.resetValues ?? initialModel));
    await nextTick();
    formRef.value?.clearValidate();
  } else {
    formRef.value?.resetFields();
    props.schemas
      .filter((schema) => schema.kind !== 'content')
      .forEach((schema) => {
        const defaultValue =
          props.resetMode === 'empty'
            ? undefined
            : cloneDeep(schema.defaultValue);
        setField(
          innerModel,
          String(schema.field),
          schema.component === 'InputNumber'
            ? normalizeInputNumber(defaultValue)
            : defaultValue,
        );
      });
    await nextTick();
  }
  emit('reset', cloneDeep({ ...innerModel }));
}

function setFieldsValue(value: CrudRecord) {
  Object.assign(innerModel, normalizeModelValue(value));
}

function getFieldsValue() {
  return cloneDeep({ ...innerModel });
}

defineExpose({
  validateField,
  clearValidate: (...args: Parameters<FormInstance['clearValidate']>) =>
    formRef.value?.clearValidate(...args),
  scrollToField: (...args: Parameters<FormInstance['scrollToField']>) =>
    formRef.value?.scrollToField(...args),
  resetFormFields: (...args: Parameters<FormInstance['resetFields']>) =>
    formRef.value?.resetFields(...args),

  validate,
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
  flex-wrap: wrap;
  display: flex;
  align-items: flex-start;
  gap: var(--crud-form-gap, 12px);
  margin: 0;

  .crud-schema-form__fields-wrapper {
    flex: 1 1 224px;
    min-width: 0;
    width: auto;
  }

  .crud-schema-form__fields {
    row-gap: var(--crud-form-gap, 12px);
    flex: 1 1 auto;
    width: auto;
    min-width: 0;
  }

  :deep(.el-form-item) {
    padding: 0;
    margin-right: 0;
    margin-bottom: 0;
    max-width: 100%;
  }

  :deep(.el-form-item__content) {
    width: 100%;
    min-width: 0;
  }
}

.crud-schema-form__actions {
  margin-left: auto;
  flex: 0 0 auto;
  min-width: 0;
  max-width: 100%;
  margin-bottom: 0;

  :deep(.el-form-item__content) {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: var(--crud-action-gap, 8px);
    white-space: normal;

    .el-button + .el-button {
      margin-left: 0;
    }
  }
}
@media (prefers-reduced-motion: reduce) {
  .crud-schema-form__fields-wrapper {
    transition: none;
  }
}
/* 复合业务表单由宿主网格布局，字段仍由同一表单实例管理校验。 */
.crud-schema-form--contents {
  .crud-schema-form__fields-wrapper,
  .crud-schema-form__fields-content,
  .crud-schema-form__fields {
    display: contents;
  }
}
/* 列间距由 ElRow gutter 分配，不再叠加表单项的左右 padding。 */
.crud-schema-form--grid {
  margin: 0;
}
.crud-schema-form__fields.el-row {
  width: auto;
  flex: 1 1 auto;
}
.crud-schema-form__column {
  min-width: 0;
}
.crud-schema-form__column :deep(.el-form-item) {
  padding: 0;
}
</style>
