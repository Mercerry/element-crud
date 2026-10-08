# 使用说明

`DynamicTable` 的目标是减少后台管理页面重复代码。推荐把页面拆成三块：

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
<DynamicTable :columns="columns">
  <template #cell-status="{ row }">
    <el-tag :type="row.status === 'enabled' ? 'success' : 'danger'">
      {{ row.status }}
    </el-tag>
  </template>
</DynamicTable>
```

## 操作列插槽

```vue
<template #ACTIONS="{ row, openEdit, removeRow }">
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

## 详情组件

`DynamicDetail` 可以直接复用 `columns`，也可以传 `schemas` 单独配置详情项。

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

| hook                           | 说明                                                                                               |
| ------------------------------ | -------------------------------------------------------------------------------------------------- |
| `useTable<T>()`                | 返回 `tableRef`、`reload`、`openCreate`、`openEdit`、`getSearchModel`                              |
| `useForm<T>(initialValues?)`   | 返回 `formRef`、`model`、`validate`、`resetFields`、`setFieldsValue`、`getFieldsValue`             |
| `useDialog<T>(defaultValues?)` | 返回 `visible`、`mode`、`record`、`initialValues`、`openCreate`、`openEdit`、`openDetail`、`close` |

```ts
const { tableRef, reload } = useTable<User>();
const { formRef, model, validate } = useForm<User>({ status: 'enabled' });
const detailDialog = useDialog<User>();
```

```vue
<DynamicTable ref="tableRef" :columns="columns" :request="queryUsers" />
<SchemaForm ref="formRef" v-model="model" :schemas="formSchemas" />
<el-button @click="detailDialog.openDetail(row)">详情</el-button>
```

## 暴露方法

通过 `ref` 可以调用：

| 方法               | 说明             |
| ------------------ | ---------------- |
| `reload()`         | 重新请求列表     |
| `openCreate()`     | 打开新增弹窗     |
| `openEdit(row)`    | 打开编辑弹窗     |
| `getSearchModel()` | 获取当前搜索条件 |

## 支持的表单组件

| component       | 对应 Element Plus 组件 | 备注                                        |
| --------------- | ---------------------- | ------------------------------------------- |
| `Input`         | `el-input`             | 默认组件                                    |
| `InputPassword` | `el-input`             | 自动设置 `type=password` 和 `showPassword`  |
| `InputNumber`   | `el-input-number`      | 数字输入                                    |
| `Textarea`      | `el-input`             | 自动设置 `type=textarea`                    |
| `Select`        | `el-select`            | 使用 `options` 渲染 `el-option`             |
| `TreeSelect`    | `el-tree-select`       | 树数据通过 `props.data` 传入                |
| `Cascader`      | `el-cascader`          | 级联数据通过 `props.options` 传入           |
| `DatePicker`    | `el-date-picker`       | 日期选择                                    |
| `TimePicker`    | `el-time-picker`       | 时间选择                                    |
| `TimeSelect`    | `el-time-select`       | 时间段选择                                  |
| `RadioGroup`    | `el-radio-group`       | 使用 `options` 渲染单选                     |
| `CheckboxGroup` | `el-checkbox-group`    | 使用 `options` 渲染多选                     |
| `Switch`        | `el-switch`            | 开关                                        |
| `Slider`        | `el-slider`            | 滑块                                        |
| `Rate`          | `el-rate`              | 评分                                        |
| `ColorPicker`   | `el-color-picker`      | 颜色选择                                    |
| `Progress`      | `el-progress`          | 优先使用 `props.percentage`，否则读取字段值 |

## 搜索表单宽度

搜索表单使用 Element Layout，默认两列；控件占满所在列的可用宽度。通过 span/colProps 配置列宽，通过 props.style 设置控件自身限宽。

单项覆盖：

```ts
{
  field: 'deptId',
  label: '部门',
  component: 'TreeSelect',
  colProps: { xs: 24, sm: 12, lg: 8 },
  props: {
    data: deptTree,
    filterable: true,
  },
}
```

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

`DynamicTable` 默认开启自动折叠：

