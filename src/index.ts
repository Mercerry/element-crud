import type { App } from 'vue';
import ElementCrud from './components/element-crud/ElementCrud.vue';
import SchemaForm from './components/element-crud/SchemaForm.vue';
import SchemaFormDialog from './components/element-crud/SchemaFormDialog.vue';
import SchemaFormBase from './components/element-crud/SchemaFormBase.vue';

export * from './components/element-crud/types';
export {
  ElementCrud,
  SchemaForm,
  SchemaFormDialog,
  SchemaFormBase,
  SchemaForm as CrudForm,
  SchemaFormDialog as CrudFormDialog,
  SchemaFormBase as CrudSchemaForm,
};

export default {
  install(app: App) {
    app.component('ElementCrud', ElementCrud);
    app.component('SchemaForm', SchemaForm);
    app.component('SchemaFormDialog', SchemaFormDialog);
    app.component('SchemaFormBase', SchemaFormBase);
    app.component('CrudForm', SchemaForm);
    app.component('CrudFormDialog', SchemaFormDialog);
    app.component('CrudSchemaForm', SchemaFormBase);
  },
};
