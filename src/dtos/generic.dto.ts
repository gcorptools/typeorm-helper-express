import { JsonIgnoreMixins, MappedMixins } from '../mixins';

export class GenericDto extends JsonIgnoreMixins(MappedMixins()) {}
