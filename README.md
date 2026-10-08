# Element CRUD

基于 Vue 3 + Element Plus 的配置式 CRUD 组件库。页面只维护列配置、表单配置和数据方法，组件统一处理搜索、表格、分页、弹窗表单、增删改刷新。

## 快速启动

```bash
npm install
npm run dev
```

## 组件注册

```ts
import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import DynamicCrud from '@mercerry/element-crud';
import '@mercerry/element-crud/dist/style.css';

createApp(App).use(ElementPlus).use(DynamicCrud).mount('#app');
```

也可以按需引入：

```ts
import {
  DynamicTable,
  DynamicDetail,
  CrudForm,
  CrudFormDialog,
  CrudSchemaForm,
  useTable,
  useForm,
  useDialog,
} from '@mercerry/element-crud';
```

## 基础示例

```vue
<template>
  <DynamicTable
    title="用户管理"
    entity-name="用户"
    :columns="columns"
    :form-schemas="formSchemas"
    :request="queryUsers"
    :create="createUser"
    :update="updateUser"
    :remove="removeUser"
  />
</template>

<script setup lang="ts">
import type { CrudColumn, CrudFormSchema } from '@mercerry/element-crud';

interface User {
  id: number;
  username: string;
  status: 'enabled' | 'disabled';
}

const columns: CrudColumn<User>[] = [
  {
    prop: 'username',
    label: '用户账号',
    search: { placeholder: '按账号搜索' },
  },
  {
    prop: 'status',
    label: '状态',
    search: {
      component: 'Select',
      options: [
        { label: '启用', value: 'enabled' },
        { label: '停用', value: 'disabled' },
      ],
    },
  },
];

const formSchemas: CrudFormSchema<User>[] = [
  {
    field: 'username',
    label: '用户账号',
    rules: [{ required: true, message: '请输入账号' }],
  },
  { field: 'status', label: '状态', component: 'RadioGroup' },
];
</script>
```

完整 mock 示例见 [src/examples/ExamplePage.vue](/Users/mercerry/projects/element-crud/src/examples/ExamplePage.vue)。

## 推荐目录拆分

示例页已经拆成三类文件：

| 文件                           | 说明                                |
| ------------------------------ | ----------------------------------- |
| `src/examples/columns.tsx`     | 表格列配置、搜索配置、列 TSX render |
| `src/examples/formSchemas.tsx` | 弹窗表单配置、表单 TSX render       |
| `src/examples/ExamplePage.vue` | 页面组合、模板插槽、独立弹窗表单    |

```ts
import { columns } from './columns';
import { formSchemas } from './formSchemas';
```

## 插槽模板示例

```vue
<DynamicTable :columns="columns">
  <template #cell-status="{ row }">
    <el-tag :type="row.status === 'enabled' ? 'success' : 'danger'">
      {{ row.status }}
    </el-tag>
  </template>

  <template #toolbar-after>
    <el-button>导出</el-button>
  </template>
</DynamicTable>
```

## TSX render 示例

`columns.tsx`：

```tsx
import { ElTag } from 'element-plus';

export const columns = [
  {
    prop: 'role',
    label: '角色',
    render: ({ row }) => <ElTag type="info">{row.role}</ElTag>,
  },
];
```

`formSchemas.tsx`：

```tsx
import { ElAlert } from 'element-plus';

export const formSchemas = [
  {
    field: 'formTip',
    label: ' ',
    span: 24,
    render: () => <ElAlert title="自定义提示" type="info" closable={false} />,
  },
];
```

## 独立表单和弹窗

`CrudForm` 适合非表格场景的动态表单，`CrudFormDialog` 适合独立新增/编辑弹窗。

```vue
<CrudFormDialog
  v-model="visible"
  title="独立弹窗表单"
  :schemas="formSchemas"
  :initial-values="record"
  @submit="handleSubmit"
/>
```

```ts
async function handleSubmit(values, done) {
  try {
    await save(values);
    visible.value = false;
  } finally {
    done();
  }
}
```

## 详情组件

`DynamicDetail` 基于 `el-descriptions` 封装，支持直接复用 `columns` 自动生成详情项，也支持传入独立的 `schemas` 配置。

```vue
<el-dialog v-model="detailVisible" title="用户详情" width="760px">
  <DynamicDetail :record="detailRecord" :columns="columns" :column="2" border>
    <template #detail-status="{ record }">
      <el-tag :type="record.status === 'enabled' ? 'success' : 'danger'">
        {{ record.status }}
      </el-tag>
    </template>
  </DynamicDetail>
</el-dialog>
```

```tsx
export const detailSchemas = [
  { field: 'username', label: '用户账号' },
  {
    field: 'profileProgress',
    label: '资料完整度',
    render: ({ value }) => <ElProgress percentage={value} />,
  },
];
```

## Hooks

```ts
const { tableRef, reload, openCreate, openEdit, getSearchModel } =
  useTable<User>();
const {
  formRef,
  model,
  validate,
  resetFields,
  setFieldsValue,
  getFieldsValue,
} = useForm<User>({
  status: 'enabled',
});
const detailDialog = useDialog<User>();
```

