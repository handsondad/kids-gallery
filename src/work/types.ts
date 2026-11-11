/**
 * 一件作品 = 一份数据 + 一张照片。agent 只写这份数据，页面按数据排出来。
 * 照片放在 public/works/<id>/，用 npm run photo 处理（缩小、去掉拍摄信息）。
 */
import type { CreatorId, Kind } from "./vocab.ts";

export type Work = {
  /** 和目录名一样，小写字母和短横线 */
  readonly id: string;
  /** 作品名，最好是小念自己起的，≤12 个字 */
  readonly title: string;
  /** 一句话来历：在哪儿、为什么做的，大人写，≤40 个字 */
  readonly about: string;
  /** 小念的原话，不改字，≤40 个字；没有就不写 */
  readonly said?: string;
  /**
   * 用小念的口吻介绍这件作品，作品页上能点开听（npm run voice 配音）。≤60 个字，短句、孩子的说法。
   * 可以是大人照着 notes.md 代写的，但只写真发生过的事，写完念给小念听，他点头才发布
   */
  readonly intro?: string;
  /** 做出来的那天。首页的时间绳按这个排 */
  readonly when: {
    /** YYYY-MM-DD */
    readonly date: string;
    /** 那天是什么日子，比如「六一儿童节」，≤8 个字 */
    readonly label?: string;
    /** 只记得大概：date 只用来排先后，页面上只写到「几月前后」 */
    readonly approx?: boolean;
  };
  readonly kind: Kind;
  /** 用什么做的，比如「水彩 + 蜡笔」，≤10 个字 */
  readonly medium: string;
  /** 谁做的：必须有小念，大人一起动手了才加 dad / mom / laoye */
  readonly by: readonly CreatorId[];
  /** public/works/<id>/ 下的文件名，一般是 photo.jpg */
  readonly photo: string;
  /** 照片上是什么，给看不见图的人读，≤40 个字 */
  readonly alt: string;
  /** 同一天在《小念家的漫画书》里有故事：写那个故事的 id */
  readonly story?: string;
};
