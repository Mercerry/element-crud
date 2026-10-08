<template>
  <SchemaFormBase
    ref="formRef"
    v-model="model"
    :schemas="schemas"
    :reset-values="resetValues"
    :reset-mode="resetMode"
    :field-policy="fieldPolicy"
    :inline="inline"
    :fields-layout="fieldsLayout"
    :gutter="gutter"
    :label-width="labelWidth"
    :submit-on-enter="submitOnEnter"
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
import type { FormInstance } from 'element-plus';
import SchemaFormBase from './SchemaFormBase.vue';
import type { CrudFormSchema, CrudRecord } from './types';

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

const formRef = ref<InstanceType<typeof SchemaFormBase>>();

const model = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

defineExpose({
  validateField: (...args: Parameters<FormInstance['validateField']>) =>
    formRef.value!.validateField(...args),
  clearValidate: (...args: Parameters<FormInstance['clearValidate']>) =>
    formRef.value?.clearValidate(...args),
  scrollToField: (...args: Parameters<FormInstance['scrollToField']>) =>
    formRef.value?.scrollToField(...args),
  resetFormFields: (...args: Parameters<FormInstance['resetFields']>) =>
    formRef.value?.resetFormFields(...args),

  validate: (...args: Parameters<FormInstance['validate']>) =>
    formRef.value!.validate(...args),
  resetFields: () => formRef.value?.resetFields(),
  setFieldsValue: (value: CrudRecord) => formRef.value?.setFieldsValue(value),
  getFieldsValue: () => formRef.value?.getFieldsValue(),
});
</script>
