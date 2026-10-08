import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { h } from 'vue';
import ElementPlus, {
  ElDialog,
  ElDrawer,
  ElInput,
  ElPagination,
} from 'element-plus';
import {
  DynamicTable,
  SchemaForm,
  SchemaFormDialog,
  type CrudFormSchema,
} from '../src/index';

const global = { plugins: [ElementPlus], stubs: { teleport: true } };
const mounted: Array<{ unmount: () => void }> = [];
afterEach(() => {
  mounted.splice(0).forEach((wrapper) => wrapper.unmount());
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

describe('element-crud 固定安装包接入回归', () => {
  it('慢查询不能覆盖新查询，只对最新响应触发 loaded', async () => {
    const first = deferred<{
      list: { id: number; name: string }[];
      total: number;
    }>();
    const second = deferred<{
      list: { id: number; name: string }[];
      total: number;
    }>();
    const request = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const wrapper = mount(DynamicTable, {
      attachTo: document.body,
      props: {
        showActions: false,
        showIndex: false,
        fitContainer: true,
        tableProps: { border: false, stripe: false },
        pageSizes: [10, 20, 50, 100],
        columns: [{ prop: 'name', label: '名称' }],
        request,
        immediate: false,
        search: false,
        pagination: false,
      },
      global,
    });
    mounted.push(wrapper);
    await flushPromises();
    const one = wrapper.vm.reload();
    const two = wrapper.vm.reload();
    second.resolve({ list: [{ id: 2, name: '最新' }], total: 1 });
    await two;
    first.resolve({ list: [{ id: 1, name: '旧响应' }], total: 1 });
    await one;
    await flushPromises();
    expect(wrapper.text()).toContain('最新');
    expect(wrapper.text()).not.toContain('旧响应');
    expect(wrapper.emitted('loaded')).toHaveLength(1);
  });

  it('切页复用搜索表单时，折叠按钮无需等待动画帧才消失', async () => {
    // 固定布局且不执行 RAF，证明挂载和 schema 更新在本轮渲染内完成测量。
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(250);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 224,
      height: 32,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 224,
      bottom: 32,
      toJSON: () => ({}),
    });
    const schemas: CrudFormSchema[] = ['a', 'b', 'c'].map((field) => ({
      field,
      label: field,
      component: 'Input',
    }));
    const wrapper = mount(SchemaForm, {
      attachTo: document.body,
      props: { schemas, inline: true, collapsible: true, labelWidth: 0 },
      global,
    });
    mounted.push(wrapper);
    await flushPromises();
    const toggle = () =>
      wrapper
        .findAll('button')
        .find((button) => /展开|收起/.test(button.text()));
    expect(toggle()?.isVisible()).toBe(true);
    await wrapper.setProps({ schemas: schemas.slice(0, 1) });
    expect(toggle()?.isVisible()).toBe(false);
    await wrapper.setProps({ schemas });
    expect(toggle()?.isVisible()).toBe(true);
    await wrapper.setProps({ collapsible: false });
    expect(toggle()).toBeUndefined();
    expect(
      wrapper.findAll('input').filter((input) => input.isVisible()),
    ).toHaveLength(3);
  });

  it('修改未提交的条件不会随翻页发送，查询只请求一次并回到第一页', async () => {
    const request = vi.fn(async () => ({ list: [], total: 100 }));
    const wrapper = mount(DynamicTable, {
      attachTo: document.body,
      props: {
        showActions: false,
        showIndex: false,
        fitContainer: true,
        tableProps: { border: false, stripe: false },
        columns: [{ prop: 'name', label: '名称' }],
        request,
        searchCollapsible: false,
      },
      global: { ...global, stubs: { ...global.stubs, ElPagination: true } },
    });
    mounted.push(wrapper);
    await flushPromises();
    await wrapper.get('input[placeholder="请输入名称"]').setValue('待确认');
    const pagination = wrapper.findComponent(ElPagination);
    pagination.vm.$emit('update:current-page', 2);
    pagination.vm.$emit('change', 2, 10);
    await flushPromises();
    expect(request.mock.calls.at(-1)?.[0]).toMatchObject({
      page: 2,
      name: undefined,
    });
    const before = request.mock.calls.length;
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '查询')!
      .trigger('click');
    await flushPromises();
    expect(request).toHaveBeenCalledTimes(before + 1);
    expect(request.mock.calls.at(-1)?.[0]).toMatchObject({
      page: 1,
      name: '待确认',
    });
  });

  it.each(['dialog', 'drawer'] as const)(
    '%s 更新选项不重置草稿，嵌套值不污染原记录，提交锁可失败重试',
    async (mode) => {
      const initialValues = { name: '', nested: { value: '原值' } };
      const schemas: CrudFormSchema[] = [
        { field: 'name', label: '名称', component: 'Input' },
        {
          field: 'nested',
          label: '嵌套',
          render: ({ model }) =>
            h(ElInput, {
              modelValue: model.nested.value,
              'onUpdate:modelValue': (value) => {
                model.nested.value = value;
              },
            }),
        },
      ];
      const wrapper = mount(SchemaFormDialog, {
        props: {
          modelValue: true,
          title: '编辑',
          mode,
          initialValues,
          schemas,
        },
        global,
      });
      mounted.push(wrapper);
      await flushPromises();
      await wrapper.findAll('input')[0]!.setValue('未保存');
      await wrapper.findAll('input')[1]!.setValue('草稿值');
      await wrapper.setProps({
        schemas: schemas.map((schema) => ({ ...schema, options: [] })),
      });
      expect(wrapper.findAll('input')[0]!.element.value).toBe('未保存');
      expect(initialValues.nested.value).toBe('原值');
      await Promise.all([wrapper.vm.submit(), wrapper.vm.submit()]);
      expect(wrapper.emitted('submit')).toHaveLength(1);
      expect(
        wrapper
          .findComponent(mode === 'drawer' ? ElDrawer : ElDialog)
          .props('showClose'),
      ).toBe(false);
      const done = wrapper.emitted('submit')![0]![1] as (
        close: boolean,
      ) => void;
      done(false);
      await wrapper.vm.submit();
      expect(wrapper.emitted('submit')).toHaveLength(2);
      await wrapper.setProps({ modelValue: false });
      await wrapper.setProps({ modelValue: true });
      (wrapper.emitted('submit')![1]![1] as (close: boolean) => void)(true);
      expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    },
  );
});
