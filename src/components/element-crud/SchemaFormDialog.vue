<template>
  <el-dialog
    v-model="visible"
    :width="width"
    :draggable="draggable"
    destroy-on-close
    v-bind="dialogProps"
    @open="emit('open')"
    @opened="emit('opened')"
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
      :submitting="submitting"
    />

    <SchemaForm
      ref="formRef"
      v-model="formModel"
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
      :submitting="submitting"
    />

    <template #footer>
      <slot
        name="footer"
        :submitting="submitting"
        :submit="submit"
        :cancel="cancel"
        :close="close"
      >
        <el-button
          v-if="showCancelButton"
          v-bind="cancelButtonProps"
          @click="cancel"
        >
          {{ cancelButtonText }}
        </el-button>
        <el-button
          v-if="showConfirmButton"
          type="primary"
          :loading="submitting"
          v-bind="confirmButtonProps"
          @click="submit"
        >
          {{ confirmButtonText }}
        </el-button>
      </slot>
    </template>
  </el-dialog>
</template>

<script setup lang="ts" generic="T extends CrudRecord">
import { computed, reactive, ref, watch } from 'vue';
import SchemaForm from './SchemaForm.vue';
import type { CrudFormSchema, CrudRecord } from './types';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title: string;
    schemas: CrudFormSchema<T>[];
    initialValues?: Partial<T>;
    width?: string | number;
    labelWidth?: string | number;
    draggable?: boolean;
    autoCloseOnSubmit?: boolean;
    showCancelButton?: boolean;
    showConfirmButton?: boolean;
    cancelButtonText?: string;
    confirmButtonText?: string;
    cancelButtonProps?: Record<string, any>;
    confirmButtonProps?: Record<string, any>;
    dialogProps?: Record<string, any>;
  }>(),
  {
    initialValues: () => ({}),
    width: 720,
    labelWidth: 96,
    draggable: true,
    autoCloseOnSubmit: true,
    showCancelButton: true,
    showConfirmButton: true,
    cancelButtonText: '取消',
    confirmButtonText: '确认',
    cancelButtonProps: () => ({}),
    confirmButtonProps: () => ({}),
    dialogProps: () => ({}),
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
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

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

watch(
  () => [props.initialValues, props.schemas, props.modelValue] as const,
  () => {
    if (!props.modelValue) {
      return;
    }

    resetFormModel();
  },
  { immediate: true, deep: true },
);

function resetFormModel() {
  const nextModel: CrudRecord = {};

  props.schemas.forEach((schema) => {
    nextModel[String(schema.field)] = schema.defaultValue ?? undefined;
  });
  Object.assign(nextModel, props.initialValues || {});
  Object.keys(formModel).forEach((key) => delete formModel[key]);
  Object.assign(formModel, nextModel);
}

async function submit() {
  await formRef.value?.validate?.();
  submitting.value = true;
  emit('submit', { ...formModel } as Partial<T>, (shouldClose = props.autoCloseOnSubmit) => {
    submitting.value = false;

    if (shouldClose) {
      close();
    }
  });
}

function cancel() {
  emit('cancel');
  close();
}

function close() {
  visible.value = false;
  emit('close');
}

defineExpose({
  submit,
  close,
  cancel,
  setFieldsValue: (value: CrudRecord) => formRef.value?.setFieldsValue(value),
  getFieldsValue: () => formRef.value?.getFieldsValue(),
});
</script>
