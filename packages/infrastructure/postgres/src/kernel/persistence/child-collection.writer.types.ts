import type {EntityTarget, ObjectLiteral} from 'typeorm'

export type ReplaceChildrenOptions<TChild extends ObjectLiteral> = {
  readonly childEntity: EntityTarget<TChild>
  readonly parentIdColumn: keyof TChild & string
  readonly parentId: string
  readonly buildChildren: () => TChild[]
}

export type DeleteParentAndChildrenOptions<TParent extends ObjectLiteral, TChild extends ObjectLiteral> = {
  readonly parentEntity: EntityTarget<TParent>
  readonly parentId: string
  readonly childEntity: EntityTarget<TChild>
  readonly parentIdColumn: keyof TChild & string
}
