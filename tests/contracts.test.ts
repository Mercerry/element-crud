import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import ElementPlus, { ElTable, ElMessageBox } from 'element-plus';
import {
  SchemaForm,
  SchemaFormDialog,
  DynamicTable,
  DynamicDetail,
  useForm,
  useTable,
  useDialog,
} from '../src/index';

const global = {
  plugins: [ElementPlus],
  stubs: { teleport: true, ElPagination: true },
};
const mounted: Array<{ unmount(): void }> = [];
afterEach(() => mounted.splice(0).forEach((wrapper) => wrapper.unmount()));

describe('组件库原始优化清单回归', () => {
  it('hooks 未挂载时不伪造校验、刷新或提交成功', async () => {
    await expect(useForm().validate()).rejects.toMatchObject({
      code: 'CRUD_NOT_READY',
    });
    await expect(useTable().reload()).rejects.toMatchObject({
      code: 'CRUD_NOT_READY',
    });
    await expect(useDialog().submit()).rejects.toMatchObject({
      code: 'CRUD_NOT_READY',
    });
  });
  it('缺少处理函数隐藏默认写操作，公开入口不能假成功', async () => {
    const wrapper = mount(DynamicTable, {
      props: {
        columns: [{ prop: 'name', label: '名称' }],
        data: [{ id: 1, name: '记录' }],
        search: false,
        pagination: false,
      },
      global,
    });
    mounted.push(wrapper);
    await flushPromises();
    expect(wrapper.text()).not.toMatch(/新增|编辑|删除/);
    expect(() => wrapper.vm.openCreate()).toThrow('handler is not configured');
    expect(wrapper.emitted('created')).toBeUndefined();
  });
  it('嵌套字段读写与校验一致，折叠校验失败自动展开', async () => {
    const wrapper = mount(SchemaForm, {
      attachTo: document.body,
      props: {
        modelValue: { user: { name: '', code: '1' } },
        schemas: [
          { field: 'user.code', label: '编号', component: 'Input' },
          {
            field: 'user.name',
            label: '名称',
            component: 'Input',
            rules: [{ required: true, message: '必填' }],
          },
        ],
        inline: true,
        collapsible: true,
        collapsedItemCount: 1,
      },
      global,
    });
    mounted.push(wrapper);
    // jsdom 没有原生滚动；字段显隐仍由真实组件完成。

    expect(
      wrapper.findAll('input').filter((input) => input.isVisible()),
    ).toHaveLength(1);
    await expect(wrapper.vm.validate()).rejects.toHaveProperty('user.name');
    expect(
      wrapper.findAll('input').filter((input) => input.isVisible()),
    ).toHaveLength(2);

    await wrapper.findAll('input')[1]!.setValue('姓名');
    expect(wrapper.vm.getFieldsValue()).toEqual({
      user: { name: '姓名', code: '1' },
    });
    await expect(wrapper.vm.validate()).resolves.toBe(true);
    const callback = vi.fn(() => {
      throw new Error('回调异常');
    });
    await expect(wrapper.vm.validate(callback)).rejects.toThrow('回调异常');
    expect(callback).toHaveBeenCalledOnce();
  });
  it('嵌套数字字段规范化后不会形成父子更新循环', async () => {
    const model = ref({ user: { count: '2' as string | number } });
    const changes = vi.fn((value) => {
      model.value = value;
    });
    const Host = defineComponent(
      () => () =>
        h(SchemaForm, {
          modelValue: model.value,
          'onUpdate:modelValue': changes,
          schemas: [
            { field: 'user.count', label: '数量', component: 'InputNumber' },
          ],
        }),
    );
    const wrapper = mount(Host, { global });
    mounted.push(wrapper);
    await flushPromises();
    expect(model.value.user.count).toBe(2);
    expect(changes.mock.calls.length).toBeLessThan(3);
    await wrapper.get('input').setValue('3');
    await flushPromises();
    expect(model.value.user.count).toBe(3);
  });
  it('动态字段可清理旧值并补默认值，初始值重置不会与草稿共享引用', async () => {
    const wrapper = mount(SchemaForm, {
      props: {
        modelValue: { user: { name: '初始' } },
        resetMode: 'initial',
        fieldPolicy: 'remove',
        schemas: [{ field: 'user.name', label: '名称', component: 'Input' }],
      },
      global,
    });
    mounted.push(wrapper);
    await wrapper.get('input').setValue('修改');
    await wrapper.vm.resetFields();
    expect(wrapper.vm.getFieldsValue()).toEqual({ user: { name: '初始' } });
    await wrapper.setProps({
      schemas: [
        {
          field: 'user.code',
          label: '编号',
          component: 'Input',
          defaultValue: '默认',
        },
      ],
    });
    expect(wrapper.vm.getFieldsValue()).toEqual({ user: { code: '默认' } });
  });
  it('远程排序加入请求且只触发一次', async () => {
    const request = vi.fn(async (_params: unknown) => ({ list: [], total: 0 }));
    const wrapper = mount(DynamicTable, {
      props: {
        columns: [{ prop: 'name', label: '名称', sortable: 'custom' }],
        request,
        remoteSort: true,
        search: false,
        pagination: false,
      },
      global,
    });
    mounted.push(wrapper);
    await flushPromises();
    const before = request.mock.calls.length;
    wrapper
      .findComponent(ElTable)
      .vm.$emit('sort-change', { prop: 'name', order: 'descending' });
    await flushPromises();
    expect(request).toHaveBeenCalledTimes(before + 1);
    expect(request.mock.calls.at(-1)![0]).toMatchObject({
      sortBy: 'name',
      sortOrder: 'descending',
      page: 1,
    });
  });
  it('删除取消不报错，接口失败报告操作错误而不触发成功', async () => {
    const remove = vi.fn().mockRejectedValue(new Error('删除失败'));
    const confirm = vi
      .spyOn(ElMessageBox, 'confirm')
      .mockRejectedValueOnce('cancel')
      .mockResolvedValueOnce('confirm');
    const wrapper = mount(DynamicTable, {
      props: {
        columns: [{ prop: 'name', label: '名称' }],
        data: [{ id: 1, name: '记录' }],
        remove,
        search: false,
        pagination: false,
      },
      global,
    });
    mounted.push(wrapper);
    await flushPromises();
    const button = () =>
      wrapper.findAll('button').find((button) => button.text() === '删除')!;
    await button().trigger('click');
    await flushPromises();
    expect(confirm).toHaveBeenCalledOnce();
    expect(remove).not.toHaveBeenCalled();
    expect(wrapper.emitted('operationError')).toBeUndefined();
    await button().trigger('click');
    await flushPromises();
    expect(wrapper.emitted('operationError')![0]![0]).toMatchObject({
      action: 'remove',
    });
    expect(wrapper.emitted('removed')).toBeUndefined();
  });
  it('Promise 提交支持失败重试且等待保存完成', async () => {
    const save = vi
      .fn()
      .mockRejectedValueOnce(new Error('失败'))
      .mockResolvedValueOnce(undefined);
    const wrapper = mount(SchemaFormDialog, {
      props: {
        modelValue: true,
        title: '编辑',
        schemas: [],
        submitRequest: save,
      },
      global,
    });
    mounted.push(wrapper);
    await flushPromises();
    await expect(wrapper.vm.submit()).rejects.toThrow('失败');
    expect(wrapper.emitted('submitError')).toHaveLength(1);
    await wrapper.vm.submit();
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
  });
  it('详情支持独立渲染、嵌套路径与显式零标签宽度', async () => {
    const wrapper = mount(DynamicDetail, {
      props: {
        record: { user: { name: '姓名' } },
        schemas: [
          { field: 'user.name', label: '名称', width: 180, labelWidth: 0 },
        ],
      },
      global,
    });
    mounted.push(wrapper);
    expect(wrapper.text()).toContain('姓名');
    expect(
      wrapper.find('.el-descriptions__label').attributes('style'),
    ).toContain('width: 0px');
    expect(
      wrapper.find('.el-descriptions__content').attributes('style'),
    ).toContain('width: 180px');
  });
});
