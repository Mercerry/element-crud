import type { CrudFormSchema } from '../src';
const select: CrudFormSchema = {
  field: 'status',
  label: '状态',
  component: 'Select',
  props: { filterable: true, multiple: true },
};
const input: CrudFormSchema = {
  field: 'name',
  label: '名称',
  props: { maxlength: 10 },
};
// prettier-ignore
// @ts-expect-error Select 不接受数字框的 precision。
const bad: CrudFormSchema = { field: 'status', label: '状态', component: 'Select', props: { precision: 2 }, };
// prettier-ignore
// @ts-expect-error multiple 必须是布尔值，不能退化成 any。
const badValue: CrudFormSchema = { field: 'status', label: '状态', component: 'Select', props: { multiple: 'yes' }, };
void [select, input, bad, badValue];
