import cloneDeep from 'lodash.clonedeep';
import type { CrudFormSchema, CrudRecord } from './types';

// 字段统一支持 user.name / rows[0].name；拒绝原型链路径，避免配置污染对象原型。
function parts(path: string): string[] {
  const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  if (
    keys.some(
      (key) => !key || ['__proto__', 'prototype', 'constructor'].includes(key),
    )
  ) {
    throw new Error(`Invalid field path: ${path}`);
  }
  return keys;
}
export function getField(
  model: CrudRecord | undefined | null,
  path: string,
): any {
  return parts(path).reduce((value, key) => value?.[key], model as any);
}
export function hasField(model: CrudRecord, path: string): boolean {
  let value: any = model;
  for (const key of parts(path)) {
    if (value == null || !Object.prototype.hasOwnProperty.call(value, key))
      return false;
    value = value[key];
  }
  return true;
}
export function setField(
  model: CrudRecord,
  path: string,
  value: unknown,
): void {
  const keys = parts(path);
  let target = model;
  keys.forEach((key, index) => {
    if (index === keys.length - 1) target[key] = value;
    else {
      // 拷贝修改路径，不能经浅拷贝模型修改宿主记录中的嵌套引用。
      const current = target[key];
      target[key] = Array.isArray(current)
        ? [...current]
        : current && typeof current === 'object'
          ? { ...current }
          : /^\d+$/.test(keys[index + 1])
            ? []
            : {};
      target = target[key];
    }
  });
}
export function removeField(model: CrudRecord, path: string): void {
  if (!hasField(model, path)) return;
  const keys = parts(path);
  const last = keys.pop()!;
  if (!keys.length) {
    delete model[last];
    return;
  }
  const parent = getField(model, keys.join('.'));
  const copy = Array.isArray(parent) ? [...parent] : { ...parent };
  delete copy[last];
  setField(model, keys.join('.'), copy);
}
export function withDefaults(
  model: CrudRecord,
  schemas: CrudFormSchema[],
): CrudRecord {
  const result = { ...model };
  for (const schema of schemas) {
    if (
      schema.kind !== 'content' &&
      schema.defaultValue !== undefined &&
      !hasField(result, String(schema.field))
    ) {
      setField(result, String(schema.field), cloneDeep(schema.defaultValue));
    }
  }
  return result;
}
export class CrudNotReadyError extends Error {
  readonly code = 'CRUD_NOT_READY';
  constructor() {
    super('CRUD component is not mounted');
    this.name = 'CrudNotReadyError';
  }
}

/** 保留 reactive 对象身份，避免 v-model 替换对象后旧 watcher 失效。 */
export function replaceModel(target: CrudRecord, value: CrudRecord) {
  if (target === value) return;
  for (const key of Object.keys(target)) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) delete target[key];
  }
  Object.assign(target, value);
}
