import { ElProgress, ElTag } from 'element-plus';
import type { CrudColumn } from '@/components/element-crud';
import {
  deptTree,
  getDeptName,
  getRoleName,
  getStatusName,
  type MockUser,
} from './mockUserService';

export const roleOptions = [
  { label: '管理员', value: 'admin' },
  { label: '审计员', value: 'auditor' },
  { label: '运营人员', value: 'operator' },
];

export const statusOptions = [
  { label: '启用', value: 'enabled' },
  { label: '停用', value: 'disabled' },
];

export const columns: CrudColumn<MockUser>[] = [
  {
    prop: 'username',
    label: '用户账号',
    width: 150,
    search: {
      placeholder: '按账号搜索',
    },
    form: {
      rules: [{ required: true, message: '请输入用户账号', trigger: 'blur' }],
    },
  },
  {
    prop: 'nickname',
    label: '用户昵称',
    width: 140,
    search: {
      placeholder: '按昵称搜索',
      width: 224,
    },
    form: {
      rules: [{ required: true, message: '请输入用户昵称', trigger: 'blur' }],
    },
  },
  {
    prop: 'deptId',
    label: '所属部门',
    width: 150,
    search: {
      component: 'TreeSelect',
      placeholder: '全部部门',
      width: 240,
      props: {
        data: deptTree,
        checkStrictly: true,
        filterable: true,
      },
    },
    form: {
      component: 'TreeSelect',
      props: {
        data: deptTree,
        checkStrictly: true,
        filterable: true,
      },
      rules: [{ required: true, message: '请选择所属部门', trigger: 'change' }],
    },
  },
  {
    prop: 'role',
    label: '角色',
    width: 120,
    search: {
      component: 'Select',
      placeholder: '全部角色',
      width: 180,
      options: roleOptions,
    },
    form: {
      component: 'Select',
      options: roleOptions,
      rules: [{ required: true, message: '请选择角色', trigger: 'change' }],
    },
    // TSX render 示例：不写模板插槽，直接在 columns.tsx 里声明单元格渲染。
    render: ({ row }) => <ElTag type="info">{getRoleName(row.role)}</ElTag>,
  },
  {
    prop: 'status',
    label: '状态',
    width: 110,
    search: {
      component: 'Select',
      placeholder: '全部状态',
      width: 180,
      options: statusOptions,
    },
    form: {
      component: 'RadioGroup',
      options: statusOptions,
      defaultValue: 'enabled',
    },
  },
  {
    prop: 'profileProgress',
    label: '资料完整度',
    width: 150,
    hideInSearch: true,
    form: {
      component: 'Slider',
      defaultValue: 60,
      props: {
        min: 0,
        max: 100,
        step: 5,
        showInput: true,
      },
    },
    render: ({ row }) => (
      <ElProgress percentage={row.profileProgress} strokeWidth={8} />
    ),
  },
  {
    prop: 'profileProgressOperator',
    label: '完整度条件',
    hideInTable: true,
    form: false,
    search: {
      component: 'Select',
      width: 120,
      defaultValue: 'gte',
      options: [
        { label: '大于等于', value: 'gte' },
        { label: '小于等于', value: 'lte' },
        { label: '等于', value: 'eq' },
      ],
    },
  },
  {
    prop: 'profileProgressValue',
    label: '完整度阈值',
    hideInTable: true,
    form: false,
    search: {
      component: 'InputNumber',
      width: 120,
      props: {
        min: 0,
        max: 100,
        step: 5,
      },
    },
  },
  {
    prop: 'phone',
    label: '手机号',
    width: 150,
    search: {
      placeholder: '按手机号搜索',
    },
  },
  {
    prop: 'email',
    label: '邮箱',
    width: 210,
    search: {
      placeholder: '按邮箱搜索',
      width: 260,
    },
  },
  {
    prop: 'createdAt',
    label: '创建日期',
    width: 140,
    search: {
      component: 'DatePicker',
      width: 180,
      props: {
        type: 'date',
        valueFormat: 'YYYY-MM-DD',
      },
    },
    form: {
      component: 'DatePicker',
      props: {
        type: 'date',
        valueFormat: 'YYYY-MM-DD',
      },
    },
  },
  {
    prop: 'remark',
    label: '备注',
    width: 200,
    hideInSearch: true,
    form: {
      component: 'Textarea',
      span: 24,
    },
  },
];

export function formatDeptCell(row: MockUser) {
  return getDeptName(row.deptId);
}

export function formatStatusCell(row: MockUser) {
  return getStatusName(row.status);
}
