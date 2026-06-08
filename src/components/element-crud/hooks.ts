import { reactive, ref, shallowRef } from 'vue';
import type { Ref, ShallowRef } from 'vue';
import type {
  CrudRecord,
  DynamicTableExpose,
  SchemaFormDialogExpose,
  SchemaFormExpose,
} from './types';

export type DialogMode = 'create' | 'edit' | 'detail';

export interface UseTableReturn<T extends CrudRecord = CrudRecord> {
  tableRef: Ref<DynamicTableExpose<T> | undefined>;
  reload: () => Promise<void>;
  openCreate: () => void | undefined;
  openEdit: (row: T) => void | undefined;
  getSearchModel: () => CrudRecord;
}

export interface UseFormReturn<T extends CrudRecord = CrudRecord> {
  formRef: Ref<SchemaFormExpose | undefined>;
  model: Partial<T> & CrudRecord;
  validate: () => Promise<unknown>;
  resetFields: () => Promise<unknown>;
  setFieldsValue: (values: Partial<T>) => void;
  getFieldsValue: () => Partial<T>;
}

export interface UseDialogReturn<T extends CrudRecord = CrudRecord> {
  dialogRef: Ref<SchemaFormDialogExpose | undefined>;
  visible: Ref<boolean>;
  mode: Ref<DialogMode>;
  record: ShallowRef<T | null>;
  initialValues: ShallowRef<Partial<T>>;
  openCreate: (values?: Partial<T>) => void;
  openEdit: (row: T, values?: Partial<T>) => void;
  openDetail: (row: T) => void;
  close: () => void;
  submit: () => Promise<void> | undefined;
  cancel: () => void | undefined;
  setFieldsValue: (values: Partial<T>) => void | undefined;
  getFieldsValue: () => Partial<T> | undefined;
}

export function useTable<T extends CrudRecord = CrudRecord>(): UseTableReturn<T> {
  const tableRef = ref<DynamicTableExpose<T>>();

  return {
    tableRef,
    reload: () => tableRef.value?.reload() || Promise.resolve(),
    openCreate: () => tableRef.value?.openCreate(),
    openEdit: (row: T) => tableRef.value?.openEdit(row),
    getSearchModel: () => tableRef.value?.getSearchModel() || {},
  };
}

export function useForm<T extends CrudRecord = CrudRecord>(
  initialValues: Partial<T> = {},
): UseFormReturn<T> {
  const formRef = ref<SchemaFormExpose>();
  const model = reactive<CrudRecord>({ ...initialValues });

  function setFieldsValue(values: Partial<T>) {
    Object.assign(model, values);
    formRef.value?.setFieldsValue(values as CrudRecord);
  }

  function getFieldsValue() {
    return {
      ...model,
      ...(formRef.value?.getFieldsValue() || {}),
    } as Partial<T>;
  }

  return {
    formRef,
    model: model as Partial<T> & CrudRecord,
    validate: () => formRef.value?.validate() || Promise.resolve(true),
    resetFields: () => formRef.value?.resetFields() || Promise.resolve(),
    setFieldsValue,
    getFieldsValue,
  };
}

export function useDialog<T extends CrudRecord = CrudRecord>(
  defaultValues: Partial<T> = {},
): UseDialogReturn<T> {
  const dialogRef = ref<SchemaFormDialogExpose>();
  const visible = ref(false);
  const mode = ref<DialogMode>('create');
  const record = shallowRef<T | null>(null) as ShallowRef<T | null>;
  const initialValues = shallowRef<Partial<T>>({ ...defaultValues }) as ShallowRef<Partial<T>>;

  function openCreate(values: Partial<T> = defaultValues) {
    mode.value = 'create';
    record.value = null;
    initialValues.value = { ...values };
    visible.value = true;
  }

  function openEdit(row: T, values: Partial<T> = row) {
    mode.value = 'edit';
    record.value = row;
    initialValues.value = { ...values };
    visible.value = true;
  }

  function openDetail(row: T) {
    mode.value = 'detail';
    record.value = row;
    initialValues.value = { ...row };
    visible.value = true;
  }

  function close() {
    visible.value = false;
  }

  return {
    dialogRef,
    visible,
    mode,
    record,
    initialValues,
    openCreate,
    openEdit,
    openDetail,
    close,
    submit: () => dialogRef.value?.submit(),
    cancel: () => dialogRef.value?.cancel(),
    setFieldsValue: (values: Partial<T>) => dialogRef.value?.setFieldsValue(values as CrudRecord),
    getFieldsValue: () => dialogRef.value?.getFieldsValue() as Partial<T> | undefined,
  };
}
