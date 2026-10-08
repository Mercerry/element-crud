import { afterEach, describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, reactive } from 'vue';
import { ElCol, ElRow } from 'element-plus';
import {
  CrudConfigProvider,
  enUS,
  installCrudConfig,
  SchemaForm,
  DynamicDetail,
  useCrudLocale,
} from '../src';
const mounted: Array<{ unmount(): void }> = [];
afterEach(() => mounted.splice(0).forEach((item) => item.unmount()));
describe('配置与 Layout', () => {
  it('全局文案可响应切换，局部覆盖继承父级，实例互相隔离', async () => {
    const config = reactive({ locale: { ...enUS } });
    const Reader = defineComponent({
      setup() {
        const locale = useCrudLocale();
        return () => h('span', `${locale.value.search}/${locale.value.reset}`);
      },
    });
    const wrapper = mount(CrudConfigProvider, {
      props: { locale: { reset: '清空' } },
      slots: { default: () => h(Reader) },
      global: {
        plugins: [{ install: (app) => installCrudConfig(app, config) }],
      },
    });
    mounted.push(wrapper);
    expect(wrapper.text()).toBe('Search/清空');
    config.locale.search = '查找';
    await wrapper.setProps({ locale: { reset: '恢复' } });
    expect(wrapper.text()).toBe('查找/恢复');
    const isolated = mount(Reader);
    mounted.push(isolated);
    expect(isolated.text()).toBe('查询/重置');
  });
  it('搜索默认两列并尊重 colProps，禁用折叠立即显示全部字段', async () => {
    const wrapper = mount(SchemaForm, {
      props: {
        inline: true,
        collapsible: true,
        collapsedItemCount: 1,
        schemas: [
          { field: 'a', label: 'A' },
          { field: 'b', label: 'B' },
          { field: 'c', label: 'C', colProps: { span: 24, sm: 12 } },
        ],
      },
    });
    mounted.push(wrapper);
    expect(wrapper.findComponent(ElRow).props('gutter')).toBe(16);
    expect(
      wrapper.findAllComponents(ElCol).map((item) => item.props('span')),
    ).toEqual([12, 12, 24]);
    expect(
      wrapper.findAllComponents(ElCol).every((item) => item.props('xs') === 24),
    ).toBe(true);
    await wrapper.setProps({ collapsible: false });
    expect(wrapper.text()).not.toContain('展开');
    expect(
      wrapper
        .findAll('.crud-schema-form__column')
        .every(
          (item) => (item.element as HTMLElement).style.display !== 'none',
        ),
    ).toBe(true);
  });
  it('默认操作、占位符与空态使用配置文案', () => {
    const wrapper = mount(CrudConfigProvider, {
      props: { locale: enUS },
      slots: {
        default: () => [
          h(SchemaForm, { schemas: [{ field: 'name', label: 'Name' }] }),
          h(DynamicDetail),
        ],
      },
    });
    mounted.push(wrapper);
    expect(wrapper.text()).toContain('Search');
    expect(wrapper.text()).toContain('Reset');
    expect(wrapper.text()).toContain('No details');
    expect(wrapper.get('input').attributes('placeholder')).toBe('Enter Name');
  });
});