```vue
<DynamicTable ref="tableRef" :columns="columns" :request="queryUsers" />
<SchemaForm ref="formRef" v-model="model" :schemas="formSchemas" />
<el-button @click="detailDialog.openDetail(row)">详情</el-button>
```

## DynamicTable Props

| 参数                       | 说明                                                 | 默认值              |
| -------------------------- | ---------------------------------------------------- | ------------------- |
| `columns`                  | 表格列配置，也可派生搜索项和表单项                   | 必填                |
| `formSchemas`              | 弹窗表单 schema，不传时由 `columns.form` 派生        | `[]`                |
| `request`                  | 列表请求函数，入参包含 `page`、`pageSize` 和搜索条件 | `undefined`         |
| `create`                   | 新增保存函数                                         | `undefined`         |
| `update`                   | 编辑保存函数                                         | `undefined`         |
| `remove`                   | 删除函数                                             | `undefined`         |
| `title`                    | 表格标题                                             | `undefined`         |
| `entityName`               | 弹窗标题中的实体名称                                 | `数据`              |
| `rowKey`                   | 行唯一键                                             | `id`                |
| `search`                   | 是否显示搜索表单                                     | `true`              |
| `searchCollapsible`        | 搜索项过多时是否启用自动折叠                         | `true`              |
| `searchDefaultCollapsed`   | 首次渲染搜索表单是否默认收起                         | `true`              |
| `searchCollapsedItemCount` | 收起展示数量；`auto` 按可用宽度计算，也可传数字      | `auto`              |
| `searchLabelWidth`         | 搜索表单 label 宽度                                  | `88`                |
| `pagination`               | 是否显示分页                                         | `true`              |
| `pageSizes`                | 分页 pageSize 可选值                                 | `[10, 20, 50, 100]` |
| `defaultPageSize`          | 默认每页条数                                         | `10`                |
| `showCreate`               | 是否显示新增按钮                                     | `true`              |
| `showActions`              | 是否显示操作列                                       | `true`              |
| `showSelection`            | 是否显示多选列                                       | `false`             |
| `showIndex`                | 是否显示序号列                                       | `true`              |
| `dialogWidth`              | 新增/编辑弹窗宽度                                    | `720`               |
| `formLabelWidth`           | 弹窗表单 label 宽度                                  | `96`                |
| `tableProps`               | 透传给 `el-table` 的属性                             | `{}`                |

## DynamicDetail Props

| 参数               | 说明                                 | 默认值         |
| ------------------ | ------------------------------------ | -------------- |
| `record`           | 当前详情数据，为空时显示空状态       | `null`         |
| `columns`          | 用于自动派生详情项的表格列配置       | `[]`           |
| `schemas`          | 独立详情项配置，优先级高于 `columns` | `[]`           |
| `title`            | 详情标题                             | `undefined`    |
| `column`           | 每行展示几项                         | `2`            |
| `border`           | 是否显示边框                         | `true`         |
| `labelWidth`       | 详情项 label 宽度                    | `120`          |
| `emptyText`        | 无数据文案                           | `暂无详情数据` |
| `descriptionProps` | 透传给 `el-descriptions` 的参数      | `{}`           |

## DetailSchema 配置

| 字段         | 说明                                     |
| ------------ | ---------------------------------------- |
| `field`      | 详情字段                                 |
| `label`      | 详情项名称                               |
| `span`       | 跨列数量                                 |
| `width`      | 内容宽度                                 |
| `labelWidth` | 单项 label 宽度                          |
| `hidden`     | 是否隐藏，支持函数 `(record) => boolean` |
| `props`      | 透传给 `el-descriptions-item` 的参数     |
| `formatter`  | 详情值格式化函数                         |
| `render`     | TSX 自定义详情项渲染函数                 |

## Column 配置

| 字段           | 说明                                              |
| -------------- | ------------------------------------------------- |
| `prop`         | 数据字段                                          |
| `label`        | 表格列名、默认搜索 label、默认表单 label          |
| `hideInTable`  | 不在表格中展示                                    |
| `hideInSearch` | 不生成搜索项                                      |
| `search`       | `false` 表示不搜索；对象会合并到搜索 schema       |
| `form`         | `false` 表示不进弹窗表单；对象会合并到表单 schema |
| `formatter`    | 单元格格式化函数                                  |

## 搜索表单折叠

通过 `searchCollapsible` 控制整个折叠功能。设为 `false` 时不渲染展开/收起按钮、不预留按钮占位，直接显示全部未被 `hidden` 隐藏的搜索项；宽度不足时自然换行，查询和重置保持可用。

```vue
<DynamicTable
  :columns="columns"
  :request="queryList"
  :search-collapsible="false"
/>
<!-- 独立搜索表单使用对应的 collapsible 配置。 -->
<SchemaForm
  v-model="searchModel"
  :schemas="searchSchemas"
  inline
  :collapsible="false"
/>
```

`searchDefaultCollapsed` 只控制初始收起状态，不能替代 `searchCollapsible` 功能开关。

