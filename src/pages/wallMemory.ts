/**
 * 首页时间绳展开到哪一层、选中的是哪一件。放在模块里，看大图、左右换一件再回画廊时还在；
 * 刷新页面才清空，回到默认（展开最新的一件）。
 */
export const wallMemory: { open?: string[]; picked?: string } = {};
