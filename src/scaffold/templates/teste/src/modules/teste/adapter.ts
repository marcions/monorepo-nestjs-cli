import { ApiTrancingInput } from 'libs/utils/request';

  import { TesteCreateInput, TesteCreateOutput } from '../../core/use-cases/teste-create';
  import { TesteDeleteInput, TesteDeleteOutput } from '../../core/use-cases/teste-delete';
  import { TesteGetByIDInput, TesteGetByIDOutput } from '../../core/use-cases/teste-getByID';
  import { TesteListInput, TesteListOutput } from '../../core/use-cases/teste-list';
  import { TesteUpdateInput, TesteUpdateOutput } from '../../core/use-cases/teste-update';
  
  export abstract class ITesteCreateAdapter {
    abstract execute(input: TesteCreateInput, trace: ApiTrancingInput): Promise<TesteCreateOutput>;
  }
  
  export abstract class ITesteUpdateAdapter {
    abstract execute(input: TesteUpdateInput, trace: ApiTrancingInput): Promise<TesteUpdateOutput>;
  }
  
  export abstract class ITesteGetByIDAdapter {
    abstract execute(input: TesteGetByIDInput): Promise<TesteGetByIDOutput>;
  }
  
  export abstract class ITesteListAdapter {
    abstract execute(input: TesteListInput): Promise<TesteListOutput>;
  }
  
  export abstract class ITesteDeleteAdapter {
    abstract execute(input: TesteDeleteInput, trace: ApiTrancingInput): Promise<TesteDeleteOutput>;
  }
    
