<template>
  <component
    :is="mode === 'drawer' ? ElDrawer : ElDialog"
    v-model="visible"
    :title="title"
    :width="width"
    :size="width"
    :draggable="draggable"
    destroy-on-close
    v-bind="resolvedDialogProps"
    @open="emit('open')"
    @opened="emit('opened')"
    @close="emit('close')"
    @closed="emit('closed')"
  >
    <template #header>
      <slot name="header" :title="title" :close="close">
        <span>{{ title }}</span>
      </slot>
    </template>

    <slot
      name="dialogBefore"
      :model="formModel"
      :submit="submit"
      :cancel="cancel"
      :close="close"
      :submitting="locked"
    />

    <SchemaForm
      ref="formRef"
      :model-value="formModel"
      @update:model-value="(value) => replaceModel(formModel, value)"
      :schemas="schemas"
      :label-width="labelWidth"
      :show-actions="false"
    >
      <template v-for="(_, name) in $slots" #[name]="slotData" :key="name">
        <slot :name="name" v-bind="slotData || {}" />
      </template>
    </SchemaForm>

    <slot
      name="dialogAfter"
      :model="formModel"
      :submit="submit"
      :cancel="cancel"
      :close="close"
      :submitting="locked"
    />

    <template #footer>
      <slot
        name="footer"
        :submitting="locked"
        :submit="submit"
        :cancel="cancel"
        :close="close"
      >
        <el-button
          v-if="showCancelButton"
          v-bind="cancelButtonProps"
          :disabled="locked || cancelButtonProps.disabled"
          @click="cancel"
        >
          {{ cancelButtonText ?? locale.cancel }}
        </el-button>
        <el-button
          v-if="showConfirmButton"
          type="primary"
          :loading="locked"
          v-bind="confirmButtonProps"
          @click="requestSubmit"
        >
          {{ confirmButtonText ?? locale.confirm }}
        </el-button>
      </slot>
    </template>
  </component>
</template>

<script setup lang="ts" generic="T extends CrudRecord">
import { replaceModel } from './model';
import { useCrudLocale } from './config';
import { computed, reactive, ref, watch, onBeforeUnmount } from 'vue';
import { ElDialog, ElDrawer, ElButton } from 'element-plus';
import cloneDeep from 'lodash.clonedeep';
import { withDefaults as fillDefaults, CrudNotReadyError } from './model';
import SchemaForm from './SchemaForm.vue';
import type { CrudFormSchema, CrudRecord } from './types';

const locale = useCrudLocale();

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    busy?: boolean;
    mode?: 'dialog' | 'drawer';
    title: string;
    schemas: CrudFormSchema<T>[];
    initialValues?: Partial<T>;
    width?: string | number;
    labelWidth?: string | number;
    draggable?: boolean;
    autoCloseOnSubmit?: boolean;
    submitRequest?: (values: Partial<T>) => Promise<void> | void;
    showCancelButton?: boolean;
    showConfirmButton?: boolean;
    cancelButtonText?: string;
    confirmButtonText?: string;
    cancelButtonProps?: Record<string, any>;
    confirmButtonProps?: Record<string, any>;
    dialogProps?: Record<string, any>;
  }>(),
  {
    busy: false,
    mode: 'dialog',
    initialValues: () => ({}),
    width: 720,
    labelWidth: 96,
    draggable: true,
    autoCloseOnSubmit: true,
    showCancelButton: true,
    showConfirmButton: true,
    cancelButtonProps: () => ({}),
    confirmButtonProps: () => ({}),
    dialogProps: () => ({}),
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submitError: [error: unknown];
  submit: [values: Partial<T>, done: (shouldClose?: boolean) => void];
  cancel: [];
  close: [];
  open: [];
  opened: [];
  closed: [];
}>();

const formRef = ref<InstanceType<typeof SchemaForm>>();
const submitting = ref(false);
const formModel = reactive<CrudRecord>({});
const locked = computed(() => props.busy || submitting.value);
let generation = 0;
onBeforeUnmount(() => {
  generation++;
});
const resolvedDialogProps = computed(() => ({
  ...props.dialogProps,
  ...(locked.value
    ? { showClose: false, closeOnClickModal: false, closeOnPressEscape: false }
    : {}),
  beforeClose: (done: () => void) => {
    if (locked.value) return;
    const beforeClose = props.dialogProps.beforeClose;
    if (typeof beforeClose === 'function') beforeClose(done);
    else done();
  },
}));

const visible = computed({
  get: () => props.modelValue,
  set: (value) => {
    if (value || !locked.value) emit('update:modelValue', value);
  },
});

// 只在打开或显式切换记录时重建草稿；字典选项、规则变化不清空输入。
watch(
  () => props.modelValue,
  (value) => {
    generation++;
    submitting.value = false;
    if (value) resetFormModel();
  },
  { immediate: true },
);
watch(
  () => props.initialValues,
  () => {
    if (props.modelValue && !locked.value) resetFormModel();
  },
);

function resetFormModel() {
  const nextModel = fillDefaults(
    cloneDeep(props.initialValues || {}),
    props.schemas,
  );
  Object.keys(formModel).forEach((key) => delete formModel[key]);
  Object.assign(formModel, nextModel);
}

async function submit() {
  if (locked.value || !props.modelValue) return;
  submitting.value = true;
  const current = generation;
  try {
    if (!formRef.value) throw new CrudNotReadyError();
    await formRef.value.validate();
    if (current !== generation) return;
    if (props.submitRequest) {
      const values = cloneDeep({ ...formModel }) as Partial<T>;
      try {
        await props.submitRequest(values);
      } catch (error) {
        emit('submitError', error);
        throw error;
      }
      if (current !== generation) return;
      submitting.value = false;
      if (props.autoCloseOnSubmit) visible.value = false;
      return;
    }
    let completed = false;
    emit(
      'submit',
      cloneDeep({ ...formModel }) as Partial<T>,
      (shouldClose = props.autoCloseOnSubmit) => {
        // 旧弹窗的异步回调不能关闭新一轮会话，也不能重复完成。
        if (current !== generation || completed) return;
        completed = true;
        submitting.value = false;
        if (shouldClose) visible.value = false;
      },
    );
  } catch (error) {
    if (current === generation) submitting.value = false;
    throw error;
  }
}
async function requestSubmit() {
  try {
    await submit();
  } catch {
    /* 字段保留校验错误，按钮事件不产生未处理拒绝。 */
  }
}
function cancel() {
  if (locked.value) return;
  emit('cancel');
  close();
}
function close() {
  resolvedDialogProps.value.beforeClose(() => {
    visible.value = false;
  });
}

defineExpose({
  submit,
  close,
  cancel,
  setFieldsValue: (value: CrudRecord) => formRef.value?.setFieldsValue(value),
  getFieldsValue: () => formRef.value?.getFieldsValue(),
});
</script>