| 参数                       | 说明                                            | 默认值 |
| -------------------------- | ----------------------------------------------- | ------ |
| `searchCollapsible`        | 搜索项过多时是否启用折叠                        | `true` |
| `searchDefaultCollapsed`   | 首次渲染是否默认收起                            | `true` |
| `searchCollapsedItemCount` | 收起展示数量；`auto` 按可用宽度计算，也可传数字 | `auto` |

默认按容器宽度收起放不下的搜索项；显式传数字时保留固定数量行为，点击 `展开/收起` 后只做外层高度动画。

```vue
<DynamicTable
  :columns="columns"
  :request="queryList"
  :search-collapsible="true"
  search-collapsed-item-count="auto"
/>
```

### 独立表单与同步接入

`SchemaForm` / `SchemaFormBase` 同样支持 `collapsedItemCount: number | 'auto'`（默认 `auto`）。设置 `inline` 和 `collapsible` 后按实际容器宽度折叠；非 inline 模式仍默认保留 3 项。显式传数字保持固定数量语义，`collapsible=false` 展示全部字段。

- 宽度测量扣除操作区与插槽实际占位，容器、侧栏或按钮宽度变化后重新计算。为避免临界宽度反复跳动，自适应模式始终为展开按钮预留位置。
- 收起不销毁控件、不清空条件，隐藏控件不进入键盘焦点顺序；业务 `hidden` 条件仍决定字段是否渲染。
- 保留外层高度动画，连续反向点击从当前高度继续；卸载时释放观察器、动画帧及定时器，尊重系统减少动态效果设置。
- 默认显示查询和重置；字段值变化不主动提交。显式配置在 `schema.props` 中的业务事件仍由调用方负责，不会被库拦截或删除。重置继续采用 `schema.defaultValue`。
- 使用方不要用 `height: auto !important`、`transition: none !important` 覆盖字段容器；行间距由组件提供。

### 0.2.1 接入能力

- `DynamicTable` 支持 `data` 本地模式和 `request` 远程模式，共用列、选择事件、原生表格实例与插槽。`plain` 移除面板装饰，`showToolbar=false` 隐藏工具栏，`fitContainer` 允许表格随宿主容器收缩；这些布局选项均为可选项。
- 列支持 `type`、`headerRender`、`columnProps`，可通过 `getElTableInstance`、`clearSelection`、`toggleRowSelection` 操作原生表格。
- 远程请求只采用最新响应；`loadError` 交给宿主反馈，公开 `reload()` 保留 Promise 拒绝。翻页使用最近一次已提交条件，点击查询回到首页且只请求一次。
- `SchemaForm` 支持 `fieldsLayout="contents"` 供宿主管理字段网格；`kind="content"`、`itemProps`、`labelRender` 保留业务组合内容和原生字段能力。`resetValues` 可传入完整初始模型快照（包括嵌套值和组合字段）。
- `validate`、`validateField`、`clearValidate`、`scrollToField` 和 `resetFormFields` 直接使用库内部表单实例；其中 `resetFormFields` 对应原生 resetFields，原有 `resetFields` 仍触发查询重置语义。
- `SchemaFormDialog` 的 `mode="drawer"` 与默认 dialog 共用草稿、校验、提交锁和完成回调；`busy` 可接入外部加载状态。更新 schema/字典选项不会覆盖正在编辑的草稿；旧会话的完成回调不能关闭新打开的窗口。
- 搜索折叠默认启用，传 `searchCollapsible=false` 才禁用。首次挂载、字段配置切换和 KeepAlive 激活在当前渲染轮次测量，不再先显示多余按钮、下一帧才隐藏。窗口连续缩放仍通过 RAF 合并测量。

白泽 Web / Electron 已接入同一份 0.2.1 固定安装包，移除了 `useSearchFormWidth`、`SearchCollapseSync` 和本地表格重复列实现。字典、权限、业务字段组件仍在共享业务适配层。尚未发布到 npm；发布后应同时更新三个依赖入口和锁文件。