`DynamicTable` 默认开启搜索项自动折叠。默认 `searchCollapsedItemCount="auto"`，按容器实际宽度和操作区占位展示首行字段，并在查询按钮旁显示 `展开/收起`。展开和收起只做外层高度动画，避免字段位移和透明度动画造成抖动。

```vue
<DynamicTable
  :columns="columns"
  :request="queryList"
  :search-collapsible="true"
  :search-default-collapsed="true"
  search-collapsed-item-count="auto"
/>
```

## FormSchema 配置

`component` 支持 `Input`、`InputPassword`、`InputNumber`、`Textarea`、`Select`、`TreeSelect`、`Cascader`、`DatePicker`、`TimePicker`、`TimeSelect`、`RadioGroup`、`CheckboxGroup`、`Switch`、`Slider`、`Rate`、`ColorPicker`、`Progress`，也可以传 Vue 组件。

常用字段：

| 字段                | 说明                                                             |
| ------------------- | ---------------------------------------------------------------- |
| `field`             | 表单字段                                                         |
| `label`             | 表单项名称                                                       |
| `options`           | `Select`、`RadioGroup`、`CheckboxGroup` 的选项                   |
| `rules`             | Element Plus 表单校验规则                                        |
| `props`             | 按 component 提示并检查的 Element Plus 属性及事件                |
| `span` / `colProps` | 搜索、编辑表单的 Element Layout 配置，默认半行                   |
| `width`             | 旧字段保留兼容；栅格使用 span/colProps，控件限宽使用 props.style |
| `defaultValue`      | 新增或重置时的默认值                                             |
| `render`            | TSX 自定义表单项渲染函数                                         |

### TreeSelect 示例

```ts
{
  field: 'deptId',
  label: '所属部门',
  component: 'TreeSelect',
  props: {
    data: [
      {
        label: '总部',
        value: 1,
        children: [{ label: '安全运营部', value: 2 }],
      },
    ],
    checkStrictly: true,
    filterable: true,
  },
}
```

### Progress 示例

`Progress` 通常用于详情或只读表单展示。组件会优先读取 `props.percentage`，否则使用当前字段值。

```ts
{
  field: 'profileProgress',
  label: '资料完整度',
  component: 'Progress',
  defaultValue: 60,
}
```

## Mock 数据

示例页没有接后端接口，`src/examples/mockUserService.ts` 使用内存数组模拟列表、筛选、分页、新增、编辑、删除。真实接口接入时只需要替换 `request/create/update/remove`。

## Element Plus 原生参数

`CrudFormSchema.props` 会透传给实际 Element Plus 组件。需要配置原生参数时，可以直接查看对应官方文档：

| component                              | 原生组件            | 文档                                                                  |
| -------------------------------------- | ------------------- | --------------------------------------------------------------------- |
| `Input` / `Textarea` / `InputPassword` | `el-input`          | [Input](https://element-plus.org/en-US/component/input)               |
| `InputNumber`                          | `el-input-number`   | [Input Number](https://element-plus.org/en-US/component/input-number) |
| `Select`                               | `el-select`         | [Select](https://element-plus.org/en-US/component/select)             |
| `TreeSelect`                           | `el-tree-select`    | [Tree Select](https://element-plus.org/en-US/component/tree-select)   |
| `Cascader`                             | `el-cascader`       | [Cascader](https://element-plus.org/en-US/component/cascader)         |
| `DatePicker`                           | `el-date-picker`    | [Date Picker](https://element-plus.org/en-US/component/date-picker)   |
| `TimePicker`                           | `el-time-picker`    | [Time Picker](https://element-plus.org/en-US/component/time-picker)   |
| `TimeSelect`                           | `el-time-select`    | [Time Select](https://element-plus.org/en-US/component/time-select)   |
| `RadioGroup`                           | `el-radio-group`    | [Radio](https://element-plus.org/en-US/component/radio)               |
| `CheckboxGroup`                        | `el-checkbox-group` | [Checkbox](https://element-plus.org/en-US/component/checkbox)         |
| `Switch`                               | `el-switch`         | [Switch](https://element-plus.org/en-US/component/switch)             |
| `Slider`                               | `el-slider`         | [Slider](https://element-plus.org/en-US/component/slider)             |
| `Rate`                                 | `el-rate`           | [Rate](https://element-plus.org/en-US/component/rate)                 |
| `ColorPicker`                          | `el-color-picker`   | [Color Picker](https://element-plus.org/en-US/component/color-picker) |
| `Progress`                             | `el-progress`       | [Progress](https://element-plus.org/en-US/component/progress)         |

### 0.2.0 接入更新

- 搜索、编辑统一 Element Layout，默认两列，xs 单列；通过 span/colProps/gutter 调整。
- component 与原生 props 联动检查，业务可扩展 CrudFieldProps。
- CrudConfigProvider / installCrudConfig 支持响应式文案配置，提供 zhCN/enUS。
- CSS 变量跟随 Element Plus 主题；库内测试、Lint、格式与 CI 已统一，运行 `pnpm check`。

配置示例与兼容说明见 [使用文档](docs/usage.md#022类型文案和主题配置)。
