import cloneDeep from 'lodash.clonedeep';
import { CrudNotReadyError } from './model';
export { CrudNotReadyError } from './model';
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

export function useTable<
  T extends CrudRecord = CrudRecord,
>(): UseTableReturn<T> {
  const tableRef = ref<DynamicTableExpose<T>>();

  return {
    tableRef,
    reload: () =>
      tableRef.value
        ? tableRef.value.reload()
        : Promise.reject(new CrudNotReadyError()),
    openCreate: () => tableRef.value?.openCreate(),
    openEdit: (row: T) => tableRef.value?.openEdit(row),
    getSearchModel: () => tableRef.value?.getSearchModel() || {},
  };
}

export function useForm<T extends CrudRecord = CrudRecord>(
  initialValues: Partial<T> = {},
): UseFormReturn<T> {
  const formRef = ref<SchemaFormExpose>();
  const model = reactive<CrudRecord>(cloneDeep(initialValues));

  function setFieldsValue(values: Partial<T>) {
    const copy = cloneDeep(values);
    Object.assign(model, copy);
    formRef.value?.setFieldsValue(copy as CrudRecord);
  }

  function getFieldsValue() {
    return cloneDeep({
      ...model,
      ...(formRef.value?.getFieldsValue() || {}),
    }) as Partial<T>;
  }

  return {
    formRef,
    model: model as Partial<T> & CrudRecord,
    validate: () =>
      formRef.value
        ? formRef.value.validate()
        : Promise.reject(new CrudNotReadyError()),
    resetFields: () =>
      formRef.value
        ? Promise.resolve(formRef.value.resetFields())
        : Promise.reject(new CrudNotReadyError()),
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
  const initialValues = shallowRef<Partial<T>>(
    cloneDeep(defaultValues),
  ) as ShallowRef<Partial<T>>;

  function openCreate(values: Partial<T> = defaultValues) {
    mode.value = 'create';
    record.value = null;
    initialValues.value = cloneDeep(values);
    visible.value = true;
  }

  function openEdit(row: T, values: Partial<T> = row) {
    mode.value = 'edit';
    record.value = row;
    initialValues.value = cloneDeep(values);
    visible.value = true;
  }

  function openDetail(row: T) {
    mode.value = 'detail';
    record.value = row;
    initialValues.value = cloneDeep(row);
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
    submit: () =>
      dialogRef.value
        ? dialogRef.value.submit()
        : Promise.reject(new CrudNotReadyError()),
    cancel: () => dialogRef.value?.cancel(),
    setFieldsValue: (values: Partial<T>) =>
      dialogRef.value?.setFieldsValue(values as CrudRecord),
    getFieldsValue: () =>
      dialogRef.value?.getFieldsValue() as Partial<T> | undefined,
  };
}
