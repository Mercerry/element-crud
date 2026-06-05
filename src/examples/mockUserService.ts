import type { CrudListResult, CrudRequestParams } from '@/components/element-crud';

export interface MockUser {
  id: number;
  username: string;
  nickname: string;
  deptId: number;
  role: 'admin' | 'auditor' | 'operator';
  status: 'enabled' | 'disabled';
  profileProgress: number;
  phone: string;
  email: string;
  createdAt: string;
  remark?: string;
}

const roleNames: Record<MockUser['role'], string> = {
  admin: '管理员',
  auditor: '审计员',
  operator: '运营人员',
};

const statusNames: Record<MockUser['status'], string> = {
  enabled: '启用',
  disabled: '停用',
};

let idSeed = 1000;
let users = createMockUsers(57);

function createMockUsers(count: number): MockUser[] {
  const names = ['mercury', 'atlas', 'nova', 'river', 'stone', 'luna', 'orbit', 'pixel'];
  const roles: MockUser['role'][] = ['admin', 'auditor', 'operator'];

  return Array.from({ length: count }).map((_, index) => {
    const id = ++idSeed;
    const role = roles[index % roles.length];

    return {
      id,
      username: `${names[index % names.length]}_${id}`,
      nickname: `用户 ${index + 1}`,
      deptId: (index % 4) + 1,
      role,
      status: index % 5 === 0 ? 'disabled' : 'enabled',
      profileProgress: 45 + (index % 11) * 5,
      phone: `138${String(10000000 + index * 37).slice(0, 8)}`,
      email: `${names[index % names.length]}${id}@example.com`,
      createdAt: `2026-05-${String((index % 28) + 1).padStart(2, '0')}`,
      remark: `${roleNames[role]} mock 数据`,
    };
  });
}

export async function queryUsers(params: CrudRequestParams): Promise<CrudListResult<MockUser>> {
  await sleep(240);

  const {
    page,
    pageSize,
    username,
    nickname,
    deptId,
    role,
    status,
    phone,
    email,
    createdAt,
    profileProgressOperator,
    profileProgressValue,
  } = params;

  // mock 过滤逻辑尽量贴近真实接口：先筛选，再按 page/pageSize 截取。
  const filtered = users.filter((item) => {
    const matchUsername = username ? item.username.includes(String(username)) : true;
    const matchNickname = nickname ? item.nickname.includes(String(nickname)) : true;
    const matchDept = deptId ? item.deptId === Number(deptId) : true;
    const matchRole = role ? item.role === role : true;
    const matchStatus = status ? item.status === status : true;
    const matchPhone = phone ? item.phone.includes(String(phone)) : true;
    const matchEmail = email ? item.email.includes(String(email)) : true;
    const matchCreatedAt = createdAt ? item.createdAt === String(createdAt) : true;
    const matchProgress =
      profileProgressValue !== undefined && profileProgressValue !== ''
        ? compareProgress(item.profileProgress, Number(profileProgressValue), String(profileProgressOperator || 'gte'))
        : true;

    return (
      matchUsername &&
      matchNickname &&
      matchDept &&
      matchRole &&
      matchStatus &&
      matchPhone &&
      matchEmail &&
      matchCreatedAt &&
      matchProgress
    );
  });

  const start = (page - 1) * pageSize;

  return {
    list: filtered.slice(start, start + pageSize),
    total: filtered.length,
  };
}

function compareProgress(current: number, target: number, operator: string) {
  if (operator === 'lte') {
    return current <= target;
  }

  if (operator === 'eq') {
    return current === target;
  }

  return current >= target;
}

export async function createUser(values: Partial<MockUser>) {
  await sleep(160);
  users.unshift({
    id: ++idSeed,
    username: String(values.username || ''),
    nickname: String(values.nickname || ''),
    deptId: Number(values.deptId || 1),
    role: (values.role as MockUser['role']) || 'operator',
    status: (values.status as MockUser['status']) || 'enabled',
    profileProgress: Number(values.profileProgress || 60),
    phone: String(values.phone || ''),
    email: String(values.email || ''),
    createdAt: String(values.createdAt || new Date().toISOString().slice(0, 10)),
    remark: String(values.remark || ''),
  });
}

export async function updateUser(values: Partial<MockUser>, row: MockUser) {
  await sleep(160);
  users = users.map((item) => (item.id === row.id ? ({ ...item, ...values, id: row.id } as MockUser) : item));
}

export async function removeUser(row: MockUser) {
  await sleep(120);
  users = users.filter((item) => item.id !== row.id);
}

export function getRoleName(role: MockUser['role']) {
  return roleNames[role] || role;
}

export function getStatusName(status: MockUser['status']) {
  return statusNames[status] || status;
}

export function getDeptName(deptId: number) {
  return deptTree
    .flatMap((item) => [item, ...(item.children || [])])
    .find((item) => item.value === deptId)?.label || '-';
}

export const deptTree = [
  {
    label: '总部',
    value: 1,
    children: [
      { label: '安全运营部', value: 2 },
      { label: '数据治理部', value: 3 },
    ],
  },
  { label: '华东分部', value: 4 },
];

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
