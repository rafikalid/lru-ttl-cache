import { Metadata, ResolverResultType } from '../core/types';

export interface ExtendedResolverResultType<K, V> extends ResolverResultType<K, V> {
  weight?: number;
  isPermanent?: boolean;
}

/** Saved value metadata */
export interface ExtendedMetadata<K, V> extends Metadata<K, V> {
  /** Item weight @default 1 */
  weight: number;
  /** is permanent item or temporary @default false */
  isPermanent: boolean;
}