验证范围与命令记录见白泽仓库 `docs/element-crud接入优化说明.md`。库执行类型声明和示例构建；接入端执行共享业务测试、类型检查、静态检查和两端构建。真实后端及 Electron 原生窗口未纳入此次隔离组件验证。

## 原生组件参数链接

`CrudFormSchema.props` 直接透传给 Element Plus 原生组件。常用文档：

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

## 表单 Element Layout 布局

搜索、普通 SchemaForm、弹窗和抽屉表单统一使用 ElRow / ElCol，默认 span=12（两列），gutter=16。窄屏采用 xs=24 自动单列；schema.colProps 可覆盖 span、offset、push、pull、xs/sm/md/lg/xl 等原生列参数。显式 span=24 独占一行，kind=content 默认整行。字段原生参数仍放 itemProps/props，列参数放 colProps。

```ts
const schemas = [
  { field: 'name', label: '名称', component: 'Input' },
  { field: 'code', label: '编号', component: 'Input' },
  { field: 'note', label: '备注', component: 'Textarea', span: 24 },
  {
    field: 'count',
    label: '数量',
    component: 'InputNumber',
    colProps: { xs: 24, sm: 12, lg: 8 },
  },
];
```

搜索模式按栅格第一行的实际宽度自动折叠；fieldsLayout=contents 显式交给宿主管理布局时不增加栅格包装。内容分区内部的自定义布局仍由业务 render 负责。

## 0.2.1 行为契约

- `useForm().validate/resetFields`、`useTable().reload`、`useDialog().submit` 未挂载时拒绝 Promise，错误的 `code` 为 `CRUD_NOT_READY`。调用方应在挂载后执行，不再依赖旧的假成功回退。
- 字段支持点路径和数字数组下标，如 `user.name`、`rows[0].name`；表格、表单和详情共用规则。不支持含点的字面量键，拒绝原型链路径。
- 表单初始化只为缺失字段补默认值。`resetMode` 默认 `defaults`，另可选 `initial`、`empty`；`resetValues` 显式快照优先。`fieldPolicy` 默认 `preserve`，可选 `remove` 清理 schema 移除的字段。DynamicTable 对应 `searchFieldPolicy`。
- 校验失败会展开折叠区域并定位字段，字段隐藏不意味着免校验。
- 未提供 CRUD 处理函数时不显示对应默认写操作。`operationError` 返回 `{action, error, row?}`；删除取消不算错误。成功写入后的刷新错误通过 `loadError` 单独报告。
- `showEdit/showDelete/editDisabled/deleteDisabled` 接受布尔值或行判断函数；`showRefresh`、`actionWidth`、`paginationLayout` 可定制默认工具栏和分页。
- `remoteSort=true` 显式开启远程排序，request 接收 `sortBy`、`sortOrder`（ascending/descending，取消时为 undefined）；分页键由组件维护，排序变化回到第一页。
- `CrudColumn.detail` 可单独配置详情，false 隐藏；`DynamicDetail.reuseTableRender=false` 不复用表格 render，默认 true 兼容既有调用。
- 弹窗可传 `submitRequest: async values => { await save(values) }`。该模式取代 submit/done 保存入口，公开 submit 等待保存结束；失败发出 submitError 并恢复可提交状态，原 callback 模式仍保持兼容。
- 开发使用 Node 22.13+、pnpm 10；`pnpm check` 执行类型、Lint、格式、模型与组件回归测试、声明与库构建。`pnpm build` 单独构建示例。

## 0.2.1：类型、文案和主题配置

`CrudFormSchema` 按 component 判别 props：Select 提示 Select 原生属性和事件，InputNumber 提示数字框属性；传错属性或值类型会报错。省略 component 按 Input 检查；自定义 Vue 组件可传属性对象，其精确泛型契约请在 render/TSX 内检查。

```ts
import type { CrudFormSchema } from '@mercerry/element-crud';
const schemas = [
  {
    field: 'status',
    label: '状态',
    component: 'Select',
    props: { filterable: true, multiple: true },
  },
] satisfies CrudFormSchema[];
```

