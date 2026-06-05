import { ElAlert } from 'element-plus';
import type { CrudFormSchema } from '@/components/element-crud';
import type { MockUser } from './mockUserService';
import { columns } from './columns';

export const formSchemas: CrudFormSchema<MockUser>[] = [
  ...columns
    .filter((column) => column.form !== false)
    .map((column) => ({
      field: column.prop,
      label: column.label,
      component: 'Input' as const,
      span: ['remark', 'email'].includes(String(column.prop)) ? 24 : 12,
      ...(typeof column.form === 'object' ? column.form : {}),
    })),
  {
    field: 'formTip',
    label: ' ',
    span: 24,
    // 表单 TSX render 示例：用于提示、组合布局或复杂自定义控件。
    render: () => (
      <ElAlert
        title="TSX render 示例：这条提示来自 formSchemas.tsx，可用于渲染任意自定义表单内容。"
        type="info"
        showIcon
        closable={false}
      />
    ),
  },
];
