import type { Component, VNode, CSSProperties } from 'vue';
import type {
  FormItemRule,
  TableColumnCtx,
  FormInstance,
  TableInstance,
} from 'element-plus';

export type CrudRecord = Record<string, any>;

import type { HTMLAttributes } from 'vue';
import type * as ElementPlus from 'element-plus';

export interface CrudFieldProps extends HTMLAttributes {
  disabled?: boolean;
}
type ControlProps<P> = Partial<P> & Omit<CrudFieldProps, keyof P>;

// 公共组件属性包含原生事件；判别联合让 component 决定 props 提示与检查。
export interface CrudComponentPropsMap {
  Input: ControlProps<InstanceType<typeof ElementPlus.ElInput>['$props']>;
  InputNumber: ControlProps<
    InstanceType<typeof ElementPlus.ElInputNumber>['$props']
  >;
  Select: ControlProps<InstanceType<typeof ElementPlus.ElSelect>['$props']>;
  TreeSelect: ControlProps<
    InstanceType<typeof ElementPlus.ElTreeSelect>['$props']
  >;
  Cascader: ControlProps<InstanceType<typeof ElementPlus.ElCascader>['$props']>;
  DatePicker: ControlProps<
    InstanceType<typeof ElementPlus.ElDatePicker>['$props']
  >;
  TimePicker: ControlProps<
    InstanceType<typeof ElementPlus.ElTimePicker>['$props']
  >;
  TimeSelect: ControlProps<
    InstanceType<typeof ElementPlus.ElTimeSelect>['$props']
  >;
  RadioGroup: ControlProps<
    InstanceType<typeof ElementPlus.ElRadioGroup>['$props']
  >;
  CheckboxGroup: ControlProps<
    InstanceType<typeof ElementPlus.ElCheckboxGroup>['$props']
  >;
  Switch: ControlProps<InstanceType<typeof ElementPlus.ElSwitch>['$props']>;
  Slider: ControlProps<InstanceType<typeof ElementPlus.ElSlider>['$props']>;
  Rate: ControlProps<InstanceType<typeof ElementPlus.ElRate>['$props']>;
  ColorPicker: ControlProps<
    InstanceType<typeof ElementPlus.ElColorPicker>['$props']
  >;
  Progress: ControlProps<InstanceType<typeof ElementPlus.ElProgress>['$props']>;
  InputPassword: CrudComponentPropsMap['Input'];
  Textarea: CrudComponentPropsMap['Input'];
}
export type CrudFieldComponent = keyof CrudComponentPropsMap | Component;

export interface CrudOption {
  label: string;
  value: string | number | boolean;
  disabled?: boolean;
}

export interface CrudFormSchemaBase<T extends CrudRecord = CrudRecord> {
  field: Extract<keyof T, string> | string;
  label: string;
  kind?: 'field' | 'content';
  visible?: boolean;
  itemProps?: Record<string, unknown>;
  labelRender?: () => import('vue').VNodeChild;
  class?: string;
  style?: CSSProperties;
  placeholder?: string;
  defaultValue?: any;
  options?: CrudOption[];
  rules?: FormItemRule | FormItemRule[];
  /** Element Layout 栅格：默认半行，内容分区默认整行。 */
  span?: number;
  colProps?: Partial<import('element-plus').ColProps>;
  width?: string | number;
  hidden?: boolean | ((model: CrudRecord) => boolean);
  render?: (params: {
    model: CrudRecord;
    schema: CrudFormSchema<T>;
    field: string;
  }) => VNode | string | number;
}

export type CrudComponentSchema =
  | {
      [K in keyof CrudComponentPropsMap]: {
        component: K;
        props?: CrudComponentPropsMap[K];
      };
    }[keyof CrudComponentPropsMap]
  | { component?: undefined; props?: CrudComponentPropsMap['Input'] }
  // 自定义组件的属性由其自身契约或 render 检查，不放宽原生字符串组件。
  | { component: Component; props?: object & CrudFieldProps };

export type CrudFormSchema<T extends CrudRecord = CrudRecord> =
  CrudFormSchemaBase<T> & CrudComponentSchema;
