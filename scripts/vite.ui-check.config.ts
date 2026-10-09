/**
 * vite.ui-check.config.ts — 只服务于 scripts/ui-render-check.tsx 的构建配置。
 *
 * 为什么需要单独一份配置：zustand v5 的 `useStore` 把 `getInitialState()` 当作
 * useSyncExternalStore 的 server snapshot（这是为了 SSR 水合不闪烁），于是
 * 在 react-dom/server 下**永远读到 store 的初始状态**，`setState` 出来的战斗
 * 根本渲染不出来——渲染冒烟检查会全部误报为"空面板"。
 *
 * 这里用一个极小的 zustand 垫片替换它：server snapshot 也走 getState()。
 * 只覆盖本项目用到的 API（create / useStore / setState / getState / subscribe），
 * 不引第三方依赖。生产构建完全不经过这份配置。
 */
import { defineConfig } from 'vite';

/** 垫片源码（虚拟模块，避免在 src 里留一个只为测试存在的文件） */
const ZUSTAND_SHIM = `
import { useSyncExternalStore } from 'react';

export function create(initializer) {
  const listeners = new Set();
  let state;
  const getState = () => state;
  const setState = (partial, replace) => {
    const next = typeof partial === 'function' ? partial(state) : partial;
    state = replace ? next : Object.assign({}, state, next);
    listeners.forEach((l) => l());
  };
  const subscribe = (l) => {
    listeners.add(l);
    return () => { listeners.delete(l); };
  };
  const api = { setState, getState, subscribe, getInitialState: getState, destroy: () => {} };
  state = initializer(setState, getState, api);
  const useBoundStore = (selector) =>
    useSyncExternalStore(
      subscribe,
      () => (selector ? selector(getState()) : getState()),
      () => (selector ? selector(getState()) : getState()),
    );
  useBoundStore.setState = setState;
  useBoundStore.getState = getState;
  useBoundStore.subscribe = subscribe;
  useBoundStore.getInitialState = getState;
  return useBoundStore;
}

export const useStore = (api, selector) => useSyncExternalStore(
  api.subscribe,
  () => selector(api.getState()),
  () => selector(api.getState()),
);

export default { create, useStore };
`;

export default defineConfig({
  plugins: [
    {
      name: 'zustand-ssr-shim',
      enforce: 'pre',
      resolveId(id) {
        if (id === 'zustand') return '\0zustand-shim';
        return null;
      },
      load(id) {
        if (id === '\0zustand-shim') return ZUSTAND_SHIM;
        return null;
      },
    },
  ],
  build: {
    ssr: 'scripts/ui-render-check.tsx',
    outDir: '.tmp-ui-check',
    emptyOutDir: true,
  },
  logLevel: 'warn',
});
