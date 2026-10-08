import { computed, defineComponent, inject, provide, toValue } from 'vue';
import type { App, InjectionKey, MaybeRefOrGetter, PropType } from 'vue';

export interface CrudLocale {
  search: string;
  reset: string;
  expand: string;
  collapse: string;
  create: string;
  edit: string;
  remove: string;
  refresh: string;
  actions: string;
  confirm: string;
  cancel: string;
  entity: string;
  empty: string;
  emptyDetail: string;
  createSuccess: string;
  editSuccess: string;
  removeSuccess: string;
  removeConfirm: string;
  removeTitle: string;
  inputPlaceholder: (label: string) => string;
  selectPlaceholder: (label: string) => string;
  createTitle: (entity: string) => string;
  editTitle: (entity: string) => string;
}
export const zhCN: CrudLocale = {
  search: '查询',
  reset: '重置',
  expand: '展开',
  collapse: '收起',
  create: '新增',
  edit: '编辑',
  remove: '删除',
  refresh: '刷新',
  actions: '操作',
  confirm: '确认',
  cancel: '取消',
  entity: '数据',
  empty: '暂无数据',
  emptyDetail: '暂无详情数据',
  createSuccess: '新增成功',
  editSuccess: '编辑成功',
  removeSuccess: '删除成功',
  removeConfirm: '确定要删除这条数据吗？',
  removeTitle: '删除确认',
  inputPlaceholder: (label) => `请输入${label}`,
  selectPlaceholder: (label) => `请选择${label}`,
  createTitle: (entity) => `新增${entity}`,
  editTitle: (entity) => `编辑${entity}`,
};
export const enUS: CrudLocale = {
  search: 'Search',
  reset: 'Reset',
  expand: 'Expand',
  collapse: 'Collapse',
  create: 'Create',
  edit: 'Edit',
  remove: 'Delete',
  refresh: 'Refresh',
  actions: 'Actions',
  confirm: 'Confirm',
  cancel: 'Cancel',
  entity: 'record',
  empty: 'No data',
  emptyDetail: 'No details',
  createSuccess: 'Created successfully',
  editSuccess: 'Updated successfully',
  removeSuccess: 'Deleted successfully',
  removeConfirm: 'Delete this record?',
  removeTitle: 'Confirm deletion',
  inputPlaceholder: (label) => `Enter ${label}`,
  selectPlaceholder: (label) => `Select ${label}`,
  createTitle: (entity) => `Create ${entity}`,
  editTitle: (entity) => `Edit ${entity}`,
};
export interface CrudConfig {
  locale?: Partial<CrudLocale>;
}
const configKey: InjectionKey<MaybeRefOrGetter<CrudConfig>> = Symbol(
  'element-crud-config',
);
export function installCrudConfig(
  app: App,
  config: MaybeRefOrGetter<CrudConfig>,
) {
  app.provide(configKey, config);
}
export function useCrudLocale() {
  const config = inject(configKey, {});
  return computed(() => ({ ...zhCN, ...toValue(config).locale }));
}
export const CrudConfigProvider = defineComponent({
  name: 'CrudConfigProvider',
  props: { locale: Object as PropType<Partial<CrudLocale>> },
  setup(props, { slots }) {
    const parent = inject(configKey, {});
    // 逐层合并且保持响应式，多个应用或局部语言切换互不污染。
    provide(
      configKey,
      computed(() => ({
        locale: { ...toValue(parent).locale, ...props.locale },
      })),
    );
    return () => slots.default?.();
  },
});
