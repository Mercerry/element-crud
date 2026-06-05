<template>
  <SchemaFormBase
    ref="formRef"
    v-model="model"
    :schemas="schemas"
    :inline="inline"
    :label-width="labelWidth"
    :show-actions="showActions"
    :collapsible="collapsible"
    :default-collapsed="defaultCollapsed"
    :collapsed-item-count="collapsedItemCount"
    @submit="(values) => emit('submit', values)"
    @reset="(values) => emit('reset', values)"
  >
    <template v-for="(_, name) in $slots" #[name]="slotData" :key="name">
      <slot :name="name" v-bind="slotData || {}" />
    </template>
  </SchemaFormBase>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import SchemaFormBase from './SchemaFormBase.vue';
import type { CrudFormSchema, CrudRecord } from './types';

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

const formRef = ref<InstanceType<typeof SchemaFormBase>>();

const model = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

defineExpose({
  validate: () => formRef.value?.validate(),
  resetFields: () => formRef.value?.resetFields(),
  setFieldsValue: (value: CrudRecord) => formRef.value?.setFieldsValue(value),
  getFieldsValue: () => formRef.value?.getFieldsValue(),
});
</script>
