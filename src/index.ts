import type { App, MaybeRefOrGetter } from 'vue';
import {
  installCrudConfig,
  type CrudConfig,
} from './components/element-crud/config';
export * from './components/element-crud/config';
import DynamicTable from './components/element-crud/DynamicTable.vue';
import DynamicDetail from './components/element-crud/DynamicDetail.vue';
import SchemaForm from './components/element-crud/SchemaForm.vue';
import SchemaFormDialog from './components/element-crud/SchemaFormDialog.vue';
import SchemaFormBase from './components/element-crud/SchemaFormBase.vue';

export * from './components/element-crud/types';
export * from './components/element-crud/hooks';
export {
  DynamicTable,
  DynamicDetail,
  SchemaForm,
  SchemaFormDialog,
  SchemaFormBase,
  SchemaForm as CrudForm,
  SchemaFormDialog as CrudFormDialog,
  SchemaFormBase as CrudSchemaForm,
};

export default {
  install(app: App, config: MaybeRefOrGetter<CrudConfig> = {}) {
    installCrudConfig(app, config);
    app.component('DynamicTable', DynamicTable);
    app.component('DynamicDetail', DynamicDetail);
    app.component('SchemaForm', SchemaForm);
    app.component('SchemaFormDialog', SchemaFormDialog);
    app.component('SchemaFormBase', SchemaFormBase);
    app.component('CrudForm', SchemaForm);
    app.component('CrudFormDialog', SchemaFormDialog);
    app.component('CrudSchemaForm', SchemaFormBase);
  },
};
