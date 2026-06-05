import type { Component, VNode } from 'vue';
import type { FormItemRule, TableColumnCtx } from 'element-plus';

export type CrudRecord = Record<string, any>;

export type CrudFieldComponent =
  | 'Input'
  | 'InputPassword'
  | 'InputNumber'
  | 'Textarea'
  | 'Select'
  | 'TreeSelect'
  | 'Cascader'
  | 'DatePicker'
  | 'TimePicker'
  | 'TimeSelect'
  | 'RadioGroup'
  | 'CheckboxGroup'
  | 'Switch'
  | 'Slider'
  | 'Rate'
  | 'ColorPicker'
  | 'Progress'
  | Component;

export interface CrudOption {
  label: string;
  value: string | number | boolean;
  disabled?: boolean;
}

export interface CrudFormSchema<T extends CrudRecord = CrudRecord> {
  field: Extract<keyof T, string> | string;
  label: string;
  component?: CrudFieldComponent;
  placeholder?: string;
  defaultValue?: any;
  options?: CrudOption[];
  rules?: FormItemRule | FormItemRule[];
  props?: Record<string, any>;
  span?: number;
  width?: string | number;
  hidden?: boolean | ((model: CrudRecord) => boolean);
  render?: (params: { model: CrudRecord; schema: CrudFormSchema<T>; field: string }) => VNode | string | number;
}

export interface CrudColumn<T extends CrudRecord = CrudRecord> {
  prop: Extract<keyof T, string> | string;
  label: string;
  width?: string | number;
  minWidth?: string | number;
  fixed?: true | 'left' | 'right';
  align?: TableColumnCtx<T>['align'];
  sortable?: boolean | 'custom';
  hideInTable?: boolean;
  hideInSearch?: boolean;
  formatter?: (row: T, value: any, index: number) => string | number;
  render?: CrudCellRender<T>;
  search?: false | Partial<CrudFormSchema<T>>;
  form?: false | Partial<CrudFormSchema<T>>;
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

export type CrudCreate<T extends CrudRecord = CrudRecord> = (values: Partial<T>) => Promise<void> | void;

export type CrudUpdate<T extends CrudRecord = CrudRecord> = (
  values: Partial<T>,
  row: T,
) => Promise<void> | void;

export type CrudRemove<T extends CrudRecord = CrudRecord> = (row: T) => Promise<void> | void;

export interface CrudExpose<T extends CrudRecord = CrudRecord> {
  reload: () => Promise<void>;
  openCreate: () => void;
  openEdit: (row: T) => void;
  getSearchModel: () => CrudRecord;
}

export type CrudCellRender<T extends CrudRecord = CrudRecord> = (scope: {
  row: T;
  value: any;
  index: number;
}) => VNode | string | number;
