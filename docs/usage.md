# 使用说明

`ElementCrud` 的目标是减少后台管理页面重复代码。推荐把页面拆成三块：

1. `columns`：定义表格列、搜索项、表单项。
2. `request/create/update/remove`：定义数据动作，mock 或真实接口都可以。
3. 插槽：只处理少量特殊列渲染，例如状态标签、头像、操作扩展。

## request 参数

组件调用 `request` 时会传入：

```ts
{
  page: 1,
  pageSize: 10,
  ...searchModel
}
```

返回值固定为：

```ts
{
  list: [],
  total: 0
}
```

这样分页参数可以先保留在 mock 中，后续接接口时无需修改页面结构。

## 单元格插槽

按字段名声明插槽：

```vue
<ElementCrud :columns="columns">
  <template #cell-status="{ row }">
    <el-tag :type="row.status === 'enabled' ? 'success' : 'danger'">
      {{ row.status }}
    </el-tag>
  </template>
</ElementCrud>
```

## 操作列插槽

```vue
<template #actions="{ row, openEdit, removeRow }">
  <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
  <el-button link type="danger" @click="removeRow(row)">删除</el-button>
</template>
```

## TSX render

表格列和表单项都支持 TSX render。适合状态标签、进度条、组合提示、复杂表单区域。

`columns.tsx`：

```tsx
import { ElProgress, ElTag } from 'element-plus';

export const columns = [
  {
    prop: 'role',
    label: '角色',
    render: ({ row }) => <ElTag type="info">{row.role}</ElTag>,
  },
  {
    prop: 'profileProgress',
    label: '资料完整度',
    render: ({ row }) => <ElProgress percentage={row.profileProgress} />,
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
    render: () => <ElAlert title="表单提示" type="info" closable={false} />,
  },
];
```

## 独立弹窗表单

```vue
<CrudFormDialog
  v-model="visible"
  title="独立弹窗表单"
  :schemas="formSchemas"
  :initial-values="record"
  @submit="handleSubmit"
/>
```

`submit` 事件第二个参数是 `done`，异步提交完成后调用它释放保存按钮 loading。

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

## 暴露方法

通过 `ref` 可以调用：

| 方法 | 说明 |
| --- | --- |
| `reload()` | 重新请求列表 |
| `openCreate()` | 打开新增弹窗 |
| `openEdit(row)` | 打开编辑弹窗 |
| `getSearchModel()` | 获取当前搜索条件 |

## 支持的表单组件

| component | 对应 Element Plus 组件 | 备注 |
| --- | --- | --- |
| `Input` | `el-input` | 默认组件 |
| `InputPassword` | `el-input` | 自动设置 `type=password` 和 `showPassword` |
| `InputNumber` | `el-input-number` | 数字输入 |
| `Textarea` | `el-input` | 自动设置 `type=textarea` |
| `Select` | `el-select` | 使用 `options` 渲染 `el-option` |
| `TreeSelect` | `el-tree-select` | 树数据通过 `props.data` 传入 |
| `Cascader` | `el-cascader` | 级联数据通过 `props.options` 传入 |
| `DatePicker` | `el-date-picker` | 日期选择 |
| `TimePicker` | `el-time-picker` | 时间选择 |
| `TimeSelect` | `el-time-select` | 时间段选择 |
| `RadioGroup` | `el-radio-group` | 使用 `options` 渲染单选 |
| `CheckboxGroup` | `el-checkbox-group` | 使用 `options` 渲染多选 |
| `Switch` | `el-switch` | 开关 |
| `Slider` | `el-slider` | 滑块 |
| `Rate` | `el-rate` | 评分 |
| `ColorPicker` | `el-color-picker` | 颜色选择 |
| `Progress` | `el-progress` | 优先使用 `props.percentage`，否则读取字段值 |

## 搜索表单宽度

搜索表单使用 inline 模式时，所有控件默认宽度为 `224px`，`Input`、`Select`、`TreeSelect`、`Cascader`、`DatePicker`、`Progress` 等会统一占满该宽度。

单项覆盖：

```ts
{
  field: 'deptId',
  label: '部门',
  component: 'TreeSelect',
  width: 280,
  props: {
    data: deptTree,
    filterable: true,
  },
}
```

## 搜索表单折叠

`ElementCrud` 默认开启自动折叠：

| 参数 | 说明 | 默认值 |
| --- | --- | --- |
| `searchCollapsible` | 搜索项过多时是否启用折叠 | `true` |
| `searchDefaultCollapsed` | 首次渲染是否默认收起 | `true` |
| `searchCollapsedItemCount` | 收起状态展示几个搜索项 | `3` |

超过 `searchCollapsedItemCount` 的搜索项会被自动收起，点击 `展开/收起` 后通过动画进入或离开。

```vue
<ElementCrud
  :columns="columns"
  :request="queryList"
  :search-collapsible="true"
  :search-collapsed-item-count="4"
/>
```

## 原生组件参数链接

`CrudFormSchema.props` 直接透传给 Element Plus 原生组件。常用文档：

| component | 原生组件 | 文档 |
| --- | --- | --- |
| `Input` / `Textarea` / `InputPassword` | `el-input` | [Input](https://element-plus.org/en-US/component/input) |
| `InputNumber` | `el-input-number` | [Input Number](https://element-plus.org/en-US/component/input-number) |
| `Select` | `el-select` | [Select](https://element-plus.org/en-US/component/select) |
| `TreeSelect` | `el-tree-select` | [Tree Select](https://element-plus.org/en-US/component/tree-select) |
| `Cascader` | `el-cascader` | [Cascader](https://element-plus.org/en-US/component/cascader) |
| `DatePicker` | `el-date-picker` | [Date Picker](https://element-plus.org/en-US/component/date-picker) |
| `TimePicker` | `el-time-picker` | [Time Picker](https://element-plus.org/en-US/component/time-picker) |
| `TimeSelect` | `el-time-select` | [Time Select](https://element-plus.org/en-US/component/time-select) |
| `RadioGroup` | `el-radio-group` | [Radio](https://element-plus.org/en-US/component/radio) |
| `CheckboxGroup` | `el-checkbox-group` | [Checkbox](https://element-plus.org/en-US/component/checkbox) |
| `Switch` | `el-switch` | [Switch](https://element-plus.org/en-US/component/switch) |
| `Slider` | `el-slider` | [Slider](https://element-plus.org/en-US/component/slider) |
| `Rate` | `el-rate` | [Rate](https://element-plus.org/en-US/component/rate) |
| `ColorPicker` | `el-color-picker` | [Color Picker](https://element-plus.org/en-US/component/color-picker) |
| `Progress` | `el-progress` | [Progress](https://element-plus.org/en-US/component/progress) |