从 columns.form/search 生成 schema 时保留组件判别关系；动态工厂分支分别构造组件与属性，不将任意字符串断言成组件。`CrudFormSchemaBase` 提供共同字段，`CrudFieldProps` 支持宿主通过模块扩展声明明确的额外属性。

默认文案仍为中文。全局配置可用于默认插件或按需导入；响应式配置在切换时生效，各应用互相隔离：

```ts
import { reactive } from 'vue';
import { installCrudConfig, enUS } from '@mercerry/element-crud';
const config = reactive({ locale: enUS });
installCrudConfig(app, config);
// 完整插件也支持 app.use(ElementCrud, config)。
```

局部用 `<CrudConfigProvider :locale="{ search: '筛选', reset: '清空' }">` 包裹组件；未覆盖字段继承父级。导出 zhCN/enUS 和 CrudLocale，覆盖按钮、空态、成功提示、删除确认、占位符及新增/编辑标题。明确传入 confirmButtonText/cancelButtonText/emptyText 时以组件属性为准。业务字段 label 和 Element Plus 自身日期/分页文案由宿主及 ElConfigProvider 管理。

主题可在宿主容器设置以下 CSS 变量，不需要覆写库选择器：

| 变量                                            | 默认/用途                           |
| ----------------------------------------------- | ----------------------------------- |
| `--crud-background`                             | `--el-bg-color`，表格/详情背景      |
| `--crud-border-color`                           | `--el-border-color-light`，面板边框 |
| `--crud-text-primary` / `--crud-text-secondary` | Element Plus 文字色                 |
| `--crud-radius`                                 | `8px`，面板圆角                     |
| `--crud-panel-padding`                          | `18px`，搜索/表格面板留白           |
| `--crud-panel-gap`                              | `14px`，面板间距                    |
| `--crud-form-gap` / `--crud-action-gap`         | `12px` / `8px`，搜索行距和操作间距  |

搜索与编辑默认两列，xs=24；设置 span/colProps 控制列数和响应式行为，gutter 控制列间距。旧 schema.width 保留类型兼容，但栅格宽度以 span/colProps 为准；控件独立限宽请使用 props.style。fieldsLayout=contents 仍由宿主负责布局。

库内测试覆盖请求竞态、查询快照、切页折叠、弹窗锁与失效回调、动态字段、嵌套校验、删除取消/失败、远程排序、Promise 提交、详情及配置隔离。编译期负例确认错误 Select 属性不能通过；CI 与本地共用 pnpm check。


## 回车提交

`SchemaForm` / `SchemaFormBase` / `SchemaFormDialog` 提供 `submitOnEnter`，默认 `true`。开启后，普通单行输入框的 Enter 会执行原有校验，成功后触发 `submit`；弹窗继续使用原有保存请求和提交锁。关闭时查询/保存按钮仍正常工作。

```vue
<SchemaForm v-model="model" :schemas="schemas" @submit="handleSearch" />
<SchemaFormDialog v-model="visible" title="编辑" :schemas="schemas" :submit-request="save" />
<DynamicTable :columns="columns" :request="request" :search-submit-on-enter="true" :form-submit-on-enter="false" />
```

`DynamicTable.searchSubmitOnEnter` 控制搜索区，`formSubmitOnEnter` 控制内置编辑弹窗，二者默认均为 `true`。配置支持运行时切换，与折叠开关独立。升级接入后应删除字段中重复的 `onKeyup` 回车查询回调，将查询统一绑定到表单 `submit`，避免重复请求。

文本域、只读/禁用输入、输入法组词、长按重复、组合键和下拉/日期/自动完成控件的确认操作不会触发回车提交。自定义组合输入控件应使用 `role="combobox"`，或在自身键盘事件中调用 `preventDefault()` / `stopPropagation()`；原生 form 默认提交始终被拦截，不会刷新页面。表单负责校验期间防重，普通表单的异步请求状态由业务处理，弹窗则沿用库内提交锁。

关闭单个表单的回车提交：`<SchemaForm :submit-on-enter="false" ... />`。表格搜索和编辑分别传 `:search-submit-on-enter="false"`、`:form-submit-on-enter="false"`。
