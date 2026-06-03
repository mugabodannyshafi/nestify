export function createGuardTemplate(name: string): string {
  const className = toPascalCase(name);
  return `import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class ${className}Guard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return true;
  }
}
`;
}

export function createGuardSpecTemplate(name: string): string {
  const className = toPascalCase(name);
  return `import { ${className}Guard } from './${name}.guard';

describe('${className}Guard', () => {
  let guard: ${className}Guard;

  beforeEach(() => {
    guard = new ${className}Guard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true', () => {
    const mockContext = {} as any;
    expect(guard.canActivate(mockContext)).toBe(true);
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
