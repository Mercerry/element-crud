import { rmSync } from 'node:fs';
// 清理旧声明，避免重命名组件的历史类型进入新安装包；示例构建单独保留。
rmSync(new URL('../dist/types', import.meta.url), {
  recursive: true,
  force: true,
});