export type CrudFormSchemaConfig<T extends CrudRecord = CrudRecord> = Partial<
  CrudFormSchemaBase<T>
> &
  CrudComponentSchema;

export interface CrudColumn<T extends CrudRecord = CrudRecord> {
  prop: Extract<keyof T, string> | string;
  label: string;
  width?: string | number;
  minWidth?: string | number;
  fixed?: true | 'left' | 'right';
  align?: TableColumnCtx<T>['align'];
  sortable?: boolean | 'custom';
  type?: 'selection' | 'index' | 'expand';
  headerRender?: (scope: {
    column: TableColumnCtx<T>;
    index: number;
    $index?: number;
  }) => import('vue').VNodeChild;
  columnProps?: Record<string, unknown>;
  hideInTable?: boolean;
  hideInSearch?: boolean;
  formatter?: (row: T, value: any, index: number) => string | number;
  render?: CrudCellRender<T>;
  search?: false | CrudFormSchemaConfig<T>;
  form?: false | CrudFormSchemaConfig<T>;
  detail?: false | Partial<CrudDetailSchema<T>>;
}

export interface CrudDetailSchema<T extends CrudRecord = CrudRecord> {
  field: Extract<keyof T, string> | string;
  label: string;
  span?: number;
  width?: string | number;
  labelWidth?: string | number;
  hidden?: boolean | ((record: Partial<T> | CrudRecord) => boolean);
  props?: Record<string, any>;
  formatter?: (record: T, value: any, index: number) => string | number;
  render?: (params: {
    record: T;
    value: any;
    index: number;
    schema: CrudDetailSchema<T>;
    field: string;
  }) => VNode | string | number;
}

export interface CrudRequestParams {
  page: number;
  pageSize: number;
  [key: string]: any;
}

export interface CrudListResult<T extends CrudRecord = CrudRecord> {
  list: T[];
  total: number;
}

export type CrudRequest<T extends CrudRecord = CrudRecord> = (
  params: CrudRequestParams,
) => Promise<CrudListResult<T>> | CrudListResult<T>;

export interface CrudSubmitContext<T extends CrudRecord = CrudRecord> {
  mode: 'create' | 'edit';
  row?: T;
}

export type CrudCreate<T extends CrudRecord = CrudRecord> = (
  values: Partial<T>,
) => Promise<void> | void;

export type CrudUpdate<T extends CrudRecord = CrudRecord> = (
  values: Partial<T>,
  row: T,
) => Promise<void> | void;

export type CrudRemove<T extends CrudRecord = CrudRecord> = (
  row: T,
) => Promise<void> | void;

export interface DynamicTableExpose<T extends CrudRecord = CrudRecord> {
  reload: () => Promise<void>;
  openCreate: () => void;
  openEdit: (row: T) => void;
  getSearchModel: () => CrudRecord;
  getElTableInstance: () => TableInstance | undefined;
  clearSelection: TableInstance['clearSelection'];
  toggleRowSelection: TableInstance['toggleRowSelection'];
}

export type CrudExpose<T extends CrudRecord = CrudRecord> =
  DynamicTableExpose<T>;

export interface SchemaFormExpose {
  validate: FormInstance['validate'];
  validateField: FormInstance['validateField'];
  clearValidate: FormInstance['clearValidate'];
  scrollToField: FormInstance['scrollToField'];
  resetFormFields: FormInstance['resetFields'];
  resetFields: () => Promise<void> | undefined;
  setFieldsValue: (value: CrudRecord) => void | undefined;
  getFieldsValue: () => CrudRecord | undefined;
}

export interface SchemaFormDialogExpose {
  submit: () => Promise<void>;
  close: () => void;
  cancel: () => void;
  setFieldsValue: (value: CrudRecord) => void | undefined;
  getFieldsValue: () => CrudRecord | undefined;
}

export type CrudCellRender<T extends CrudRecord = CrudRecord> = (scope: {
  row: T;
  value: any;
  index: number;
}) => VNode | string | number;
