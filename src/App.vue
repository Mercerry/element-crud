<template>
  <main class="app-shell">
    <aside class="app-sidebar">
      <div class="brand">
        <span class="brand-mark">EC</span>
        <div>
          <strong>Element CRUD</strong>
          <small>配置式组件库</small>
        </div>
      </div>
      <nav>
        <button
          v-for="item in navItems"
          :key="item.id"
          :class="{ active: activeSection === item.id }"
          type="button"
          @click="scrollToSection(item.id)"
        >
          {{ item.label }}
        </button>
      </nav>
    </aside>

    <section class="app-content">
      <header class="app-header">
        <div>
          <h1>Element Plus CRUD 组件库</h1>
        </div>
      </header>

      <ExamplePage id="demo" />

      <section id="docs" class="doc-section">
        <h2>使用文档</h2>
        <p>
          安装插件后可以全局使用 `DynamicTable` 和
          `SchemaFormBase`，也可以按需从包入口导入。
        </p>
        <pre><code>{{ usageCode }}</code></pre>
        <div class="doc-links">
          <button
            v-for="item in quickLinks"
            :key="item.id"
            type="button"
            @click="scrollToSection(item.id)"
          >
            {{ item.label }}
          </button>
        </div>
        <div class="usage-examples">
          <article v-for="item in usageExamples" :key="item.title">
            <h3>{{ item.title }}</h3>
            <pre><code>{{ item.code }}</code></pre>
          </article>
        </div>
      </section>

      <section id="components" class="doc-section">
        <h2>组件文档</h2>
        <div class="feature-grid">
          <article v-for="item in features" :key="item.title">
            <h3>{{ item.title }}</h3>
            <p>{{ item.desc }}</p>
          </article>
        </div>

        <div class="component-docs">
          <article v-for="component in componentDocs" :key="component.name">
            <h3>{{ component.name }}</h3>
            <p>{{ component.desc }}</p>
            <ul>
              <li v-for="item in component.items" :key="item">{{ item }}</li>
            </ul>
          </article>
        </div>
      </section>

      <section id="api" class="doc-section">
        <h2>API 文档</h2>
        <article
          v-for="table in apiTables"
          :key="table.title"
          class="api-table"
        >
          <h3>{{ table.title }}</h3>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th v-for="column in table.columns" :key="column">
                    {{ column }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in table.rows" :key="row[0]">
                  <td v-for="cell in row" :key="cell">{{ cell }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        <article class="api-table">
          <h3>Element Plus 原生组件参数</h3>
          <p>
            `CrudFormSchema.props` 会透传给实际 Element Plus
            组件，需要配置原生参数时可直接查看官方文档。
          </p>
          <div class="component-link-grid">
            <a
              v-for="item in elementPlusLinks"
              :key="item.component"
              :href="item.url"
              rel="noreferrer"
              target="_blank"
            >
              <strong>{{ item.component }}</strong>
              <span>{{ item.native }}</span>
            </a>
          </div>
        </article>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ExamplePage from './examples/ExamplePage.vue';

type ApiTable = {
  title: string;
  columns: string[];
  rows: string[][];
};

type ElementPlusLink = {
  component: string;
  native: string;
  url: string;
};

const activeSection = ref('demo');

const navItems = [
  { id: 'demo', label: 'CRUD 示例' },
  { id: 'docs', label: '使用文档' },
  { id: 'components', label: '组件文档' },
  { id: 'api', label: 'API 文档' },
];

const quickLinks = [
  { id: 'components', label: '查看组件说明' },
  { id: 'api', label: '查看 API 参数' },
];

const usageCode = [
  "import DynamicCrud, { DynamicTable, DynamicDetail, SchemaForm, SchemaFormDialog } from '@mercerry/element-crud';",
  "import { useTable, useForm, useDialog } from '@mercerry/element-crud';",
  "import '@mercerry/element-crud/dist/style.css';",
  '',
  'app.use(DynamicCrud);',
].join('\n');

const features = [
  {
    title: '配置式列',
    desc: '一份 columns 配置同时声明表格展示、搜索控件、表单控件和列渲染。',
  },
  {
    title: '保留请求参数',
    desc: '分页、pageSize、搜索条件会统一传给 request，方便后续切换真实接口。',
  },
  {
    title: '内置 CRUD',
    desc: '传入 create、update、remove 后，新增、编辑、删除和刷新自动串联。',
  },
  {
    title: '详情展示',
    desc: 'DynamicDetail 可直接复用 columns，也可以用独立 schemas 渲染详情。',
  },
  {
    title: '组合 hooks',
    desc: 'useTable、useForm、useDialog 封装页面常用实例和弹窗状态。',
  },
  {
    title: '示例 mock',
    desc: '示例页使用本地 mock 制造假数据，不依赖后端接口。',
  },
];

const componentDocs = [
  {
    name: 'DynamicTable',
    desc: '组合搜索表单、工具栏、Element Plus 表格、分页和新增/编辑弹窗。',
    items: [
      '通过 columns 生成表格列和搜索项。',
      '通过 formSchemas 或 columns.form 生成弹窗表单。',
      '最后一列固定为 ACTIONS，可通过 #ACTIONS 插槽自定义按钮。',
      'request 入参固定保留 page、pageSize 和搜索条件。',
      '搜索项默认按容器宽度折叠，显式数量兼容旧用法，可点击展开/收起。',
      'create、update、remove 成功后自动刷新列表。',
      '可直接使用独立的 SchemaFormDialog 处理非表格场景。',
    ],
  },
  {
    name: 'DynamicDetail',
    desc: '基于 el-descriptions 的配置式详情组件，适合查看表格行详情。',
    items: [
      '不传 schemas 时自动从 columns 派生详情字段。',
      '支持 detail-{field} 插槽覆盖单个详情项。',
      '支持 CrudDetailSchema.render，用 TSX 渲染标签、进度条等复杂内容。',
      'descriptionProps 会透传给 Element Plus Descriptions。',
    ],
  },
  {
    name: 'SchemaFormBase',
    desc: '基于 schema 渲染 Element Plus 表单项，可单独作为动态表单使用。',
    items: [
      '支持 Input、Select、TreeSelect、Cascader、DatePicker、TimePicker、Switch、Slider、Rate、Progress 等组件。',
      'inline 搜索模式下控件宽度统一为 224px，可在 schema.width 单独覆盖。',
      '折叠展开基于外层高度动画实现，不依赖内部字段离场动画。',
      '支持 advanceBefore、submitBefore、resetBefore 这类前置按钮插槽。',
      'render 支持在 formSchemas.tsx 中用 TSX 渲染复杂表单项。',
      'span 控制弹窗表单栅格宽度，24 为整行，12 为半行。',
      'rules 直接透传 Element Plus 表单校验规则。',
    ],
  },
  {
    name: 'Hooks',
    desc: '封装页面层常见 ref、模型和弹窗状态，减少重复组合代码。',
    items: [
      'useTable 返回 tableRef、reload、openCreate、openEdit、getSearchModel。',
      'useForm 返回 formRef、model、validate、resetFields、setFieldsValue、getFieldsValue。',
      'useDialog 返回 visible、mode、record、initialValues、openCreate、openEdit、openDetail、close。',
    ],
  },
  {
    name: 'SchemaFormDialog',
    desc: '封装 el-dialog + SchemaForm 的通用弹窗表单，支持拖拽、默认按钮和 footer 自定义。',
    items: [
      '通过 schemas 声明表单项，通过 initialValues 回填编辑数据。',
      'submit 事件返回 values 和 done 回调，异步保存完成后调用 done 释放按钮 loading。',
      '支持 header、dialogBefore、dialogAfter、footer 等保留插槽。',
      'footer 插槽可覆盖默认取消/保存按钮。',
    ],
  },
];

const usageExamples = [
  {
    title: '配置拆分',
    code: [
      "import { columns } from './columns';",
      "import { formSchemas } from './formSchemas';",
      '',
      '<DynamicTable',
      '  :columns="columns"',
      '  :form-schemas="formSchemas"',
      '  :request="queryUsers"',
      '/>',
    ].join('\n'),
  },
  {
    title: '模板插槽',
    code: [
      '<DynamicTable :columns="columns">',
      '  <template #submitBefore="{ model }">',
      '    <el-tag type="info">关键词：{{ model.username || \"全部\" }}</el-tag>',
      '  </template>',
      '  <template #cell-status="{ row }">',
      "    <el-tag :type=\"row.status === 'enabled' ? 'success' : 'danger'\">",
      '      {{ row.status }}',
      '    </el-tag>',
      '  </template>',
      '  <template #ACTIONS="{ row, openEdit, removeRow, emitAction }">',
      '    <ElButton link type="primary" @click="openEdit(row)">编辑</ElButton>',
      '    <ElButton link type="danger" @click="removeRow(row)">删除</ElButton>',
      '    <ElButton link @click="emitAction(\'detail\', { id: row.id })">详情</ElButton>',
      '  </template>',
      '</DynamicTable>',
    ].join('\n'),
  },
  {
    title: 'TSX render',
    code: [
      'export const columns = [{',
      "  prop: 'role',",
      "  label: '角色',",
      '  render: ({ row }) => <ElTag type="info">{row.role}</ElTag>,',
      '}];',
      '',
      'export const formSchemas = [{',
      "  field: 'formTip',",
      "  label: ' ',",
      '  render: () => <ElAlert title="自定义提示" type="info" />,',
      '}];',
    ].join('\n'),
  },
  {
    title: '详情弹窗',
    code: [
      '<el-dialog v-model="detailVisible" title="用户详情" width="760px">',
      '  <DynamicDetail :record="detailRecord" :columns="columns" :column="2" border>',
      '    <template #detail-status="{ record }">',
      "      <el-tag :type=\"record.status === 'enabled' ? 'success' : 'danger'\">",
      '        {{ record.status }}',
      '      </el-tag>',
      '    </template>',
      '  </DynamicDetail>',
      '</el-dialog>',
    ].join('\n'),
  },
  {
    title: '独立弹窗表单',
    code: [
      '<SchemaFormDialog',
      '  v-model="visible"',
      '  title="独立弹窗表单"',
      '  :schemas="formSchemas"',
      '  :initial-values="record"',
      '  @submit="handleSubmit"',
      '>',
      '  <template #dialogBefore>',
      '    <el-alert title="这是一个可独立使用的弹窗表单。" type="info" :closable="false" />',
      '  </template>',
      '</SchemaFormDialog>',
    ].join('\n'),
  },
  {
    title: 'Hooks',
    code: [
      'const { tableRef, reload } = useTable<User>();',
      "const { formRef, model, validate } = useForm<User>({ status: 'enabled' });",
      'const detailDialog = useDialog<User>();',
      '',
      '<DynamicTable ref="tableRef" :columns="columns" :request="queryUsers" />',
      '<SchemaForm ref="formRef" v-model="model" :schemas="formSchemas" />',
      '<el-button @click="detailDialog.openDetail(row)">详情</el-button>',
    ].join('\n'),
  },
];

const apiTables: ApiTable[] = [
  {
    title: 'DynamicTable Props',
    columns: ['参数', '类型', '说明', '默认值'],
    rows: [
      ['columns', 'CrudColumn[]', '表格列配置，也可派生搜索项和表单项', '必填'],
      [
        'formSchemas',
        'CrudFormSchema[]',
        '弹窗表单配置，不传则由 columns.form 派生',
        '[]',
      ],
      [
        'request',
        '(params) => { list, total }',
        '列表请求函数，params 包含 page/pageSize/搜索条件',
        '-',
      ],
      ['create', '(values) => void', '新增保存函数', '-'],
      ['update', '(values, row) => void', '编辑保存函数', '-'],
      ['remove', '(row) => void', '删除函数', '-'],
      ['search', 'boolean', '是否显示搜索表单', 'true'],
      [
        'searchCollapsible',
        'boolean',
        '是否启用折叠；false 隐藏折叠按钮并展示全部搜索项',
        'true',
      ],
      [
        'searchDefaultCollapsed',
        'boolean',
        '搜索表单首次渲染是否默认收起',
        'true',
      ],
      [
        'searchCollapsedItemCount',
        "number | 'auto'",
        '按宽度自适应或固定展示数量',
        'auto',
      ],
      ['searchLabelWidth', 'string | number', '搜索表单 label 宽度', '88'],
      ['pagination', 'boolean', '是否显示分页', 'true'],
      ['pageSizes', 'number[]', '分页 pageSize 可选值', '[10, 20, 50, 100]'],
      ['defaultPageSize', 'number', '默认每页条数', '10'],
      ['showCreate', 'boolean', '是否显示默认新增按钮', 'true'],
      ['showActions', 'boolean', '是否显示最后一列 ACTIONS', 'true'],
      ['showSelection', 'boolean', '是否显示表格多选列', 'false'],
      ['showIndex', 'boolean', '是否显示序号列', 'true'],
      ['dialogWidth', 'string | number', '新增/编辑弹窗宽度', '720'],
      ['formLabelWidth', 'string | number', '弹窗表单 label 宽度', '96'],
      ['tableProps', 'Record<string, any>', '透传给 el-table 的属性', '{}'],
    ],
  },
  {
    title: 'DynamicDetail Props',
    columns: ['参数', '类型', '说明', '默认值'],
    rows: [
      ['record', 'T | null', '当前详情数据；为空时显示 el-empty', 'null'],
      ['columns', 'CrudColumn[]', '不传 schemas 时用于自动派生详情项', '[]'],
      [
        'schemas',
        'CrudDetailSchema[]',
        '独立详情项配置，优先级高于 columns',
        '[]',
      ],
      ['title', 'string', 'Descriptions 标题', '-'],
      ['column', 'number', '每行展示几项', '2'],
      ['border', 'boolean', '是否显示边框', 'true'],
      ['labelWidth', 'string | number', '详情项 label 宽度', '120'],
      ['emptyText', 'string', '无数据时的空状态文案', '暂无详情数据'],
      [
        'descriptionProps',
        'Record<string, any>',
        '透传给 el-descriptions 的原生参数',
        '{}',
      ],
    ],
  },
  {
    title: 'CrudDetailSchema',
    columns: ['字段', '类型', '说明', '示例'],
    rows: [
      ['field', 'string', '详情字段名', 'username'],
      ['label', 'string', '详情项 label', '用户账号'],
      ['span', 'number', '详情项跨列数量', '2'],
      ['width', 'string | number', '详情项内容宽度', '180'],
      ['labelWidth', 'string | number', '单个详情项 label 宽度', '120'],
      [
        'hidden',
        'boolean | (record) => boolean',
        '按当前详情数据控制显示隐藏',
        '(record) => !record.remark',
      ],
      [
        'props',
        'Record<string, any>',
        '透传给 el-descriptions-item 的参数',
        "{ align: 'center' }",
      ],
      [
        'formatter',
        '(record, value, index) => string',
        '格式化详情值',
        '字典转换',
      ],
      [
        'render',
        '({ record, value, index, schema, field }) => VNode',
        'TSX 自定义详情内容',
        'render: ({ value }) => <ElTag />',
      ],
    ],
  },
  {
    title: 'CrudColumn',
    columns: ['字段', '类型', '说明', '示例'],
    rows: [
      ['prop', 'string', '数据字段名', 'username'],
      ['label', 'string', '表格列名、搜索 label、表单 label', '用户账号'],
      ['width', 'string | number', '表格列固定宽度', '120'],
      ['minWidth', 'string | number', '表格列最小宽度', '160'],
      ['fixed', "true | 'left' | 'right'", '表格列固定位置', 'right'],
      ['align', 'left | center | right', '表格列内容对齐方式', 'center'],
      ['sortable', "boolean | 'custom'", '是否启用排序', 'true'],
      [
        'search',
        'false | CrudFormSchema',
        '搜索项配置，false 表示不参与搜索',
        "{ component: 'Select' }",
      ],
      [
        'form',
        'false | CrudFormSchema',
        '弹窗表单项配置，false 表示不参与表单',
        '{ rules: [...] }',
      ],
      [
        'formatter',
        '(row, value, index) => string',
        '默认单元格格式化',
        '格式化字典值',
      ],
      [
        'render',
        '({ row, value, index }) => VNode',
        '使用 TSX 自定义单元格内容',
        'render: ({ row }) => <ElTag />',
      ],
      ['hideInTable', 'boolean', '是否隐藏表格列', 'false'],
      ['hideInSearch', 'boolean', '是否隐藏搜索项', 'false'],
    ],
  },
  {
    title: 'CrudFormSchema',
    columns: ['字段', '类型', '说明', '示例'],
    rows: [
      ['field', 'string', '表单字段名', 'role'],
      ['component', 'CrudFieldComponent', 'Element 表单组件类型', 'TreeSelect'],
      [
        'placeholder',
        'string',
        '输入/选择占位文案，不传时自动生成',
        '请选择部门',
      ],
      ['defaultValue', 'any', '新增或重置时写入的默认值', 'enabled'],
      [
        'options',
        'CrudOption[]',
        'Select/Radio/Checkbox 选项',
        '[{ label, value }]',
      ],
      [
        'props',
        'Record<string, any>',
        '透传给实际 Element 组件',
        '{ data, filterable: true }',
      ],
      ['span', 'number', '弹窗表单宽度，24 整行，12 半行', '12'],
      ['width', 'number | string', 'inline 搜索控件宽度', '260'],
      [
        'rules',
        'FormItemRule[]',
        'Element Plus 校验规则',
        '[{ required: true }]',
      ],
      [
        'hidden',
        'boolean | (model) => boolean',
        '按当前表单模型控制显示隐藏',
        '(model) => !model.type',
      ],
      [
        'render',
        '({ model, schema, field }) => VNode',
        '使用 TSX 自定义表单项内容',
        'render: () => <ElAlert />',
      ],
    ],
  },
  {
    title: 'SchemaForm Props',
    columns: ['参数', '类型', '说明', '默认值'],
    rows: [
      ['modelValue', 'Record<string, any>', '表单模型，支持 v-model', '{}'],
      ['schemas', 'CrudFormSchema[]', '表单配置项', '必填'],
      ['inline', 'boolean', '是否启用 inline 表单布局', 'false'],
      ['labelWidth', 'string | number', '表单 label 宽度', '96'],
      ['showActions', 'boolean', '是否显示默认查询/重置按钮组', 'true'],
      [
        'collapsible',
        'boolean',
        '是否启用折叠；false 隐藏折叠按钮并展示全部字段',
        'false',
      ],
      ['defaultCollapsed', 'boolean', '首次渲染是否默认收起', 'true'],
      [
        'collapsedItemCount',
        "number | 'auto'",
        'inline 时自适应，非 inline 默认 3 项；数字固定数量',
        'auto',
      ],
    ],
  },
  {
    title: 'SchemaFormDialog Props',
    columns: ['参数', '类型', '说明', '默认值'],
    rows: [
      ['modelValue', 'boolean', '弹窗显示状态，支持 v-model', '必填'],
      ['title', 'string', '弹窗标题', '必填'],
      ['schemas', 'CrudFormSchema[]', '弹窗表单配置', '必填'],
      ['initialValues', 'Partial<T>', '表单初始值，编辑场景用于回填', '{}'],
      ['width', 'string | number', '弹窗宽度', '720'],
      ['labelWidth', 'string | number', '表单 label 宽度', '96'],
      [
        'dialogProps',
        'Record<string, any>',
        '透传给 el-dialog 的原生参数',
        '{}',
      ],
    ],
  },
  {
    title: 'Hooks',
    columns: ['方法', '返回', '说明', '示例'],
    rows: [
      [
        'useTable<T>()',
        '{ tableRef, reload, openCreate, openEdit, getSearchModel }',
        '绑定 DynamicTable 实例并封装常用 expose 方法',
        'const { tableRef, reload } = useTable<User>()',
      ],
      [
        'useForm<T>(initialValues?)',
        '{ formRef, model, validate, resetFields, setFieldsValue, getFieldsValue }',
        '管理 SchemaForm 模型和实例方法',
        "const form = useForm<User>({ status: 'enabled' })",
      ],
      [
        'useDialog<T>(defaultValues?)',
        '{ visible, mode, record, initialValues, openCreate, openEdit, openDetail, close }',
        '管理新增、编辑、详情弹窗状态',
        'const dialog = useDialog<User>()',
      ],
    ],
  },
  {
    title: 'Request / Mutations',
    columns: ['方法', '签名', '说明', '返回'],
    rows: [
      [
        'request',
        '(params: CrudRequestParams) => CrudListResult | Promise<CrudListResult>',
        '查询列表，组件自动传入 page、pageSize 和当前搜索条件',
        '{ list, total }',
      ],
      [
        'create',
        '(values: Partial<T>) => void | Promise<void>',
        '新增弹窗点击保存后调用',
        'void',
      ],
      [
        'update',
        '(values: Partial<T>, row: T) => void | Promise<void>',
        '编辑弹窗点击保存后调用，row 是编辑前的原始行',
        'void',
      ],
      ['remove', '(row: T) => void | Promise<void>', '删除确认后调用', 'void'],
    ],
  },
  {
    title: 'Events',
    columns: ['事件名', '参数', '触发时机', '说明'],
    rows: [
      [
        'loaded',
        '(rows, total)',
        'request 成功返回后',
        '可用于统计、埋点或外部同步列表数量',
      ],
      ['created', '(values)', 'create 调用完成后', '返回当前提交的新增表单值'],
      ['updated', '(values, row)', 'update 调用完成后', '返回提交值和原始行'],
      ['removed', '(row)', 'remove 调用完成后', '返回被删除行'],
      [
        'action',
        '(actionName, row, payload?)',
        'ACTIONS 插槽中调用 emitAction 时',
        '统一处理详情/扩展动作',
      ],
      [
        'SchemaForm submit',
        '(values)',
        'SchemaForm 默认按钮提交后',
        '返回表单值',
      ],
      [
        'SchemaForm reset',
        '(values)',
        'SchemaForm 默认按钮重置后',
        '返回重置后的表单值',
      ],
      [
        'SchemaFormDialog submit',
        '(values, done)',
        '弹窗表单保存后',
        '异步保存结束后调用 done()',
      ],
    ],
  },
  {
    title: 'Slots',
    columns: ['插槽名', '参数', '说明', '示例'],
    rows: [
      ['toolbar-before', '-', '工具栏按钮区域前置插槽', '批量删除按钮'],
      ['toolbar-after', '-', '工具栏按钮区域后置插槽', '导出按钮'],
      [
        'searchBefore / searchAfter',
        '{ model, reload }',
        '搜索表单前后保留插槽',
        '搜索摘要',
      ],
      [
        'advanceBefore / submitBefore / resetBefore',
        '{ model, submit, reset, toggleCollapsed, isCollapsed }',
        '搜索按钮前置插槽',
        '插入快捷按钮/提示',
      ],
      [
        'tableBefore / tableAfter',
        '{ rows, reload }',
        '表格前后保留插槽',
        '统计信息',
      ],
      [
        'tableEmpty / tableAppend',
        '{ reload } / { rows, reload }',
        '透传给 el-table 的 empty / append 插槽',
        '空状态或附加内容',
      ],
      [
        'cell-{prop}',
        '{ row, value, index }',
        '按字段自定义单元格内容',
        'cell-status',
      ],
      [
        'detail-{field}',
        '{ record, value, index, schema }',
        '按字段自定义详情项内容',
        'detail-status',
      ],
      [
        'ACTIONS',
        '{ row, index, openEdit, removeRow, emitAction }',
        '覆盖最后一列固定在右侧的 ACTIONS 操作区',
        '直接使用 ElButton 或业务按钮组件',
      ],
      [
        'dialog-header / dialog-dialogBefore / dialog-dialogAfter / dialog-footer',
        '见对应槽位作用域',
        'DynamicTable 透传到内部 SchemaFormDialog 的保留插槽',
        '自定义弹窗头部/内容前后/底部',
      ],
      [
        'SchemaForm actions',
        '-',
        '覆盖默认查询/重置/展开按钮',
        '自定义搜索按钮',
      ],
      [
        'SchemaFormDialog footer',
        '{ submitting, submit, cancel, close }',
        '覆盖弹窗底部按钮',
        '自定义保存按钮',
      ],
    ],
  },
  {
    title: 'Expose',
    columns: ['方法', '参数', '说明', '返回'],
    rows: [
      ['reload', '-', '重新请求列表', 'Promise<void>'],
      ['openCreate', '-', '打开新增弹窗', 'void'],
      ['openEdit', 'row', '打开指定行的编辑弹窗', 'void'],
      ['getSearchModel', '-', '获取当前搜索条件快照', 'Record<string, any>'],
      ['SchemaForm validate', '-', '校验表单', 'Promise'],
      ['SchemaFormDialog submit', '-', '手动提交弹窗表单', 'Promise<void>'],
    ],
  },
];

const elementPlusLinks: ElementPlusLink[] = [
  {
    component: 'Input / Textarea / InputPassword',
    native: 'el-input',
    url: 'https://element-plus.org/en-US/component/input',
  },
  {
    component: 'InputNumber',
    native: 'el-input-number',
    url: 'https://element-plus.org/en-US/component/input-number',
  },
  {
    component: 'Select',
    native: 'el-select',
    url: 'https://element-plus.org/en-US/component/select',
  },
  {
    component: 'TreeSelect',
    native: 'el-tree-select',
    url: 'https://element-plus.org/en-US/component/tree-select',
  },
  {
    component: 'Cascader',
    native: 'el-cascader',
    url: 'https://element-plus.org/en-US/component/cascader',
  },
  {
    component: 'DatePicker',
    native: 'el-date-picker',
    url: 'https://element-plus.org/en-US/component/date-picker',
  },
  {
    component: 'TimePicker',
    native: 'el-time-picker',
    url: 'https://element-plus.org/en-US/component/time-picker',
  },
  {
    component: 'TimeSelect',
    native: 'el-time-select',
    url: 'https://element-plus.org/en-US/component/time-select',
  },
  {
    component: 'RadioGroup',
    native: 'el-radio-group',
    url: 'https://element-plus.org/en-US/component/radio',
  },
  {
    component: 'CheckboxGroup',
    native: 'el-checkbox-group',
    url: 'https://element-plus.org/en-US/component/checkbox',
  },
  {
    component: 'Switch',
    native: 'el-switch',
    url: 'https://element-plus.org/en-US/component/switch',
  },
  {
    component: 'Slider',
    native: 'el-slider',
    url: 'https://element-plus.org/en-US/component/slider',
  },
  {
    component: 'Rate',
    native: 'el-rate',
    url: 'https://element-plus.org/en-US/component/rate',
  },
  {
    component: 'ColorPicker',
    native: 'el-color-picker',
    url: 'https://element-plus.org/en-US/component/color-picker',
  },
  {
    component: 'Progress',
    native: 'el-progress',
    url: 'https://element-plus.org/en-US/component/progress',
  },
  {
    component: 'Descriptions',
    native: 'el-descriptions',
    url: 'https://element-plus.org/en-US/component/descriptions',
  },
  {
    component: 'Table',
    native: 'el-table',
    url: 'https://element-plus.org/en-US/component/table',
  },
  {
    component: 'Pagination',
    native: 'el-pagination',
    url: 'https://element-plus.org/en-US/component/pagination',
  },
  {
    component: 'Dialog',
    native: 'el-dialog',
    url: 'https://element-plus.org/en-US/component/dialog',
  },
  {
    component: 'Form / FormItem',
    native: 'el-form',
    url: 'https://element-plus.org/en-US/component/form',
  },
];

function scrollToSection(id: string) {
  activeSection.value = id;
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
</script>
