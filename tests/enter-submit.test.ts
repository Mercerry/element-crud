import { afterEach, expect, it, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { h } from 'vue';
import ElementPlus from 'element-plus';
import { SchemaForm, SchemaFormDialog, DynamicTable } from '../src/index';

const global = { plugins: [ElementPlus], stubs: { teleport: true } };
const mounted: Array<{ unmount(): void }> = [];
afterEach(() => mounted.splice(0).forEach((wrapper) => wrapper.unmount()));
const schemas = [{ field: 'name', label: '名称', component: 'Input' as const }];

it('默认启用回车提交，支持显式关闭后重新开启', async () => {
  const wrapper = mount(SchemaForm, {
    props: { schemas, modelValue: { name: 'test' } },
    global,
  });
  mounted.push(wrapper);
  await wrapper.get('input').trigger('keydown', { key: 'Enter' });
  await flushPromises();
  expect(wrapper.emitted('submit')).toEqual([[{ name: 'test' }]]);
  await wrapper.setProps({ submitOnEnter: false });
  await wrapper.get('input').trigger('keydown', { key: 'Enter' });
  await flushPromises();
  expect(wrapper.emitted('submit')).toHaveLength(1);
  await wrapper.setProps({ submitOnEnter: true });
  await wrapper.get('input').trigger('keydown', { key: 'Enter' });
  await flushPromises();
  expect(wrapper.emitted('submit')).toHaveLength(2);
});

it('校验失败、输入法、长按、组合键、文本域和下拉输入不误提交', async () => {
  const wrapper = mount(SchemaForm, {
    props: {
      schemas: [
        { ...schemas[0]!, rules: [{ required: true, message: '必填' }] },
        { field: 'note', label: '说明', component: 'Textarea' },
        // 覆盖自定义 render 中的组合输入控件，不能依赖 schema.component 判断。
        {
          field: 'picker',
          label: '选择',
          render: () => h('div', { role: 'combobox' }, h('input')),
        },
      ],
    },
    global,
  });
  mounted.push(wrapper);
  await wrapper.get('input').trigger('keydown', { key: 'Enter' });
  await flushPromises();
  expect(wrapper.emitted('submit')).toBeUndefined();
  await wrapper.get('input').setValue('valid');
  for (const flags of [
    { isComposing: true },
    { keyCode: 229 },
    { repeat: true },
    { shiftKey: true },
    { ctrlKey: true },
    { altKey: true },
    { metaKey: true },
  ]) {
    await wrapper.get('input').trigger('keydown', { key: 'Enter', ...flags });
  }
  await wrapper.get('textarea').trigger('keydown', { key: 'Enter' });
  await wrapper
    .get('[role="combobox"] input')
    .trigger('keydown', { key: 'Enter' });
  await flushPromises();
  expect(wrapper.emitted('submit')).toBeUndefined();
});

it('表格搜索回车走原有查询入口', async () => {
  const request = vi.fn().mockResolvedValue({ list: [], total: 0 });
  const wrapper = mount(DynamicTable, {
    props: {
      columns: [
        { prop: 'name', label: '名称', search: { component: 'Input' } },
      ],
      pagination: false,
      immediate: false,
      request,
    },
    global,
  });
  mounted.push(wrapper);
  await wrapper.get('input').setValue('query');
  await wrapper.get('input').trigger('keydown', { key: 'Enter' });
  await flushPromises();
  expect(request).toHaveBeenCalledTimes(1);
  expect(request.mock.calls[0]?.[0]).toMatchObject({ name: 'query' });
  expect(wrapper.findComponent(SchemaFormDialog).props('submitOnEnter')).toBe(
    true,
  );
  await wrapper.setProps({
    searchSubmitOnEnter: false,
    formSubmitOnEnter: false,
  });
  await wrapper.get('input').trigger('keydown', { key: 'Enter' });
  await flushPromises();
  expect(request).toHaveBeenCalledTimes(1);
  expect(wrapper.findComponent(SchemaFormDialog).props('submitOnEnter')).toBe(
    false,
  );
});

it('弹窗回车走提交锁，异步保存期间不能重复提交', async () => {
  let finish!: () => void;
  const submitRequest = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  const wrapper = mount(SchemaFormDialog, {
    props: {
      modelValue: true,
      title: '编辑',
      schemas,
      initialValues: { name: 'test' },
      submitRequest,
    },
    global,
  });
  mounted.push(wrapper);
  await flushPromises();
  await wrapper.get('input').trigger('keydown', { key: 'Enter' });
  await flushPromises();
  await wrapper.get('input').trigger('keydown', { key: 'Enter' });
  await flushPromises();
  expect(submitRequest).toHaveBeenCalledTimes(1);
  finish();
  await flushPromises();
  expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
});
