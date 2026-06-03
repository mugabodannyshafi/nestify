export function createInterceptorTemplate(name: string): string {
  const className = toPascalCase(name);
  return `import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class ${className}Interceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle();
  }
}
`;
}

export function createInterceptorSpecTemplate(name: string): string {
  const className = toPascalCase(name);
  return `import { ${className}Interceptor } from './${name}.interceptor';

describe('${className}Interceptor', () => {
  let interceptor: ${className}Interceptor;

  beforeEach(() => {
    interceptor = new ${className}Interceptor();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });
});
`;
}

function toPascalCase(str: string): string {
  return str
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}
